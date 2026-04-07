'use strict';

/**
 * Script de utilidad: asigna el logo al tenant por su slug.
 * Uso: node scripts/set-logo.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Tenant   = require('../src/models/Tenant.model');

const SLUG      = process.env.TENANT_SLUG  || 'lubricentro-eden';
const LOGO_PATH = process.env.LOGO_PATH    || '/uploads/logos/Logo_Eden.Jpeg';

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado a MongoDB');

  const result = await Tenant.findOneAndUpdate(
    { slug: SLUG },
    { $set: { 'config.logo': LOGO_PATH } },
    { new: true }
  );

  if (!result) {
    console.error(`❌ No se encontró ningún tenant con slug "${SLUG}"`);
    process.exit(1);
  }

  console.log(`✅ Logo actualizado para "${result.name}"`);
  console.log(`   config.logo → ${result.config.logo}`);
  await mongoose.disconnect();
})();
