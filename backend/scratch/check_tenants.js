require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product.model');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // Check null vs real tenantId products
    const nullTenant = await Product.find({ tenantId: null }).limit(3);
    const realTenant = await Product.find({ tenantId: { $ne: null } }).limit(3);
    
    console.log('\n=== Products with tenantId: null ===');
    nullTenant.forEach(p => console.log(`  - ${p.name} | created: ${p.createdAt}`));
    
    console.log('\n=== Products with real tenantId ===');
    realTenant.forEach(p => console.log(`  - ${p.name} | tenantId: ${p.tenantId} | created: ${p.createdAt}`));
    
    const nullCount = await Product.countDocuments({ tenantId: null });
    const realCount = await Product.countDocuments({ tenantId: { $ne: null } });
    console.log(`\nNull tenantId count: ${nullCount}`);
    console.log(`Real tenantId count: ${realCount}`);
    
    // Test text search (fallback)
    console.log('\n=== Testing $text search ===');
    try {
      const textResults = await Product.find(
        { $text: { $search: 'aceite' }, isActive: true },
        { score: { $meta: 'textScore' } }
      ).limit(3);
      console.log(`$text search returned ${textResults.length} results`);
      textResults.forEach(p => console.log(`  - ${p.name}`));
    } catch (err) {
      console.log('$text search failed:', err.message);
    }
    
    // Test regex search
    console.log('\n=== Testing regex search ===');
    const regexResults = await Product.find({
      isActive: true,
      $or: [
        { name: /aceite/i },
        { description: /aceite/i },
        { brand: /aceite/i }
      ]
    }).limit(3);
    console.log(`Regex search returned ${regexResults.length} results`);
    regexResults.forEach(p => console.log(`  - ${p.name}`));
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

check();
