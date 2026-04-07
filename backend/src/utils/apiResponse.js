'use strict';

/**
 * Respuesta de éxito estandarizada.
 */
const sendSuccess = (res, data, statusCode = 200, meta = {}) => {
  const response = { status: 'success', ...meta };
  if (data !== undefined) response.data = data;
  res.status(statusCode).json(response);
};

/**
 * Respuesta de error estandarizada.
 */
const sendError = (res, message, statusCode = 400) => {
  res.status(statusCode).json({ status: 'fail', message });
};

module.exports = { sendSuccess, sendError };
