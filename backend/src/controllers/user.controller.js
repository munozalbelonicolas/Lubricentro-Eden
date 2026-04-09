'use strict';

const crypto = require('crypto');
const User = require('../models/User.model');
const Order = require('../models/Order.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { sendAdminCreatedUserEmail } = require('../utils/email.utils');

/**
 * Listar usuarios del tenant (Admins solo ven sus clientes)
 */
exports.getUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({ 
    tenantId: req.user.tenantId,
    _id: { $ne: req.user._id } // No listarse a sí mismo
  }).sort('-createdAt');

  res.json({
    status: 'success',
    results: users.length,
    data: { users }
  });
});

/**
 * Crear usuario manualmente (por Admin)
 */
exports.createUser = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, document, phone, address, birthDate } = req.body;

  // Generar contraseña aleatoria temporal de 10 caracteres
  const tempPassword = crypto.randomBytes(5).toString('hex');

  const newUser = await User.create({
    firstName,
    lastName,
    email,
    password: tempPassword,
    document,
    phone,
    address,
    birthDate,
    tenantId: req.user.tenantId,
    isVerified: true // Marcado como verificado ya que lo crea el admin
  });

  // Enviar email de bienvenida con credenciales
  try {
    await sendAdminCreatedUserEmail(newUser, tempPassword);
  } catch (err) {
    console.error('Error enviando email de bienvenida:', err);
  }

  res.status(201).json({
    status: 'success',
    data: { user: newUser }
  });
});

/**
 * Alternar estado de activación (Bloquear/Desbloquear)
 */
exports.toggleUserStatus = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

  if (!user) {
    return next(new AppError('Usuario no encontrado.', 404));
  }

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  res.json({
    status: 'success',
    data: { user }
  });
});

/**
 * Borrado físico (Definitivo)
 */
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findOneAndDelete({ 
    _id: req.params.id, 
    tenantId: req.user.tenantId 
  });

  if (!user) {
    return next(new AppError('Usuario no encontrado.', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

/**
 * Actualizar contraseña de un usuario
 */
exports.updateUserPassword = catchAsync(async (req, res, next) => {
  const { newPassword } = req.body;
  if (!newPassword) return next(new AppError('Nueva contraseña es requerida.', 400));

  const user = await User.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!user) return next(new AppError('Usuario no encontrado.', 404));

  user.password = newPassword;
  await user.save();

  res.json({
    status: 'success',
    message: 'Contraseña actualizada correctamente.'
  });
});

/**
 * Ver historial de compras de un usuario
 */
exports.getUserOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ 
    userId: req.params.id, 
    tenantId: req.user.tenantId 
  }).sort('-createdAt');

  res.json({
    status: 'success',
    results: orders.length,
    data: { orders }
  });
});
