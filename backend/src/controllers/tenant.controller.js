'use strict';

const Tenant = require('../models/Tenant.model');
const User = require('../models/User.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * GET /api/tenants/me
 * Obtener configuración del tenant activo.
 */
const getMyTenant = catchAsync(async (req, res, next) => {
  const tenant = await Tenant.findById(req.tenantId);
  if (!tenant) return next(new AppError('Tienda no encontrada.', 404));

  // Dejar que el frontend maneje la construcción de la URL
  // Anteriormente aquí se absolutizaba con req.protocol, lo que causaba problemas de HTTPS/HTTP


  sendSuccess(res, { tenant });
});

/**
 * PUT /api/tenants/me
 * Actualizar configuración del tenant (solo admin).
 */
const updateMyTenant = catchAsync(async (req, res, next) => {
  const { name, config } = req.body;

  const updates = {};
  if (name) updates.name = name;
  if (config) {
    const tenant = await Tenant.findById(req.tenantId);
    const current = tenant.config ? tenant.config.toObject() : {};
    
    // Deep merge for colors and layout to avoid wiping themes when only uploading logo
    updates.config = {
      ...current,
      ...config,
      colors: { ...(current.colors || {}), ...(config.colors || {}) },
      layout: { ...(current.layout || {}), ...(config.layout || {}) }
    };
  }

  const tenant = await Tenant.findByIdAndUpdate(req.tenantId, updates, {
    new: true,
    runValidators: true,
  });

  // Dejar que el frontend maneje la construcción de la URL


  sendSuccess(res, { tenant });
});

/**
 * POST /api/tenants/me/logo
 * Subir logo del tenant.
 */
const uploadLogo = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('No se subió ningún archivo.', 400));

  let logoUrl = `/uploads/logos/${req.file.filename}`;
  const tenant = await Tenant.findByIdAndUpdate(
    req.tenantId,
    { 'config.logo': logoUrl },
    { new: true }
  );

  if (tenant.config) {
    tenant.config.logo = logoUrl;
  }

  sendSuccess(res, { tenant, logoUrl });
});

/**
 * GET /api/tenants/me/users  (admin: ver usuarios de su tienda)
 */
const getTenantUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({ tenantId: req.tenantId }).select('-password');
  sendSuccess(res, { users, count: users.length });
});

/**
 * GET /api/tenants/public/:slug
 * Info pública de una tienda (para landing page pública).
 */
const getPublicTenant = catchAsync(async (req, res, next) => {
  // En modo NO MULTI-TENANT, si el slug es 'me' o no viene, usamos el tenant detectado por el middleware
  const identifier = req.params.slug;
  let tenant;

  if (identifier && identifier !== 'me') {
    tenant = await Tenant.findOne({ slug: identifier, isActive: true });
  } else {
    // Si no hay slug o es 'me', usamos el que encontró el middleware (el primero/único)
    tenant = await Tenant.findById(req.tenantId);
  }

  if (!tenant || !tenant.isActive) return next(new AppError('Tienda no encontrada.', 404));

  sendSuccess(res, { 
    tenant: {
      _id: tenant._id,
      name: tenant.name,
      slug: tenant.slug,
      config: tenant.config,
      plan: tenant.plan
    }
  });
});

module.exports = { getMyTenant, updateMyTenant, uploadLogo, getTenantUsers, getPublicTenant };
