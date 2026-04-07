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
  // Estrategia 1: Header X-Tenant-ID (ObjectId o slug)
  const tenantHeader = req.headers['x-tenant-id'];

  // Estrategia 2: Subdominio (ej: mitienda.lubricentro-eden.com)
  let tenantSlug = null;
  const host = req.headers.host || '';
  const parts = host.split('.');
  if (parts.length >= 3) {
    tenantSlug = parts[0];
  }

  if (!tenantHeader && !tenantSlug) {
    // Si no hay tenant, procedemos sin él (el controlador decidirá qué hacer)
    return next();
  }

  let tenant;

  // Buscar por ObjectId o slug
  if (tenantHeader) {
    // Intentar por slug primero, luego por id
    if (tenantHeader.match(/^[a-f\d]{24}$/i)) {
      tenant = await Tenant.findById(tenantHeader);
    } else {
      tenant = await Tenant.findOne({ slug: tenantHeader.toLowerCase() });
    }
  } else if (tenantSlug) {
    tenant = await Tenant.findOne({ slug: tenantSlug.toLowerCase() });
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
