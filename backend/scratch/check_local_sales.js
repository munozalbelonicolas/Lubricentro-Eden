require('dotenv').config();
const mongoose = require('mongoose');
const LocalSale = require('../src/models/LocalSale.model');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const tenantId = new mongoose.Types.ObjectId('69d2f3e5e85e559ce87e9d19');
    
    const lastSales = await LocalSale.find({ tenantId }).sort({ createdAt: -1 }).limit(5);
    
    console.log('\n=== Recent Local Sales ===');
    if (lastSales.length === 0) {
      console.log('No local sales found for this tenant.');
    } else {
      lastSales.forEach(s => {
        console.log(`- ID: ${s._id} | Total: ${s.total} | Date: ${s.date} | CreatedAt: ${s.createdAt}`);
      });
    }
    
    const count = await LocalSale.countDocuments({ tenantId });
    console.log(`\nTotal local sales for tenant: ${count}`);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

check();
