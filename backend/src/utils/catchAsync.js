'use strict';

/**
 * Wrapper para capturar errores async en controllers sin try/catch repetitivos.
 * @param {Function} fn - Función async del controller
 * @returns {Function} Middleware de Express
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
