require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product.model');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // Check existing indexes on the Product collection
    const indexes = await mongoose.connection.collection('products').indexes();
    console.log('\n=== Product collection indexes ===');
    indexes.forEach(idx => {
      console.log(`  - ${JSON.stringify(idx.key)} | name: "${idx.name}"`);
    });
    
    // Test $text search (as the controller now uses)
    const tenantId = new mongoose.Types.ObjectId('69d2f3e5e85e559ce87e9d19');
    console.log('\n=== Testing $text search (as controller does) ===');
    const textResults = await Product.find({
      tenantId,
      isActive: true,
      $text: { $search: 'aceite' }
    }).limit(5);
    console.log(`$text search returned ${textResults.length} results:`);
    textResults.forEach(p => console.log(`  - ${p.name}`));
    
    // Test with $facet (exact controller pipeline)
    console.log('\n=== Testing controller pipeline (with $text + $facet) ===');
    const pipeline = [
      { $match: { tenantId, isActive: true, $text: { $search: 'aceite' } } },
      { $addFields: { score: { $meta: 'textScore' } } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $sort: { score: { $meta: 'textScore' } } },
            { $skip: 0 },
            { $limit: 5 }
          ]
        }
      }
    ];
    
    const [results] = await Product.aggregate(pipeline);
    console.log(`Pipeline total count: ${results.metadata[0]?.total}`);
    console.log(`Pipeline returned data: ${results.data.length} products`);
    results.data.forEach(p => console.log(`  - ${p.name} (score: ${p.score?.toFixed(2)})`));
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

check();
