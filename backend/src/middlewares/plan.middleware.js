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
  const subscription = await Subscription.findOne({ tenantId: req.tenantId });

  if (!subscription) {
    // Sin suscripción activa => usar límites free
    const count = await Product.countDocuments({ tenantId: req.tenantId, isActive: true });
    if (count >= PLAN_LIMITS.free.maxProducts) {
      return next(
        new AppError(
          `Plan FREE: límite de ${PLAN_LIMITS.free.maxProducts} productos alcanzado. Actualiza a Premium para continuar.`,
          403
        )
      );
    }
    return next();
  }

  const plan = subscription.plan || 'free';
  const limit = PLAN_LIMITS[plan]?.maxProducts ?? PLAN_LIMITS.free.maxProducts;

  if (limit === Infinity) return next();

  const count = await Product.countDocuments({ tenantId: req.tenantId, isActive: true });
  if (count >= limit) {
    return next(
      new AppError(
        `Plan ${plan.toUpperCase()}: límite de ${limit} productos alcanzado. Actualiza a Premium para continuar.`,
        403
      )
    );
  }

  next();
});

/**
 * Middleware para verificar feature específica del plan.
 * Uso: checkFeature('analytics')
 */
const checkFeature = (featureName) =>
  catchAsync(async (req, res, next) => {
    const subscription = await Subscription.findOne({ tenantId: req.tenantId });

    if (!subscription) {
      const freeFeatures = Subscription.getPlanFeatures('free');
      if (!freeFeatures[featureName]) {
        return next(
          new AppError(
            `Esta función no está disponible en el plan FREE. Actualiza a Premium.`,
            403
          )
        );
      }
      return next();
    }

    const features = subscription.featuresEnabled || Subscription.getPlanFeatures(subscription.plan);
    if (!features[featureName]) {
      return next(
        new AppError(
          `Esta función no está disponible en tu plan actual. Actualiza a Premium.`,
          403
        )
      );
    }

    next();
  });

module.exports = { checkProductLimit, checkFeature };
