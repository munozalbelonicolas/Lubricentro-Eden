'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const slugify = require('slugify');
const { OAuth2Client } = require('google-auth-library');
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
    isVerified: true,
  });

  // Asignar ownerId al tenant ahora que tenemos el user
  tenant.ownerId = user._id;
  await tenant.save();

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

  const user = await User.findOne({ 
    verificationToken: token,
    tenantId: req.tenantId || req.body.tenantId // Hardening para asegurar consistencia
  });

  if (!user) return next(new AppError('El link expiró o es inválido para esta tienda.', 400));

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
  if (!user) {
    return next(new AppError('Email o contraseña incorrectos.', 401));
  }

  // Usuarios registrados vía Google no tienen password local
  if (!user.password) {
    return next(new AppError('Esta cuenta fue creada con Google. Usá el botón "Iniciar con Google" para ingresar.', 400));
  }

  if (!(await user.comparePassword(password))) {
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

// ==========================================
// GOOGLE AUTH
// ==========================================
exports.googleAuth = catchAsync(async (req, res, next) => {
  const { credential } = req.body;
  const tenantId = req.tenantId || req.body.tenantId;
  
  if (!credential) return next(new AppError('No se recibió el token de Google.', 400));
  if (!tenantId) return next(new AppError('Falta ID de la tienda.', 400));

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (err) {
    return next(new AppError('El token de Google es inválido o expiró. Intentá nuevamente.', 401));
  }
  
  const payload = ticket.getPayload();
  const { email, given_name, family_name, sub } = payload;
  
  const user = await User.findOne({ email: email.toLowerCase(), tenantId });
  
  if (user) {
    // Auto-verificar si viene de Google (Google ya validó el email)
    if (!user.isVerified) {
      user.isVerified = true;
    }
    if (!user.isActive) {
      return next(new AppError('Tu cuenta está desactivada. Contacta al administrador.', 403));
    }
    if (!user.googleId) {
      user.googleId = sub;
    }
    await user.save({ validateBeforeSave: false });
    const tenant = await Tenant.findById(user.tenantId);
    return createSendToken(user, tenant, 200, res);
  }
  
  // Usuario no existe, le enviamos un flag para que complete datos obligatorios extras.
  res.status(200).json({
    status: 'success',
    unregistered: true,
    data: {
      email: email.toLowerCase(),
      firstName: given_name,
      lastName: family_name || '',
      googleId: sub,
      credential // Devolvemos el credential para usarlo en googleRegister
    }
  });
});

exports.googleRegister = catchAsync(async (req, res, next) => {
  const { credential, document, birthDate, phone, address } = req.body;
  const tenantId = req.tenantId || req.body.tenantId;

  if (!credential) return next(new AppError('Falta credencial de Google.', 400));
  if (!tenantId) return next(new AppError('Falta ID de la tienda.', 400));

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  let ticket;
  try {
    ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
  } catch (err) {
    return next(new AppError('El token de Google es inválido o expiró. Intentá el registro nuevamente.', 401));
  }
  const payload = ticket.getPayload();
  const { email, given_name, family_name, sub } = payload;

  const existingByEmail = await User.findOne({ email: email.toLowerCase(), tenantId });
  if (existingByEmail) return next(new AppError('El email ya está registrado.', 400));

  const existingByDoc = await User.findOne({ document, tenantId });
  if (existingByDoc) return next(new AppError('El documento (DNI) ya está registrado en este sistema.', 400));

  const user = await User.create({
    firstName: given_name,
    lastName: family_name || '',
    email: email.toLowerCase(),
    document, birthDate, phone, address,
    role: 'user',
    tenantId,
    googleId: sub,
    isVerified: true
  });

  const tenant = await Tenant.findById(tenantId);
  createSendToken(user, tenant, 201, res);
});
