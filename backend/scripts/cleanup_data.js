'use strict';

require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

// Importar modelos
const Order = require('../src/models/Order.model');
const Task = require('../src/models/Task.model');
const Payment = require('../src/models/Payment.model');
const Expense = require('../src/models/Expense.model');
const ChatSession = require('../src/models/ChatSession.js');
const VehicleCache = require('../src/models/VehicleCache.js');

async function cleanup() {
  try {
    console.log('--- Iniciando limpieza de datos de prueba ---');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI no definida en el entorno.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB.');

    // 1. Borrar Órdenes
    const ordersRes = await Order.deleteMany({});
    console.log(`✅ Órdenes eliminadas: ${ordersRes.deletedCount}`);

    // 2. Borrar Tareas / Historial Clínico
    const tasksRes = await Task.deleteMany({});
    console.log(`✅ Tareas/Historial eliminados: ${tasksRes.deletedCount}`);

    // 3. Borrar Pagos
    const paymentsRes = await Payment.deleteMany({});
    console.log(`✅ Registros de pago eliminados: ${paymentsRes.deletedCount}`);

    // 4. Borrar Gastos
    const expensesRes = await Expense.deleteMany({});
    console.log(`✅ Gastos eliminados: ${expensesRes.deletedCount}`);

    // 5. Borrar Sesiones de Chat
    const chatsRes = await ChatSession.deleteMany({});
    console.log(`✅ Sesiones de chat eliminadas: ${chatsRes.deletedCount}`);

    // 6. Borrar Cache de Vehículos
    const vehicleRes = await VehicleCache.deleteMany({});
    console.log(`✅ Cache de vehículos eliminado: ${vehicleRes.deletedCount}`);

    console.log('--- Limpieza completada con éxito ---');
  } catch (err) {
    console.error('❌ Error durante la limpieza:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

cleanup();
