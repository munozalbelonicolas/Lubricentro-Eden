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

  // Absolutizar logo si existe
  if (tenant.config?.logo && tenant.config.logo.startsWith('/uploads')) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    tenant.config.logo = `${baseUrl}${tenant.config.logo}`;
  }

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
    // Merge de config (no reemplazar todo)
    const current = (await Tenant.findById(req.tenantId)).config.toObject();
    updates.config = { ...current, ...config };
  }

  const tenant = await Tenant.findByIdAndUpdate(req.tenantId, updates, {
    new: true,
    runValidators: true,
  });

  // Absolutizar logo si existe
  if (tenant.config?.logo && tenant.config.logo.startsWith('/uploads')) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    tenant.config.logo = `${baseUrl}${tenant.config.logo}`;
  }

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

  // Enviar URL absoluta al frontend
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  logoUrl = `${baseUrl}${logoUrl}`;
  
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
  const tenant = await Tenant.findOne({ slug: req.params.slug, isActive: true }).select(
    'name slug config plan'
  );
  if (!tenant) return next(new AppError('Tienda no encontrada.', 404));

  // Absolutizar logo si existe
  if (tenant.config?.logo && tenant.config.logo.startsWith('/uploads')) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    tenant.config.logo = `${baseUrl}${tenant.config.logo}`;
  }

  sendSuccess(res, { tenant });
});

module.exports = { getMyTenant, updateMyTenant, uploadLogo, getTenantUsers, getPublicTenant };
