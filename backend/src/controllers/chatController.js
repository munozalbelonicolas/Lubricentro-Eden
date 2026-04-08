// src/controllers/chatController.js
const { v4: uuidv4 }       = require("uuid");
const ChatSession           = require("../models/ChatSession");
const VehicleCache          = require("../models/VehicleCache");
const {
  detectVehicle,
  fetchMotorizations,
  recommendOil,
  generalChat,
} = require("../services/groqService");

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

    // 3. Detectar si menciona un vehículo
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
          sessionId:  session.sessionId,
          type:       "motor_pick",
          message:    replyText,
          vehiculo:   cached.vehiculo,
          motores:    cached.motores.map(m => m.nombre),
        });
      }

      // Vehículo no conocido → fallback a chat general
      const fallback = `No tengo datos de ese modelo. ¿Podés decirme el tipo de motor (nafta, diesel, GNC) y el año?`;
      session.messages.push({ role: "assistant", content: fallback });
      await session.save();
      return res.json({ sessionId: session.sessionId, type: "text", message: fallback });
    }

    // ── Flujo B: pregunta general → chat libre ──
    const history = session.getTrimmedHistory();
    const reply   = await generalChat(history);
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
    const cached   = await VehicleCache.findOne({ cacheKey });
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
          { $set: {
            "motores.$.viscosidad":      reco.viscosidad,
            "motores.$.tipo":            reco.tipo,
            "motores.$.marca_fabrica":   reco.marca_fabrica,
            "motores.$.especificacion":  reco.especificacion,
            "motores.$.intervalo_km":    reco.intervalo_km,
            "motores.$.intervalo_meses": reco.intervalo_meses,
            "motores.$.nota":            reco.nota,
          }}
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
    session.messages.push({ role: "user",      content: motor });
    session.messages.push({ role: "assistant", content: replyText });
    await session.save();

    return res.json({
      sessionId,
      type:    "recommendation",
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
