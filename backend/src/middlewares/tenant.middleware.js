'use strict';

const Tenant = require('../models/Tenant.model');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * Middleware multi-tenant.
 * Detecta el tenant por el header X-Tenant-ID o por el slug en query/param.
 * Inyecta req.tenantId y req.tenant en el request.
 */
const tenantMiddleware = catchAsync(async (req, res, next) => {
  // Estrategia: Header X-Tenant-ID (ObjectId o slug)
  const tenantHeader = req.headers['x-tenant-id'];
  const defaultTenantId = process.env.VITE_TENANT_ID;

  let tenant;
  const identifier = tenantHeader || defaultTenantId;

  if (identifier) {
    // Buscar por ObjectId o slug
    if (identifier.match(/^[a-f\d]{24}$/i)) {
      tenant = await Tenant.findById(identifier);
    } else {
      tenant = await Tenant.findOne({ slug: identifier.toLowerCase() });
    }
  } else {
    // [NO MULTI-TENANT] Si no hay identificador, tomamos el único/primer tenant
    tenant = await Tenant.findOne().sort({ createdAt: 1 });
  }

  if (!tenant) {
    return next(new AppError('Tienda no encontrada o inactiva.', 404));
  }

  if (!tenant.isActive) {
    return next(new AppError('Esta tienda está temporalmente desactivada.', 403));
  }

  req.tenantId = tenant._id;
  req.tenant = tenant;
  next();
});

module.exports = tenantMiddleware;
