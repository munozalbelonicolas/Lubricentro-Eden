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
      type: String, // '08:00-10:00', etc.
      enum: ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00'],
      default: '08:00-10:00',
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
    }
  },
  { timestamps: true }
);

taskSchema.index({ tenantId: 1, date: 1 });

module.exports = mongoose.model('Task', taskSchema);
