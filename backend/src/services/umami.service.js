'use strict';

/**
 * Servicio para interactuar con la API de Umami Cloud
 */
const getUmamiStats = async (startAt, endAt) => {
  const apiKey = process.env.UMAMI_API_KEY;
  const websiteId = process.env.UMAMI_WEBSITE_ID;

  if (!apiKey || !websiteId) {
    console.error('❌ Umami Error: Faltan las variables UMAMI_API_KEY o UMAMI_WEBSITE_ID');
    return null;
  }

  // Asegurar que sean números enteros (timestamps)
  const s = Math.floor(startAt);
  const e = Math.floor(endAt);

  const url = `https://api.umami.is/v1/websites/${websiteId}/stats?startAt=${s}&endAt=${e}`;
  
  try {
    console.log(`📡 Consultando Umami Stats: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-umami-api-key': apiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Umami API Error (${response.status}):`, errorText);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error('❌ Umami Service Error:', err.message);
    return null;
  }
};

const getUmamiPageviews = async (startAt, endAt, unit = 'month') => {
  const apiKey = process.env.UMAMI_API_KEY;
  const websiteId = process.env.UMAMI_WEBSITE_ID;

  if (!apiKey || !websiteId) return null;

  const s = Math.floor(startAt);
  const e = Math.floor(endAt);

  const url = `https://api.umami.is/v1/websites/${websiteId}/pageviews?startAt=${s}&endAt=${e}&unit=${unit}`;
  
  try {
    console.log(`📡 Consultando Umami Pageviews: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-umami-api-key': apiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Umami API Error (${response.status}):`, errorText);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error('❌ Umami Service Error:', err.message);
    return null;
  }
};

module.exports = {
  getUmamiStats,
  getUmamiPageviews
};
