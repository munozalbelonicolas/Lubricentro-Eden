'use strict';

const Subscription = require('../models/Subscription.model');
const Tenant = require('../models/Tenant.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * GET /api/subscriptions/me
 * Ver suscripción actual del tenant.
 */
const getMySubscription = catchAsync(async (req, res, next) => {
  const subscription = await Subscription.findOne({ tenantId: req.tenantId });
  if (!subscription) return next(new AppError('Suscripción no encontrada.', 404));
  sendSuccess(res, { subscription });
});

/**
 * GET /api/subscriptions/plans
 * Ver planes disponibles.
 */
const getPlans = catchAsync(async (req, res, next) => {
  const plans = [
    {
      id: 'free',
      name: 'Plan Gratis',
      price: 0,
      currency: 'ARS',
      billing: 'monthly',
      features: {
        maxProducts: 20,
        maxOrders: 100,
        customDomain: false,
        analytics: false,
        prioritySupport: false,
        exportData: false,
      },
      description: 'Perfecto para empezar tu lubricentro online.',
    },
    {
      id: 'premium',
      name: 'Plan Premium',
      price: 4999,
      currency: 'ARS',
      billing: 'monthly',
      features: {
        maxProducts: -1, // ilimitados
        maxOrders: -1,
        customDomain: true,
        analytics: true,
        prioritySupport: true,
        exportData: true,
      },
      description: 'Para lubricentros que quieren escalar sin límites.',
    },
  ];

  sendSuccess(res, { plans });
});

/**
 * POST /api/subscriptions/upgrade
 * Actualizar plan (en producción integraría el pago de suscripción con MP).
 */
const upgradePlan = catchAsync(async (req, res, next) => {
  const { plan } = req.body;

  if (!['free', 'premium'].includes(plan)) {
    return next(new AppError('Plan inválido. Usa: free, premium.', 400));
  }

  const features = Subscription.getPlanFeatures(plan);

  const subscription = await Subscription.findOneAndUpdate(
    { tenantId: req.tenantId },
    {
      plan,
      status: 'active',
      featuresEnabled: features,
      startDate: new Date(),
      endDate: plan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    { new: true, upsert: true }
  );

  // Actualizar plan en el tenant también
  await Tenant.findByIdAndUpdate(req.tenantId, { plan });

  sendSuccess(res, { subscription });
});

module.exports = { getMySubscription, getPlans, upgradePlan };
