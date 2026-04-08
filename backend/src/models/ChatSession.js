// src/models/ChatSession.js
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  role:      { type: String, enum: ["user", "assistant"], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ChatSessionSchema = new mongoose.Schema({
  sessionId:  { type: String, required: true, unique: true, index: true },
  messages:   { type: [MessageSchema], default: [] },
  vehiculo:   { type: String, default: null }, // último vehículo consultado
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
