'use strict';

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio.'],
      trim: true,
      maxlength: [200, 'El nombre no puede superar 200 caracteres.'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'La descripción no puede superar 2000 caracteres.'],
      default: '',
    },
    category: {
      type: String,
      required: [true, 'La categoría es obligatoria.'],
      enum: ['aceite', 'filtro', 'aditivo', 'lubricante', 'repuesto', 'herramienta', 'otro'],
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'El precio es obligatorio.'],
      min: [0, 'El precio no puede ser negativo.'],
      validate: { validator: Number.isInteger, message: 'Debe ser entero.' }
    },
    providerPrice: {
      type: Number,
      default: 0,
      min: [0, 'El precio de costo no puede ser negativo.'],
      validate: { validator: Number.isInteger, message: 'Debe ser entero.' }
    },
    profitMargin: {
      type: Number,
      default: 0,
      min: [0, 'El porcentaje de ganancia no puede ser negativo.'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'El stock no puede ser negativo.'],
      validate: { validator: Number.isInteger, message: 'El stock debe ser entero.' }
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    slug: {
      type: String,
      trim: true,
      index: true,
    },
    // Específico para aceites y lubricantes
    viscosity: {
      type: String,
      trim: true,
      default: '', // ej: "10W40", "5W30"
    },
    // Compatibilidad de vehículo
    vehicleCompatibility: {
      type: [String],
      default: [],
    },
    // Tipo de envase / capacidad
    capacity: {
      type: String,
      default: '', // ej: "1L", "4L", "20L"
    },
    images: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const slugify = require('slugify');

productSchema.pre('save', async function (next) {
  if (!this.slug || this.isModified('name')) {
    let baseSlug = slugify(this.name, { lower: true, strict: true });
    let newSlug = baseSlug;
    let counter = 1;

    // Verificar colisión de slugs dentro del mismo tenant
    let existing = await mongoose.models.Product.findOne({ tenantId: this.tenantId, slug: newSlug });
    while (existing && existing._id.toString() !== this._id.toString()) {
      newSlug = `${baseSlug}-${counter}`;
      existing = await mongoose.models.Product.findOne({ tenantId: this.tenantId, slug: newSlug });
      counter++;
    }
    this.slug = newSlug;
  }
  next();
});

// Índices compuestos para búsquedas eficientes
productSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
productSchema.index({ tenantId: 1, category: 1 });
productSchema.index({ tenantId: 1, brand: 1 });
productSchema.index({ tenantId: 1, isActive: 1 });
productSchema.index({ tenantId: 1, name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
