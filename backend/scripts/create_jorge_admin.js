const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../src/models/User.model');
const Tenant = require('../src/models/Tenant.model');

async function createJorge() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 1. Buscar el tenant
    const tenant = await Tenant.findOne({ slug: 'lubricentro-eden' });
    if (!tenant) throw new Error('Tenant Lubricentro Eden no encontrado');

    const email = 'jorgeeden@lubricentro-eden.com.ar';
    
    // 2. Verificar si ya existe
    let jorge = await User.findOne({ email, tenantId: tenant._id });
    if (jorge) {
      console.log('Jorge ya existe. Actualizando contraseña y rol...');
      jorge.password = '@PrU3v4#1234';
      jorge.role = 'admin';
      await jorge.save();
    } else {
      console.log('Creando nuevo usuario admin: Jorge...');
      jorge = await User.create({
        name: 'Jorge Eden',
        email,
        password: '@PrU3v4#1234',
        role: 'admin',
        tenantId: tenant._id,
        isActive: true
      });
    }

    console.log('✅ Usuario Jorge Eden creado/actualizado con éxito.');
    console.log('Email:', email);
    console.log('Rol:', jorge.role);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

createJorge();
