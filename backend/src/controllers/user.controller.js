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
 * Actualizar datos de usuario (por Admin)
 */
exports.updateUser = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, document, phone, role } = req.body;

  const user = await User.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user.tenantId },
    { firstName, lastName, email, document, phone, role },
    { new: true, runValidators: true }
  );

  if (!user) {
    return next(new AppError('Usuario no encontrado.', 404));
  }

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
 * Ver historial unificado (Compras + Taller) de un usuario
 */
exports.getUserOrders = catchAsync(async (req, res, next) => {
  const userId = req.params.id;
  const tenantId = req.user.tenantId;

  // Cargar modelos
  const Task = require('../models/Task.model');

  // Buscar en ambas colecciones
  const [orders, tasks] = await Promise.all([
    Order.find({ userId, tenantId }).sort('-createdAt').lean(),
    Task.find({ userId, tenantId, status: 'done' }).sort('-date').lean()
  ]);

  // Normalizar para que el frontend los maneje fácilmente
  const history = [
    ...orders.map(o => ({ ...o, _type: 'order' })),
    ...tasks.map(t => ({ ...t, _type: 'task' }))
  ].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

  res.json({
    status: 'success',
    results: history.length,
    data: { history }
  });
});
