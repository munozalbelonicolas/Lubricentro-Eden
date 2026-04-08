const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const VehicleCache = require('../src/models/VehicleCache');

async function clearCache() {
  try {
    console.log('🔄 Conectando a MongoDB para limpiar caché...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const result = await VehicleCache.deleteMany({});
    console.log(`✅ Caché de vehículos limpiado. Documentos eliminados: ${result.deletedCount}`);
    
  } catch (err) {
    console.error('❌ Error al limpiar caché:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

clearCache();
