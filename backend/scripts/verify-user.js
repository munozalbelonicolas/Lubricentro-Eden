'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const EMAIL = 'jorgeeden@lubricentro-eden.com.ar';

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ No se encontró MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado a MongoDB');

  const User = require('../src/models/User.model');

  const result = await User.updateOne(
    { email: EMAIL.toLowerCase() },
    { $set: { isVerified: true, verificationToken: null } }
  );

  if (result.matchedCount === 0) {
    console.error(`❌ No se encontró ningún usuario con email "${EMAIL}"`);
  } else {
    console.log(`✅ Usuario "${EMAIL}" verificado correctamente.`);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
