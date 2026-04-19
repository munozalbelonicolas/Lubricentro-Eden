'use strict';

const AppError = require('../utils/AppError');

const handleCastErrorDB = (err) =>
  new AppError(`ID inválido: ${err.value}`, 400);

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'campo';
  const value = err.keyValue?.[field] || '';
  return new AppError(`El valor '${value}' ya está en uso para '${field}'.`, 409);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Datos inválidos: ${errors.join('. ')}`, 400);
};

const handleJWTError = () =>
  new AppError('Token inválido. Inicia sesión nuevamente.', 401);

const handleJWTExpiredError = () =>
  new AppError('Token expirado. Inicia sesión nuevamente.', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error('💥 Error no operacional:', err);
    // Para depuración de Cloudinary, enviamos el mensaje si existe.
    res.status(500).json({
      status: 'error',
      message: err.message || 'Ocurrió un error interno. Intenta nuevamente.',
    });
  }
};

const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

module.exports = errorMiddleware;
