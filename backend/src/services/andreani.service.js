'use strict';

const axios = require('axios');

// ── Configuración ──────────────────────────────────────────────────────────
const ANDREANI_BASE_URL = process.env.ANDREANI_API_URL || 'https://apis.andreani.com';
const ANDREANI_USER     = process.env.ANDREANI_USER     || '';
const ANDREANI_PASS     = process.env.ANDREANI_PASS     || '';
const ANDREANI_CONTRACT = process.env.ANDREANI_CONTRACT || ''; // Número de contrato

// ── Cache de token (vigencia 24 hs) ───────────────────────────────────────
let _cachedToken    = null;
let _tokenExpiresAt = 0;

/**
 * Obtiene un access token de Andreani.
 * Reutiliza el token en cache si todavía es válido.
 */
async function getToken() {
  if (_cachedToken && Date.now() < _tokenExpiresAt) {
    return _cachedToken;
  }

  if (!ANDREANI_USER || !ANDREANI_PASS) {
    throw new Error('ANDREANI_USER y ANDREANI_PASS no están configurados en las variables de entorno.');
  }

  const { data } = await axios.get(`${ANDREANI_BASE_URL}/v2/login`, {
    auth: { username: ANDREANI_USER, password: ANDREANI_PASS },
    timeout: 8000,
  });

  _cachedToken    = data?.access_token || data?.token;
  // Expiramos 5 minutos antes para evitar edge cases
  _tokenExpiresAt = Date.now() + (23 * 60 + 55) * 60 * 1000;

  return _cachedToken;
}

/**
 * Construye los headers estándar con el token de Andreani.
 */
async function getHeaders() {
  const token = await getToken();
  return {
    'x-authorization-token': token,
    'Content-Type': 'application/json',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TARIFAS DE FALLBACK (cuando Andreani no está configurado o falla)
// Usamos una tabla simplificada de zonas de Argentina divididas por CP prefix.
// Todas las tarifas son estimadas en ARS y se actualizan vía `.env`.
// ─────────────────────────────────────────────────────────────────────────────
const ORIGIN_CP = process.env.ANDREANI_ORIGIN_CP || '5000'; // CP del lubricentro (Córdoba capital)
const FREE_SHIPPING_THRESHOLD = parseInt(process.env.FREE_SHIPPING_THRESHOLD || '70000', 10);

function getZoneFallback(cpDestino) {
  const cp = parseInt(cpDestino, 10);
  // Zona 1: Córdoba capital / área metropolitana
  if (cp >= 5000 && cp <= 5016) return { days: 1, label: 'Córdoba Capital', price: 3200 };
  // Zona 2: Interior de Córdoba
  if (cp >= 5100 && cp <= 5999) return { days: 2, label: 'Interior Córdoba', price: 4800 };
  // Zona 3: Buenos Aires provincia / CABA
  if ((cp >= 1000 && cp <= 1999) || (cp >= 6000 && cp <= 8999)) return { days: 3, label: 'Buenos Aires', price: 6200 };
  // Zona 4: Rosario / Santa Fe / Entre Ríos
  if (cp >= 2000 && cp <= 3999) return { days: 3, label: 'Litoral', price: 6500 };
  // Zona 5: NOA / NEA
  if (cp >= 4000 && cp <= 4999) return { days: 4, label: 'NOA/NEA', price: 7900 };
  // Zona 6: Cuyo / Mendoza
  if (cp >= 5400 && cp <= 5599) return { days: 4, label: 'Cuyo', price: 8200 };
  // Zona 7: Patagonia
  if (cp >= 8000 && cp <= 9499) return { days: 7, label: 'Patagonia', price: 10500 };
  // Zona 8: Tierra del Fuego
  if (cp >= 9400 && cp <= 9499) return { days: 10, label: 'Tierra del Fuego', price: 14900 };
  // Default
  return { days: 5, label: 'Interior del País', price: 8500 };
}

// ─────────────────────────────────────────────────────────────────────────────
// COTIZACIÓN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cotiza un envío con la API real de Andreani.
 *
 * @param {object} params
 * @param {string} params.cpDestino       - Código postal de destino
 * @param {number} params.pesoGramos      - Peso total del paquete en gramos
 * @param {number} params.largoCm         - Largo en cm
 * @param {number} params.anchoCm         - Ancho en cm
 * @param {number} params.altoCm          - Alto en cm
 * @param {number} params.valorDeclarado  - Valor declarado en ARS
 */
async function cotizarAndreani({ cpDestino, pesoGramos, largoCm, anchoCm, altoCm, valorDeclarado }) {
  const headers = await getHeaders();

  const payload = {
    cpDestino,
    cpOrigen: ORIGIN_CP,
    contrato: ANDREANI_CONTRACT,
    pesoPorProcesar: pesoGramos,
    volumenPorProcesar: { largo: largoCm, ancho: anchoCm, alto: altoCm },
    valorDeclarado,
  };

  const { data } = await axios.post(
    `${ANDREANI_BASE_URL}/v2/tarifas`,
    payload,
    { headers, timeout: 10000 }
  );

  return data;
}

/**
 * Busca sucursales / puntos de retiro de Andreani cercanos a un CP.
 *
 * @param {string} cpDestino
 */
async function buscarSucursales(cpDestino) {
  const headers = await getHeaders();

  const { data } = await axios.get(
    `${ANDREANI_BASE_URL}/v1/sucursales`,
    {
      headers,
      params: { codigoPostal: cpDestino, tipo: 'SUCURSAL' },
      timeout: 10000,
    }
  );

  return Array.isArray(data) ? data : (data?.sucursales || []);
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL EXPORTADA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula el costo de envío. Intenta Andreani real; si no está configurado
 * o falla, usa la tabla de tarifas de fallback.
 *
 * @returns {object} { shipping, pickup, freeThreshold, source }
 */
async function calcularEnvio({ cpDestino, pesoGramos = 1000, largoCm = 20, anchoCm = 15, altoCm = 10, valorDeclarado = 0, config = {} }) {
  const { freeShippingThreshold = 70000, freeShippingEnabled = true } = config;
  const useRealApi = Boolean(ANDREANI_USER && ANDREANI_PASS && ANDREANI_CONTRACT);
  let shippingResult = null;
  let pickupResult   = null;
  let sucursales     = [];
  let source         = 'fallback';

  if (useRealApi) {
    try {
      // Cotización envío a domicilio
      const rawQuote = await cotizarAndreani({ cpDestino, pesoGramos, largoCm, anchoCm, altoCm, valorDeclarado });

      // Normalizar respuesta (Andreani puede devolver array o un objeto con tarifas)
      const tarifas = Array.isArray(rawQuote) ? rawQuote : (rawQuote?.tarifas || [rawQuote]);

      // Tomamos la tarifa más económica "domicilio"
      const domicilio = tarifas.find(t =>
        t.descripcion?.toLowerCase().includes('domicilio') ||
        t.tipo?.toLowerCase().includes('domicilio') ||
        t.servicio?.toLowerCase().includes('domicilio')
      ) || tarifas[0];

      shippingResult = {
        precio:    domicilio?.precio || domicilio?.tarifaFinal || domicilio?.total || 0,
        diasHabil: domicilio?.diasDeEntrega || domicilio?.plazoDias || 3,
        servicio:  domicilio?.descripcion || domicilio?.servicio || 'Andreani Domicilio',
      };

      // Cotización sucursal / punto de retiro
      const sucursal = tarifas.find(t =>
        t.descripcion?.toLowerCase().includes('suc') ||
        t.tipo?.toLowerCase().includes('pickup') ||
        t.servicio?.toLowerCase().includes('suc')
      );
      pickupResult = {
        precio:    sucursal?.precio || sucursal?.tarifaFinal || Math.round((shippingResult.precio || 0) * 0.7),
        diasHabil: sucursal?.diasDeEntrega || sucursal?.plazoDias || 2,
        servicio:  sucursal?.descripcion || 'Andreani Sucursal',
      };

      // Sucursales cercanas
      try {
        sucursales = await buscarSucursales(cpDestino);
      } catch (_) {
        sucursales = [];
      }

      source = 'andreani';
    } catch (err) {
      console.warn('⚠️  Andreani API falló, usando tarifas de fallback:', err.message);
      // caemos al fallback
    }
  }

  // Fallback si Andreani no está configurado o falló
  if (!shippingResult) {
    const zone = getZoneFallback(cpDestino);
    shippingResult = {
      precio:    zone.price,
      diasHabil: zone.days,
      servicio:  `Andreani Standard — ${zone.label}`,
    };
    pickupResult = {
      precio:    Math.round(zone.price * 0.72), // retiro ≈ 28% más barato
      diasHabil: Math.max(1, zone.days - 1),
      servicio:  'Retiro en Sucursal Andreani',
    };
    source = 'fallback';
  }

  // Aplicar envío gratis si supera el umbral y está habilitado
  const isFreeShipping = freeShippingEnabled && valorDeclarado >= freeShippingThreshold;
  if (isFreeShipping) {
    shippingResult.precio = 0;
  }

  return {
    shipping: shippingResult,
    pickup:   pickupResult,
    sucursales: sucursales.slice(0, 3), // máximo 3 sucursales
    freeThreshold: freeShippingThreshold,
    isFreeShipping,
    freeShippingEnabled,
    source,
  };
}

module.exports = { calcularEnvio };
