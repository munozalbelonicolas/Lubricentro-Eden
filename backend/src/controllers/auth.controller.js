'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const slugify = require('slugify');
const User = require('../models/User.model');
const Tenant = require('../models/Tenant.model');
const Subscription = require('../models/Subscription.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { sendVerificationEmail } = require('../utils/email.utils');

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
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        isVerified: user.isVerified
      },
      tenant: tenant ? {
        _id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan
      } : null,
    },
  });
};

/**
 * Registro unificado de usuario
 * Maneja tanto el registro de un nuevo "Dueño de Tienda" (SaaS) 
 * como el de un "Cliente" de una tienda existente.
 */
exports.register = catchAsync(async (req, res, next) => {
  const { 
    firstName, lastName, email, password, storeName,
    document, birthDate, phone, address
  } = req.body;

  const tenantId = req.tenantId || req.body.tenantId;
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // CASO 1: REGISTRO DE CLIENTE (Tienda existente)
  if (tenantId) {
    const user = await User.create({
      firstName, lastName, email, password,
      document, birthDate, phone, address,
      role: 'user',
      tenantId,
      verificationToken
    });

    try {
      await sendVerificationEmail(user, verificationToken);
    } catch (err) {
      console.error('Email error:', err);
    }

    return res.status(201).json({
      status: 'success',
      message: 'Registro exitoso. Verificá tu email para activar la cuenta.',
      data: { user }
    });
  }

  // CASO 2: REGISTRO DE DUEÑO (SaaS - Crea tienda nueva)
  if (!storeName) {
    return next(new AppError('Para crear una tienda, el storeName es obligatorio.', 400));
  }

  let slug = slugify(storeName, { lower: true, strict: true });
  const slugExists = await Tenant.findOne({ slug });
  if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

  const tenant = await Tenant.create({ name: storeName, slug, plan: 'free' });

  const user = await User.create({
    firstName, lastName, email, password,
    document, birthDate, phone, address,
    role: 'admin',
    tenantId: tenant._id,
    isVerified: true, // El admin se autoverifica por simplicidad en SaaS o podemos activar email tmb
  });

  await Subscription.create({
    tenantId: tenant._id,
    plan: 'free',
    status: 'active',
    featuresEnabled: Subscription.getPlanFeatures('free'),
  });

  createSendToken(user, tenant, 201, res);
});

/**
 * Verificar cuenta por email
 */
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.query;
  if (!token) return next(new AppError('Token inválido.', 400));

  const user = await User.findOne({ verificationToken: token });
  if (!user) return next(new AppError('El link expiró o es inválido.', 400));

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ status: 'success', message: '¡Cuenta verificada!' });
});

/**
 * Login
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const tenantId = req.tenantId || req.body.tenantId;

  if (!email || !password || !tenantId) {
    return next(new AppError('Faltan credenciales o ID de tienda.', 400));
  }

  const user = await User.findOne({ email: email.toLowerCase(), tenantId }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Email o contraseña incorrectos.', 401));
  }

  if (!user.isVerified) {
    return next(new AppError('Tu cuenta no está verificada. Revisá tu email.', 403));
  }

  const tenant = await Tenant.findById(user.tenantId);
  createSendToken(user, tenant, 200, res);
});

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const tenant = await Tenant.findById(req.user.tenantId);
  res.json({ status: 'success', data: { user, tenant } });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Contraseña actual incorrecta.', 401));
  }
  user.password = newPassword;
  user.passwordChangedAt = Date.now();
  await user.save();
  createSendToken(user, null, 200, res);
});
