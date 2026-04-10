'use strict';

/**
 * Script de utilidad: asigna el Instagram al tenant por su slug.
 * Uso: node scripts/set-social.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Tenant   = require('../src/models/Tenant.model');

const SLUG      = process.env.TENANT_SLUG || 'lubricentro-eden';
const INSTAGRAM = 'https://www.instagram.com/lubricentroeden/';

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const result = await Tenant.findOneAndUpdate(
      { slug: SLUG },
      { $set: { 'config.socialLinks.instagram': INSTAGRAM } },
      { new: true }
    );

    if (!result) {
      console.error(`❌ No se encontró ningún tenant con slug "${SLUG}"`);
      process.exit(1);
    }

    console.log(`✅ Instagram actualizado para "${result.name}"`);
    console.log(`   config.socialLinks.instagram → ${result.config.socialLinks.instagram}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
})();
