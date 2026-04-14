'use strict';

const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/User.model');

/**
 * Verifica el JWT y carga el usuario en req.user.
 * También verifica que el usuario pertenece al tenant activo.
 */
const protect = catchAsync(async (req, res, next) => {
  // 1. Extraer token
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('No estás autenticado. Inicia sesión para continuar.', 401));
  }

  // 2. Verificar token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Token inválido o expirado. Inicia sesión nuevamente.', 401));
  }

  // 3. Verificar que el usuario sigue existiendo y está activo
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('El usuario del token ya no existe.', 401));
  }
  if (!user.isActive) {
    return next(new AppError('Tu cuenta ha sido desactivada o suspendida. Acceso denegado.', 403));
  }

  // 4. Verificar que la contraseña no fue cambiada después del token
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Contraseña cambiada recientemente. Inicia sesión nuevamente.', 401));
  }

  // 5. Verificar que el usuario pertenece al tenant activo (seguridad cross-tenant)
  if (req.tenantId && user.tenantId) {
    if (user.tenantId.toString() !== req.tenantId.toString()) {
      return next(new AppError('Acceso denegado: no perteneces a esta tienda.', 403));
    }
  }

  req.user = user;
  next();
});

/**
 * Restricción por rol.
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('No tienes permisos para realizar esta acción.', 403));
  }
  next();
};

/**
 * Middleware opcional: carga req.user si el token es válido, 
 * pero permite continuar si no hay token o es inválido.
 */
const authOptional = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && !user.changedPasswordAfter(decoded.iat)) {
      req.user = user;
    }
  } catch (err) {
    // Ignoramos errores de token en modo opcional
  }
  
  next();
});

module.exports = { protect, restrictTo, authOptional };
