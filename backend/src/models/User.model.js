'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'El nombre es obligatorio.'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'El apellido es obligatorio.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio.'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido.'],
    },
    password: {
      type: String,
      required: [function() { return !this.googleId; }, 'La contraseña es obligatoria.'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres.'],
      select: false,
    },
    document: {
      type: String,
      required: [true, 'El documento es obligatorio.'],
      match: [/^\d+$/, 'El documento debe ser solo numérico.'],
    },
    birthDate: {
      type: Date,
      required: [true, 'La fecha de nacimiento es obligatoria.'],
    },
    phone: {
      type: String,
      required: [true, 'El celular es obligatorio.'],
    },
    address: {
      street: { type: String, required: [true, 'La calle es obligatoria.'] },
      number: { type: String, required: [true, 'El número es obligatorio.'] },
      floor: { type: String },
      apartment: { type: String },
      city: { type: String, required: [true, 'La localidad es obligatoria.'] },
      province: { type: String, required: [true, 'La provincia es obligatoria.'] },
      zipCode: { type: String, required: [true, 'El código postal es obligatorio.'] },
    },
    role: {
      type: String,
      enum: ['admin', 'vendedor', 'caja', 'user', 'referido'],
      default: 'user',
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    passwordChangedAt: Date,
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Índice único compuesto: un email por tenant
userSchema.index({ email: 1, tenantId: 1 }, { unique: true });

// Hash de contraseña antes de guardar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Comparar contraseñas
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Verificar si la contraseña fue cambiada después de emitir el JWT
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);
