'use strict';

/**
 * Script: update-phone.js
 * Actualiza el número de teléfono en MongoDB (single-tenant).
 * Uso: node scripts/update-phone.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const NUEVO_TELEFONO = '+54 9 11 2251-0380';

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ No se encontró MONGODB_URI en el .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('✅ Conectado a MongoDB');

  const Tenant = require('../src/models/Tenant.model');

  const tenant = await Tenant.findOne();

  if (!tenant) {
    console.error('❌ No se encontró ningún tenant en la base de datos.');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`🔍 Tenant encontrado: "${tenant.name}" (slug: ${tenant.slug})`);
  console.log(`📞 Teléfono actual: "${tenant.config?.phone || '(vacío)'}"`);

  tenant.config.phone = NUEVO_TELEFONO;
  await tenant.save();

  console.log(`✅ Teléfono actualizado a "${NUEVO_TELEFONO}"`);

  await mongoose.disconnect();
  console.log('🔌 Desconectado de MongoDB');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
