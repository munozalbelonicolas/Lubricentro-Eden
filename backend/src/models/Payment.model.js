'use strict';

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    // ID de preferencia de Mercado Pago
    preferenceId: { type: String, default: '' },
    // ID de pago de Mercado Pago (llega por webhook)
    mercadoPagoPaymentId: { type: String, default: '' },
    // Datos completos del webhook
    mercadoPagoData: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'refunded', 'in_process', 'cancelled'],
      default: 'pending',
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'ARS' },
    paymentMethod: { type: String, default: '' },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.index({ tenantId: 1, orderId: 1 });
paymentSchema.index({ mercadoPagoPaymentId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
