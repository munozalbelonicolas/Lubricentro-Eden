// src/controllers/chatController.js
const { v4: uuidv4 } = require("uuid");
const ChatSession = require("../models/ChatSession");
const VehicleCache = require("../models/VehicleCache");
const Task = require("../models/Task.model");
const Tenant = require("../models/Tenant.model");
const {
  detectVehicle,
  fetchMotorizations,
  recommendOil,
  generalChat,
  detectBookingIntent,
} = require("../services/groqService");

// ── Booking flow helpers ──────────────────────────────────────────────────
const BOOKING_STEPS = ['nombre', 'email', 'telefono', 'vehiculo', 'patente', 'km', 'fecha', 'turno', 'confirmacion'];

const BOOKING_PROMPTS = {
  nombre:       "¡Perfecto! Vamos a agendar tu turno 📅\n\n¿Cuál es tu **nombre completo**?",
  email:        "¿Cuál es tu **email** de contacto?",
  telefono:     "¿Tu **número de teléfono**? (con código de área)",
  vehiculo:     "¿Qué **vehículo** tenés? (marca, modelo y año)",
  patente:      "¿Cuál es la **patente** del vehículo?",
  km:           "¿Cuántos **kilómetros** tiene actualmente?",
  fecha:        "¿Qué **fecha** te vendría bien? (formato: DD/MM/AAAA)",
  turno:        "¿Qué **turno** preferís?\n\n1️⃣ 08:00 a 10:00 hs\n2️⃣ 10:00 a 12:00 hs\n3️⃣ 14:00 a 16:00 hs\n4️⃣ 16:00 a 18:00 hs\n\n(Respondé con el número)",
  confirmacion: null, // se genera dinámicamente
};

const TURNO_MAP = {
  '1': '08:00-10:00',
  '2': '10:00-12:00',
  '3': '14:00-16:00',
  '4': '16:00-18:00',
};

const parseDate = (text) => {
  // Acepta DD/MM/AAAA, DD-MM-AAAA, DD.MM.AAAA
  const match = text.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (!match) return null;
  const [, d, m, y] = match;
  const day = d.padStart(2, '0');
  const month = m.padStart(2, '0');
  return `${y}-${month}-${day}`; // formato YYYY-MM-DD
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const generateConfirmationMsg = (data) => {
  const turnoLabel = Object.entries(TURNO_MAP).find(([, v]) => v === data.turno)?.[1] || data.turno;
  return `Revisá los datos de tu turno:\n\n` +
    `👤 **Nombre:** ${data.nombre}\n` +
    `📧 **Email:** ${data.email}\n` +
    `📱 **Teléfono:** ${data.telefono}\n` +
    `🚗 **Vehículo:** ${data.vehiculo}\n` +
    `🔢 **Patente:** ${data.patente}\n` +
    `🛣️ **KM Actual:** ${data.km}\n` +
    `📅 **Fecha:** ${data.fecha}\n` +
    `🕐 **Turno:** ${turnoLabel}\n\n` +
    `¿Confirmás el turno? (Sí / No)`;
};

/**
 * Procesa un paso del flujo de booking.
 * Retorna { reply, done, cancelled } 
 */
const processBookingStep = async (session, userMessage) => {
  const booking = session.booking;
  const step = booking.step;
  const msg = userMessage.trim();

  switch (step) {
    case 'nombre':
      if (msg.length < 2) return { reply: "Necesito tu nombre completo. ¿Cómo te llamás?" };
      booking.data.nombre = msg;
      booking.step = 'email';
      return { reply: BOOKING_PROMPTS.email };

    case 'email':
      if (!validateEmail(msg)) return { reply: "Ese email no parece válido. ¿Podés verificarlo?" };
      booking.data.email = msg.toLowerCase();
      booking.step = 'telefono';
      return { reply: BOOKING_PROMPTS.telefono };

    case 'telefono':
      if (msg.length < 6) return { reply: "El teléfono parece muy corto. Ingresá tu número completo con código de área." };
      booking.data.telefono = msg;
      booking.step = 'vehiculo';
      // Si ya hay vehículo en la sesión, pre-completar
      if (session.vehiculo) {
        booking.data.vehiculo = session.vehiculo;
        booking.step = 'patente';
        return { reply: `Ya tengo tu vehículo registrado: **${session.vehiculo}** ✅\n\n${BOOKING_PROMPTS.patente}` };
      }
      return { reply: BOOKING_PROMPTS.vehiculo };

    case 'vehiculo':
      if (msg.length < 3) return { reply: "Necesito saber marca, modelo y año del vehículo." };
      booking.data.vehiculo = msg;
      booking.step = 'patente';
      return { reply: BOOKING_PROMPTS.patente };

    case 'patente':
      if (msg.length < 4) return { reply: "La patente parece muy corta. Ingresala completa (ej: ABC 123 o AB123CD)." };
      booking.data.patente = msg.toUpperCase();
      booking.step = 'km';
      return { reply: BOOKING_PROMPTS.km };

    case 'km':
      const km = parseInt(msg.replace(/\D/g, ''), 10);
      if (isNaN(km) || km < 0) return { reply: "Ingresá solo el número de kilómetros (ej: 45000)." };
      booking.data.km = km;
      booking.step = 'fecha';
      return { reply: BOOKING_PROMPTS.fecha };

    case 'fecha':
      const fecha = parseDate(msg);
      if (!fecha) return { reply: "No pude entender la fecha. Usá el formato **DD/MM/AAAA** (ej: 15/04/2026)." };
      booking.data.fecha = fecha;
      booking.step = 'turno';
      return { reply: BOOKING_PROMPTS.turno };

    case 'turno':
      const turno = TURNO_MAP[msg.trim()];
      if (!turno) return { reply: "Elegí una opción válida (1, 2, 3 o 4)." };
      booking.data.turno = turno;
      booking.step = 'confirmacion';
      return { reply: generateConfirmationMsg(booking.data) };

    case 'confirmacion': {
      const yes = /^(s[ií]|si|confirmo|dale|ok|yes|claro|perfecto|listo)/i.test(msg);
      const no = /^(no|cancelar|cancel|anular)/i.test(msg);

      if (no) {
        booking.active = false;
        booking.step = null;
        return { reply: "Turno cancelado. Si necesitás agendar más adelante, avisame 👍", cancelled: true };
      }

      if (!yes) return { reply: "Respondé **Sí** para confirmar o **No** para cancelar." };

      // Crear la tarea en la base de datos
      try {
        // Buscar tenant y admin
        const tenant = await Tenant.findOne({ isActive: true });
        if (!tenant) throw new Error("No se encontró el tenant");

        const task = await Task.create({
          tenantId: tenant._id,
          createdBy: tenant.ownerId,
          title: `${booking.data.vehiculo} — Turno vía Chat`,
          description: `Turno agendado por el chatbot.\nCliente: ${booking.data.nombre}\nTeléfono: ${booking.data.telefono}\nEmail: ${booking.data.email}`,
          date: booking.data.fecha,
          timeSlot: booking.data.turno,
          plate: booking.data.patente,
          currentKm: booking.data.km,
          status: 'pending',
          priority: 'medium',
          customerName: booking.data.nombre,
          customerEmail: booking.data.email,
          customerPhone: booking.data.telefono,
        });

        booking.active = false;
        booking.step = null;

        return {
          reply: `✅ **¡Turno agendado con éxito!**\n\nTu turno para el **${booking.data.fecha}** en el horario **${booking.data.turno}** quedó registrado.\n\nTe esperamos en **Lubricentro Edén** 🛢️\nSi necesitás cancelar o modificar, contactanos por WhatsApp.`,
          done: true,
        };
      } catch (err) {
        console.error("[Booking] Error creando tarea:", err.message);
        booking.active = false;
        booking.step = null;
        return { reply: "❌ Hubo un error al registrar el turno. Por favor, contactanos por WhatsApp o teléfono para agendarlo manualmente." };
      }
    }

    default:
      booking.active = false;
      return { reply: "Algo salió mal con la reserva. ¿Querés intentar de nuevo?" };
  }
};

// ── POST /api/chat/message ─────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: "El mensaje no puede estar vacío." });
  }

  try {
    // 1. Obtener o crear sesión
    let session = await ChatSession.findOne({ sessionId });
    if (!session) {
      session = await ChatSession.create({ sessionId: sessionId || uuidv4() });
    }

    // 2. Guardar mensaje del usuario
    session.messages.push({ role: "user", content: message.trim() });

    // ── Flujo de Booking activo ──
    if (session.booking?.active) {
      const result = await processBookingStep(session, message.trim());
      session.messages.push({ role: "assistant", content: result.reply });
      await session.save();
      return res.json({ sessionId: session.sessionId, type: "text", message: result.reply });
    }

    // 3. Detectar intención de booking
    const bookingIntent = await detectBookingIntent(message.trim());
    if (bookingIntent.quiere_turno) {
      session.booking = { active: true, step: 'nombre', data: {} };
      const reply = BOOKING_PROMPTS.nombre;
      session.messages.push({ role: "assistant", content: reply });
      await session.save();
      return res.json({ sessionId: session.sessionId, type: "text", message: reply });
    }

    // 4. Detectar si menciona un vehículo
    const vehicleDetect = await detectVehicle(message.trim());

    // ── Flujo A: menciona vehículo → buscar motorizaciones ──
    if (vehicleDetect.es_vehiculo) {
      const { marca, modelo, anio } = vehicleDetect;
      const cacheKey = VehicleCache.buildKey(marca, modelo, anio);

      // Intentar desde caché primero
      let cached = await VehicleCache.findOne({ cacheKey });

      if (cached) {
        // Incrementar contador de hits
        await VehicleCache.updateOne({ cacheKey }, { $inc: { hits: 1 } });
      } else {
        // No está en caché → llamar a Groq
        const motorData = await fetchMotorizations(marca, modelo, anio);

        if (motorData.conocido && motorData.motores?.length) {
          cached = await VehicleCache.create({
            cacheKey,
            vehiculo: motorData.vehiculo,
            marca, modelo, anio,
            motores: motorData.motores.map(m => ({ nombre: m })),
            conocido: true,
          });
        }
      }

      if (cached?.conocido && cached.motores?.length) {
        const replyText = `Encontré las motorizaciones del **${cached.vehiculo}**. ¿Cuál de estas es la tuya?`;
        session.messages.push({ role: "assistant", content: replyText });
        session.vehiculo = cached.vehiculo;
        await session.save();

        return res.json({
          sessionId: session.sessionId,
          type: "motor_pick",
          message: replyText,
          vehiculo: cached.vehiculo,
          motores: cached.motores.map(m => m.nombre),
        });
      }

      // Vehículo no conocido → fallback a chat general
      const fallback = `No tengo datos de ese modelo. ¿Podés decirme el tipo de motor (nafta, diesel, GNC) y el año?`;
      session.messages.push({ role: "assistant", content: fallback });
      await session.save();
      return res.json({ sessionId: session.sessionId, type: "text", message: fallback });
    }

    // ── Flujo B: pregunta general → chat libre ──
    // Pasamos el vehículo activo en sesión como contexto para evitar respuestas genéricas
    const history = session.getTrimmedHistory();
    const reply = await generalChat(history, session.vehiculo || null);
    const replyText = reply || "No pude procesar tu consulta. Intentá de nuevo.";

    session.messages.push({ role: "assistant", content: replyText });
    await session.save();

    return res.json({ sessionId: session.sessionId, type: "text", message: replyText });

  } catch (err) {
    console.error("[chatController.sendMessage]", err.message);
    return res.status(500).json({ error: "Error interno. Intentá de nuevo en unos segundos." });
  }
};

// ── POST /api/chat/select-motor ────────────────────────────────────────────
exports.selectMotor = async (req, res) => {
  const { sessionId, motor } = req.body;

  if (!sessionId || !motor) {
    return res.status(400).json({ error: "sessionId y motor son requeridos." });
  }

  try {
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: "Sesión no encontrada." });
    }

    const vehiculo = session.vehiculo;
    if (!vehiculo) {
      return res.status(400).json({ error: "No hay vehículo en la sesión activa." });
    }

    // Intentar desde caché (el motor ya puede tener datos completos)
    const cacheKey = VehicleCache.buildKey(...vehiculo.split(" "));
    const cached = await VehicleCache.findOne({ cacheKey });
    const motorCached = cached?.motores?.find(
      m => m.nombre.toLowerCase() === motor.toLowerCase()
    );

    let reco;

    if (motorCached?.viscosidad) {
      // Ya tenemos los datos completos en caché
      reco = motorCached.toObject();
    } else {
      // Llamar a Groq para obtener la recomendación
      reco = await recommendOil(vehiculo, motor);

      // Persistir en el caché del vehículo
      if (reco && cached) {
        await VehicleCache.updateOne(
          { cacheKey, "motores.nombre": motor },
          {
            $set: {
              "motores.$.viscosidad": reco.viscosidad,
              "motores.$.tipo": reco.tipo,
              "motores.$.marca_fabrica": reco.marca_fabrica,
              "motores.$.especificacion": reco.especificacion,
              "motores.$.intervalo_km": reco.intervalo_km,
              "motores.$.intervalo_meses": reco.intervalo_meses,
              "motores.$.nota": reco.nota,
            }
          }
        );
      }
    }

    if (!reco) {
      return res.json({
        sessionId,
        type: "text",
        message: "No pude obtener la recomendación para ese motor. ¿Podés decirme si es nafta, diesel o GNC?",
      });
    }

    const replyText = `Para el **${vehiculo}** con motor **${motor}** esto es lo que especifica fábrica 👇`;
    session.messages.push({ role: "user", content: motor });
    session.messages.push({ role: "assistant", content: replyText });
    await session.save();

    return res.json({
      sessionId,
      type: "recommendation",
      message: replyText,
      vehiculo,
      reco,
    });

  } catch (err) {
    console.error("[chatController.selectMotor]", err.message);
    return res.status(500).json({ error: "Error interno. Intentá de nuevo." });
  }
};

// ── GET /api/chat/session/:sessionId ──────────────────────────────────────
exports.getSession = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ sessionId: req.params.sessionId })
      .select("sessionId messages vehiculo updatedAt");

    if (!session) return res.status(404).json({ error: "Sesión no encontrada." });
    return res.json(session);
  } catch (err) {
    return res.status(500).json({ error: "Error interno." });
  }
};