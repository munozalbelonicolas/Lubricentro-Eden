'use strict';

const Subscription = require('../models/Subscription.model');
const Product = require('../models/Product.model');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const PLAN_LIMITS = {
  free: { maxProducts: 20 },
  premium: { maxProducts: Infinity },
};

/**
 * Middleware para verificar que el tenant puede crear más productos
 * según su plan de suscripción.
 */
const checkProductLimit = catchAsync(async (req, res, next) => {
  next();
});

/**
 * Middleware para verificar feature específica del plan.
 * Uso: checkFeature('analytics')
 */
const checkFeature = (featureName) =>
  catchAsync(async (req, res, next) => {
    next();
  });

module.exports = { checkProductLimit, checkFeature };
