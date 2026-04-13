'use strict';
const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Middleware genérico para manejar errores de express-validator.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  // Extraemos el primer error para una respuesta más limpia
  const firstError = errors.array()[0].msg;
  next(new AppError(firstError, 400));
};

module.exports = validate;
