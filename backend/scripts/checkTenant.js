const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Tenant = require('../src/models/Tenant.model');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const eden = await Tenant.findOne({ slug: 'lubricentro-eden' });
    if (eden) {
      console.log('DATOS ACTUALES DE EDEN:');
      console.log('Slug:', eden.slug);
      console.log('Color Primario:', eden.config?.primaryColor);
      console.log('Color Secundario:', eden.config?.secondaryColor);
    } else {
      console.log('No se encontró el tenant "lubricentro-eden"');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

check();
