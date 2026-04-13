// src/models/ChatSession.js
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  role:      { type: String, enum: ["user", "assistant"], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const BookingSchema = new mongoose.Schema({
  active:    { type: Boolean, default: false },
  step:      { type: String, default: null }, // nombre, email, telefono, vehiculo, patente, km, fecha, turno, confirmacion
  data: {
    nombre:   { type: String, default: null },
    email:    { type: String, default: null },
    telefono: { type: String, default: null },
    vehiculo: { type: String, default: null },
    patente:  { type: String, default: null },
    km:       { type: Number, default: null },
    fecha:    { type: String, default: null },
    turno:    { type: String, default: null },
  }
}, { _id: false });

const ChatSessionSchema = new mongoose.Schema({
  sessionId:  { type: String, required: true, unique: true, index: true },
  messages:   { type: [MessageSchema], default: [] },
  vehiculo:   { type: String, default: null }, // último vehículo consultado
  booking:    { type: BookingSchema, default: () => ({}) },
  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now },
  // TTL: la sesión expira en 2 horas de inactividad
  expiresAt:  { type: Date, default: () => new Date(Date.now() + 2 * 60 * 60 * 1000), index: { expires: 0 } },
});

// Actualiza updatedAt y renueva TTL en cada save
ChatSessionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  this.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
  next();
});

// Limita el historial a los últimos 20 mensajes para no explotar tokens
ChatSessionSchema.methods.getTrimmedHistory = function () {
  return this.messages.slice(-20).map(({ role, content }) => ({ role, content }));
};

module.exports = mongoose.model("ChatSession", ChatSessionSchema);
