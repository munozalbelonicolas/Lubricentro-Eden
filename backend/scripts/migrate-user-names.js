'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ No se encontró MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado a MongoDB');

  const User = require('../src/models/User.model');

  // Buscamos usuarios que tengan el campo 'name' (legacy)
  const users = await User.find({ name: { $exists: true } });
  console.log(`🔍 Se encontraron ${users.length} usuarios con el campo legacy 'name'`);

  for (const user of users) {
    const fullUserName = user.get('name'); // Usamos .get porque 'name' no está en el schema actual
    if (!fullUserName) continue;

    const parts = fullUserName.trim().split(' ');
    const firstName = parts[0];
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '---';

    console.log(`🔄 Migrando "${fullUserName}" -> firstName: "${firstName}", lastName: "${lastName}"`);

    await User.updateOne(
      { _id: user._id },
      { 
        $set: { firstName, lastName },
        $unset: { name: 1 } 
      }
    );
  }

  console.log('✅ Migración completada.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
