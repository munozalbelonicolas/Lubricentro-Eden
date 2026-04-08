'use strict';

const mongoose = require('mongoose');

const tenantConfigSchema = new mongoose.Schema(
  {
    logo: { type: String, default: '' },
    primaryColor: { type: String, default: '#CB1A20' },
    secondaryColor: { type: String, default: '#0D0D0D' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    description: { type: String, default: '' },
    socialLinks: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
    },
    businessHours: { type: String, default: '' },
  },
  { _id: false }
);

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del lubricentro es obligatorio.'],
      trim: true,
      maxlength: [120, 'El nombre no puede superar 120 caracteres.'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    config: {
      type: tenantConfigSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

tenantSchema.index({ slug: 1 });

module.exports = mongoose.model('Tenant', tenantSchema);
