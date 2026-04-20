require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product.model');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // Find duplicates by name + tenantId
    const tenantId = new mongoose.Types.ObjectId('69d2f3e5e85e559ce87e9d19');
    const dupes = await Product.aggregate([
      { $match: { tenantId } },
      { $group: { _id: '$name', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log(`\n=== Duplicate products (${dupes.length} groups) ===`);
    dupes.forEach(d => console.log(`  - "${d._id}" x${d.count} | ids: ${d.ids.map(i => i.toString()).join(', ')}`));
    
    // Products with tenantId: null
    const nullProducts = await Product.find({ tenantId: null });
    console.log(`\n=== Products with tenantId: null (${nullProducts.length}) ===`);
    nullProducts.forEach(p => console.log(`  - "${p.name}" | _id: ${p._id}`));
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

check();
