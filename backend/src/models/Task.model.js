'use strict';

const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'El título de la tarea es obligatorio.'],
      trim: true,
      maxlength: [200, 'El título no puede superar 200 caracteres.'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'La descripción no puede superar 1000 caracteres.'],
      default: '',
    },
    date: {
      type: String, // 'YYYY-MM-DD' — más simple que Date para comparar por día
      required: [true, 'La fecha de la tarea es obligatoria.'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'done'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    timeSlot: {
      type: String, // '08:00', '08:30', '09:00', etc. (franjas de 30 min)
      default: '08:00',
    },
    plate: {
      type: String,
      trim: true,
      uppercase: true,
    },
    currentKm: {
      type: Number,
    },
    nextChangeKm: {
      type: Number,
    },
    // Ficha técnica para el historial
    serviceData: {
      oilBrand: { type: String, trim: true },
      oilType:  { type: String, trim: true },
      filterOil:  { type: Boolean, default: false },
      filterAir:  { type: Boolean, default: false },
      filterFuel: { type: Boolean, default: false },
      filterCabin: { type: Boolean, default: false },
      observations: { type: String, trim: true },
      photos: [{ type: String }], // Array de URLs
    },
    // Desglose de productos del stock utilizados
    items: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true, default: 1 }
    }],
    totalValue: {
      type: Number,
      default: 0
    },
    // Datos de respaldo si no hay un usuario registrado vinculado
    customerName:  { type: String, trim: true },
    customerEmail: { type: String, trim: true, lowercase: true },
    customerPhone: { type: String, trim: true },
  },
  { timestamps: true }
);

taskSchema.index({ tenantId: 1, date: 1 });
taskSchema.index({ tenantId: 1, plate: 1 }); // Índice para búsquedas rápidas de historial
taskSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
