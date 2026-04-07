'use strict';

const mongoose = require('mongoose');

const PLAN_FEATURES = {
  free: {
    maxProducts: 20,
    maxOrders: 100,
    customDomain: false,
    analytics: false,
    prioritySupport: false,
    exportData: false,
  },
  premium: {
    maxProducts: Infinity,
    maxOrders: Infinity,
    customDomain: true,
    analytics: true,
    prioritySupport: true,
    exportData: true,
  },
};

const subscriptionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      unique: true,
    },
    plan: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'past_due'],
      default: 'active',
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    // Pago de suscripción (para plan premium)
    mercadoPagoSubscriptionId: { type: String, default: '' },
    featuresEnabled: {
      type: mongoose.Schema.Types.Mixed,
      default: () => PLAN_FEATURES.free,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual', 'lifetime'],
      default: 'monthly',
    },
  },
  { timestamps: true }
);

subscriptionSchema.index({ tenantId: 1 });

// Método estático para obtener features de un plan
subscriptionSchema.statics.getPlanFeatures = (plan) => {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.free;
};

// Verificar si la suscripción está activa
subscriptionSchema.methods.isActive = function () {
  if (this.status !== 'active') return false;
  if (this.endDate && new Date() > this.endDate) return false;
  return true;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
module.exports.PLAN_FEATURES = PLAN_FEATURES;
