// src/services/groqService.js
const GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const MAX_RETRIES = 2;
const TIMEOUT_MS  = 12000;

/**
 * Llamada base a Groq con reintentos automáticos y timeout.
 * @param {Array}  messages   - Array de { role, content }
 * @param {Object} options    - { maxTokens, temperature, jsonMode }
 */
const callGroq = async (messages, options = {}) => {
  const { maxTokens = 600, temperature = 0.4, jsonMode = false } = options;

  const body = {
    model:       GROQ_MODEL,
    messages,
    max_tokens:  maxTokens,
    temperature,
    ...(jsonMode && { response_format: { type: "json_object" } }),
  };

  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(GROQ_URL, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          Authorization:   `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body:   JSON.stringify(body),
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
    role: "user",
    content: `Experto automotriz. Aceite de fábrica para ${vehiculo} con motor ${motor}.
Respondé SOLO con JSON válido:
{
  "motor":"${motor}",
  "viscosidad":"5W-30",
  "tipo":"sintetico",
  "marca_fabrica":"Castrol",
  "especificacion":"API SN / ACEA A3",
  "intervalo_km":10000,
  "intervalo_meses":12,
  "nota":"Razón técnica breve"
}
Tipos válidos: sintetico, semisintetico, mineral, diesel, moto`,
  }], { maxTokens: 350, jsonMode: true });

  return parseJSON(raw);
};

/**
 * Responde preguntas generales sobre aceites (conversación libre).
 */
const SYSTEM_PROMPT = `Sos Yor, asistente técnico de Lubricentro Edén.
Especialidad: aceites y lubricantes. Respondés preguntas técnicas sobre viscosidades, intervalos de cambio, tipos de aceite, señales de cambio, etc.
Estilo: amigable, directo, rioplatense. Máximo 4-5 oraciones. Emojis con moderación.`;

const generalChat = async (history) => {
  return await callGroq(
    [{ role: "system", content: SYSTEM_PROMPT }, ...history],
    { maxTokens: 500, temperature: 0.7 }
  );
};

module.exports = { detectVehicle, fetchMotorizations, recommendOil, generalChat, callGroq };
