'use strict';

const mongoose = require('mongoose');

const localSaleItemSchema = new mongoose.Schema(
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
      min: 1
    },
  },
  { _id: false }
);

const localSaleSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    items: {
      type: [localSaleItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'La venta debe tener al menos un producto.',
      },
    },
    total: { type: Number, required: true },
    description: { type: String, trim: true },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LocalSale', localSaleSchema);
