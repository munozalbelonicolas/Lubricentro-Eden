'use strict';

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { 
      type: Number, 
      required: true, 
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'La cantidad debe ser un entero.'
      }
    },
    image: { type: String, default: '' },
  },
  { _id: false }
);

const shippingSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    province: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  { _id: false }
);

const workshopAppointmentSchema = new mongoose.Schema(
  {
    date:      { type: Date,   required: true },
    timeSlot:  { type: String, required: true }, // ej: '08:00-10:00'
    vehicle:   { type: String, default: '' },     // patente / descripción del vehículo
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'La orden debe tener al menos un producto.',
      },
    },
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'ready_pickup', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'refunded', 'in_process'],
      default: 'pending',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    deliveryType: {
      type: String,
      enum: ['shipping', 'pickup', 'workshop'],
      default: 'shipping',
    },
    shipping: { type: shippingSchema, default: () => ({}) },
    workshopAppointment: { type: workshopAppointmentSchema, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Generar número de orden único antes de guardar
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

orderSchema.index({ tenantId: 1, userId: 1 });
orderSchema.index({ tenantId: 1, status: 1 });
orderSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
