'use strict';

const jwt = require('jsonwebtoken');
const slugify = require('slugify');
const User = require('../models/User.model');
const Tenant = require('../models/Tenant.model');
const Subscription = require('../models/Subscription.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const createSendToken = (user, tenant, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
      tenant: tenant
        ? {
            _id: tenant._id,
            name: tenant.name,
            slug: tenant.slug,
            plan: tenant.plan,
            config: tenant.config,
          }
        : null,
    },
  });
};

/**
 * POST /api/auth/register
 * Registra un usuario y crea su tenant (lubricentro) automáticamente.
 */
const register = catchAsync(async (req, res, next) => {
  const { name, email, password, storeName } = req.body;

  if (!name || !email || !password || !storeName) {
    return next(new AppError('Todos los campos son obligatorios: name, email, password, storeName.', 400));
  }

  // Generar slug único para el tenant
  let slug = slugify(storeName, { lower: true, strict: true });
  const slugExists = await Tenant.findOne({ slug });
  if (slugExists) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // Generar ID de usuario primero
  const mongoose = require('mongoose');
  const userId = new mongoose.Types.ObjectId();

  // Crear tenant
  const tenant = await Tenant.create({
    name: storeName,
    slug,
    ownerId: userId,
    plan: 'free',
  });

  // Crear usuario admin del tenant
  const user = await User.create({
    _id: userId,
    name,
    email,
    password,
    role: 'admin',
    tenantId: tenant._id,
  });

  // Crear suscripción free automáticamente
  await Subscription.create({
    tenantId: tenant._id,
    plan: 'free',
    status: 'active',
    featuresEnabled: Subscription.getPlanFeatures('free'),
  });

  createSendToken(user, tenant, 201, res);
});

/**
 * POST /api/auth/login
 * Login — requiere X-Tenant-ID para identificar la tienda.
 */
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email y contraseña son obligatorios.', 400));
  }

  // Buscar usuario dentro del tenant activo
  const query = { email: email.toLowerCase() };
  if (req.tenantId) query.tenantId = req.tenantId;

  const user = await User.findOne(query).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Email o contraseña incorrectos.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Tu cuenta está desactivada. Contacta al soporte.', 403));
  }

  const tenant = await Tenant.findById(user.tenantId);
  createSendToken(user, tenant, 200, res);
});

/**
 * GET /api/auth/me
 */
const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const tenant = await Tenant.findById(req.user.tenantId);

  sendSuccess(res, { user, tenant });
});

/**
 * PATCH /api/auth/update-password
 */
const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Debes enviar currentPassword y newPassword.', 400));
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Contraseña actual incorrecta.', 401));
  }

  user.password = newPassword;
  user.passwordChangedAt = Date.now();
  await user.save();

  createSendToken(user, null, 200, res);
});

module.exports = { register, login, getMe, updatePassword };
