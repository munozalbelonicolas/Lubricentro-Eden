// src/models/VehicleCache.js
const mongoose = require("mongoose");

const MotorSchema = new mongoose.Schema({
  nombre:          { type: String, required: true },
  combustible:     { type: String, enum: ["nafta", "diesel", "gnc", "hibrido", "electrico", "moto"] },
  viscosidad:      { type: String },           // "5W-30"
  tipo:            { type: String },           // "sintetico"
  marca_fabrica:   { type: String },           // "Castrol"
  especificacion:  { type: String },           // "API SN / ACEA A3"
  intervalo_km:    { type: Number },           // 10000
  intervalo_meses: { type: Number },           // 12
  nota:            { type: String },
}, { _id: false });

const VehicleCacheSchema = new mongoose.Schema({
  // Clave: "fiat_argo_2020" (normalizada a lowercase sin espacios)
  cacheKey:   { type: String, required: true, unique: true, index: true },
  vehiculo:   { type: String, required: true },  // "Fiat Argo 2020"
  marca:      { type: String },
  modelo:     { type: String },
  anio:       { type: String },
  motores:    { type: [MotorSchema], default: [] },
  conocido:   { type: Boolean, default: true },
  hits:       { type: Number, default: 1 },      // cuántas veces se consultó
  createdAt:  { type: Date, default: Date.now },
  // TTL: el caché de vehículos dura 30 días
  expiresAt:  { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), index: { expires: 0 } },
});

// Genera la clave normalizada: "fiat argo 2020" → "fiat_argo_2020"
VehicleCacheSchema.statics.buildKey = function (marca, modelo, anio) {
  return [marca, modelo, anio]
    .filter(Boolean)
    .join("_")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
};

module.exports = mongoose.model("VehicleCache", VehicleCacheSchema);
