'use strict';

/**
 * Servicio para interactuar con la API de Umami Cloud
 */
const getUmamiStats = async (startAt, endAt) => {
  const apiKey = process.env.UMAMI_API_KEY;
  const websiteId = process.env.UMAMI_WEBSITE_ID;

  if (!apiKey || !websiteId) {
    return null;
  }

  const url = `https://api.umami.is/v1/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-umami-api-key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Umami API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Error fetching Umami stats:', err.message);
    return null;
  }
};

const getUmamiPageviews = async (startAt, endAt, unit = 'month') => {
  const apiKey = process.env.UMAMI_API_KEY;
  const websiteId = process.env.UMAMI_WEBSITE_ID;

  if (!apiKey || !websiteId) {
    return null;
  }

  const url = `https://api.umami.is/v1/websites/${websiteId}/pageviews?startAt=${startAt}&endAt=${endAt}&unit=${unit}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-umami-api-key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Umami API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Error fetching Umami pageviews:', err.message);
    return null;
  }
};

module.exports = {
  getUmamiStats,
  getUmamiPageviews
};
