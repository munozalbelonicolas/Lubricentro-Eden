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
    role: "user",
    content: `Sos un experto automotriz especializado en especificaciones técnicas de fábrica.
Tu tarea: indicar el aceite EXACTO que especifica el fabricante en el manual oficial del ${vehiculo} con motor ${motor}.

REGLAS — seguí esto al pie de la letra:

1. VISCOSIDAD: usá la viscosidad REAL del manual, no genérica.
   Ejemplos reales por motor:
   - Fiat 1.4 Fire (pre-2010): 15W-40 mineral o 10W-40 semisintético
   - Fiat 1.4 Fire Evo (post-2010): 5W-40
   - Fiat 1.6 E.torQ: 5W-30
   - VW 1.6 MSI: 5W-40
   - Ford 1.0 EcoBoost: 5W-20 o 5W-30
   - Toyota 2.7 gasolina: 5W-30
   - Chevrolet 1.4 Turbo: 5W-30 dexos1
   NUNCA pongas 5W-30 si el motor usa otra viscosidad. Investigá cuál es la correcta.

2. MARCA: la que aprueba el fabricante (Ford→Motorcraft, Fiat→Petronas/Tutela, VW→Castrol/Liqui Moly, Toyota→Toyota Genuine/Mobil, Renault→Elf, Chevrolet→ACDelco). NO defaultees a Castrol.

3. ESPECIFICACIÓN: norma OEM real (FIAT 9.55535-GH, VW 502.00, dexos1 Gen2, MB 229.5, etc.)

4. INTERVALO: el oficial del fabricante para Argentina (no uses 10.000 km como genérico).

Respondé SOLO con este JSON válido, con los valores reales del manual (NO copies el ejemplo):
{
  "motor": "nombre real del motor",
  "viscosidad": "viscosidad real según manual",
  "tipo": "tipo real (sintetico/semisintetico/mineral/diesel/moto)",
  "marca_fabrica": "marca real aprobada por el fabricante",
  "especificacion": "norma OEM real",
  "intervalo_km": numero_real,
  "intervalo_meses": numero_real,
  "nota": "explicación técnica basada en el manual, mencionando por qué esa viscosidad"
}`,
  }], { maxTokens: 500, temperature: 0.2, jsonMode: true });

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

module.exports = { detectVehicle, fetchMotorizations, recommendOil, generalChat, callGroq };