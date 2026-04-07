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
  },
  { timestamps: true }
);

taskSchema.index({ tenantId: 1, date: 1 });

module.exports = mongoose.model('Task', taskSchema);
