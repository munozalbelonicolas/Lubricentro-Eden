'use strict';

const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'La descripción del gasto es obligatoria.'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'El monto del gasto es obligatorio.'],
      min: [0, 'El monto no puede ser negativo.'],
    },
    category: {
      type: String,
      enum: ['insumos', 'servicios', 'alquiler', 'sueldos', 'herramientas', 'impuestos', 'otros'],
      default: 'otros',
    },
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

module.exports = mongoose.model('Expense', expenseSchema);
