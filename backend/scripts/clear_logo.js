require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('../src/models/Tenant.model'); // Fixed path

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await Tenant.updateMany({}, { $unset: { 'config.logo': 1 } });
  console.log('Logo field removed from DB');
  process.exit(0);
}).catch(console.error);
