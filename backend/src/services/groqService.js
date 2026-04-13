// src/services/groqService.js
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const MAX_RETRIES = 2;
const TIMEOUT_MS = 12000;

/**
 * Llamada base a Groq con reintentos automáticos y timeout.
 * @param {Array}  messages   - Array de { role, content }
 * @param {Object} options    - { maxTokens, temperature, jsonMode }
 */
const callGroq = async (messages, options = {}) => {
  const { maxTokens = 600, temperature = 0.4, jsonMode = false } = options;

  const body = {
    model: GROQ_MODEL,
    messages,
    max_tokens: maxTokens,
    temperature,
    ...(jsonMode && { response_format: { type: "json_object" } }),
  };

  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Groq API error ${res.status}: ${err?.error?.message || res.statusText}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";

    } catch (err) {
      lastError = err;
      // No reintenta si fue abort (timeout) o error 400 (prompt inválido)
      if (err.name === "AbortError" || err.message.includes("400")) break;
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1))); // backoff
      }
    }
  }

  throw lastError;
};

/**
 * Parsea JSON de la respuesta de Groq de forma segura.
 */
const parseJSON = (raw) => {
  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
};

// ── Intents específicos ────────────────────────────────────────────────────

/**
 * Detecta si el mensaje menciona un vehículo concreto.
 * Retorna: { es_vehiculo, marca, modelo, anio }
 */
const detectVehicle = async (message) => {
  const raw = await callGroq([{
    role: "user",
    content: `Analizá este mensaje. Respondé SOLO con JSON válido.
Mensaje: "${message}"
Si menciona vehículo con marca+modelo: {"es_vehiculo":true,"marca":"...","modelo":"...","anio":"..."}
Si no hay año: anio:"". Si no es vehículo: {"es_vehiculo":false}`,
  }], { maxTokens: 120, jsonMode: true });

  return parseJSON(raw) || { es_vehiculo: false };
};

/**
 * Trae todas las motorizaciones de un vehículo.
 * Retorna: { vehiculo, motores: [...], conocido }
 */
const fetchMotorizations = async (marca, modelo, anio) => {
  const anioT = anio ? ` ${anio}` : "";
  const raw = await callGroq([{
    role: "user",
    content: `Experto automotriz. Motorizaciones del ${marca} ${modelo}${anioT} en Argentina.
Respondé SOLO con JSON válido:
{"vehiculo":"${marca} ${modelo}${anioT}","motores":["1.0 Fire Flex","1.3 GSE Turbo"],"conocido":true}
Si no conocés el modelo: {"conocido":false}`,
  }], { maxTokens: 300, jsonMode: true });

  return parseJSON(raw) || { conocido: false };
};

/**
 * Recomienda el aceite de fábrica para un motor específico.
 * Retorna objeto con viscosidad, tipo, marca_fabrica, etc.
 */
const recommendOil = async (vehiculo, motor) => {
  const raw = await callGroq([{
    role: "system",
    content: `Sos un experto automotriz con acceso a los manuales oficiales de cada fabricante. 
Tu única función es indicar las especificaciones EXACTAS de aceite según el manual oficial del vehículo consultado.
NUNCA uses valores genéricos. NUNCA defaultees a 5W-30 si el motor usa otra viscosidad.
Si no tenés certeza absoluta del dato, indicalo en el campo "nota" pero igualmente buscá el valor más preciso posible.`,
  }, {
    role: "user",
    content: `Necesito las especificaciones exactas de aceite para: ${vehiculo} con motor ${motor}.

Investigá específicamente para ese motor y ese vehículo. Tené en cuenta:
- Motores pequeños turbo modernos (1.0, 1.2 TSI/EcoBoost/etc): suelen pedir 0W-20 o 0W-30
- Motores nafteros atmosféricos viejos (Fire, OHV, etc): suelen pedir 15W-40 o 10W-40
- Motores diesel: suelen pedir 5W-40 con norma específica (505.01, 507.00, etc)
- Motores híbridos Toyota: casi siempre 0W-20
- La marca aprobada NO siempre es Castrol. Cada fabricante tiene la suya.

Respondé SOLO con JSON válido, sin texto adicional:
{
  "motor": "nombre exacto del motor",
  "viscosidad": "viscosidad real según manual oficial",
  "tipo": "sintetico | semisintetico | mineral",
  "marca_fabrica": "marca aprobada por el fabricante para este motor",
  "especificacion": "norma OEM exacta (ej: VW 502.00, FIAT 9.55535-S1, dexos1 Gen2, MB 229.5)",
  "intervalo_km": numero,
  "intervalo_meses": numero,
  "nota": "detalle técnico del por qué de esa viscosidad según el manual"
}`,
  }], { maxTokens: 500, temperature: 0.3, jsonMode: true });

  return parseJSON(raw);
};

/**
 * Responde preguntas generales sobre aceites (conversación libre).
 */
const SYSTEM_PROMPT = `Sos Yor, asistente técnico de Lubricentro Edén.
Especialidad: aceites y lubricantes. Respondés preguntas técnicas sobre viscosidades, intervalos de cambio, tipos de aceite, señales de cambio, diferencias entre marcas y más.

TONO Y ESTILO — seguí estas reglas siempre:
- Usá español rioplatense (vos, tenés, usás) pero de forma profesional.
- PROHIBIDO usar la palabra "che". Nunca, bajo ningún contexto.
- Sin muletillas ni frases de relleno ("claro que sí", "por supuesto", "¡genial!").
- Directo al punto. Máximo 4-5 oraciones salvo que se pida explicación detallada.
- Emojis con moderación: máximo 1-2 por mensaje, solo cuando aporten.`;

const generalChat = async (history, vehiculoContext = null) => {
  // Si hay contexto de vehículo activo en la sesión, lo inyectamos en el system prompt
  // para que Yor no invente recomendaciones genéricas cuando el cliente hace preguntas de seguimiento
  const contextExtra = vehiculoContext
    ? `\n\nCONTEXTO ACTIVO DE SESIÓN: El cliente está consultando sobre el ${vehiculoContext}. Si hace preguntas de seguimiento como "alguna recomendación", "qué me conviene" o similares, respondé en base a ese vehículo específico. NUNCA inventes viscosidades genéricas ni recomiendes marcas al azar.`
    : "";

  return await callGroq(
    [{ role: "system", content: SYSTEM_PROMPT + contextExtra }, ...history],
    { maxTokens: 500, temperature: 0.7 }
  );
};
/**
 * Detecta si el usuario quiere agendar un turno/visita.
 * Retorna: { quiere_turno: true/false }
 */
const detectBookingIntent = async (message) => {
  const raw = await callGroq([{
    role: "user",
    content: `Analizá este mensaje de un cliente de un lubricentro. Respondé SOLO con JSON válido.
Mensaje: "${message}"
Si el cliente quiere agendar un turno, visita, cita, reservar, sacar turno, o pedir una fecha para un servicio:
{"quiere_turno":true}
Si NO quiere agendar: {"quiere_turno":false}`,
  }], { maxTokens: 60, jsonMode: true });

  return parseJSON(raw) || { quiere_turno: false };
};

module.exports = { detectVehicle, fetchMotorizations, recommendOil, generalChat, callGroq, detectBookingIntent };