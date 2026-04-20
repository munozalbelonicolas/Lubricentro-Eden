require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product.model');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // 1. Check a product with all fields
    const product = await Product.findOne({ isActive: true, images: { $ne: [] } });
    if (product) {
      console.log('\n=== Product with images ===');
      console.log('Name:', product.name);
      console.log('Description:', product.description);
      console.log('Images:', product.images);
      console.log('Category:', product.category);
    }

    // 2. Check how many products have empty descriptions
    const totalActive = await Product.countDocuments({ isActive: true });
    const noDesc = await Product.countDocuments({ isActive: true, $or: [{ description: '' }, { description: null }, { description: { $exists: false } }] });
    const noImages = await Product.countDocuments({ isActive: true, $or: [{ images: [] }, { images: { $exists: false } }] });
    const withImages = await Product.countDocuments({ isActive: true, images: { $ne: [] } });
    
    console.log('\n=== Stats ===');
    console.log(`Total active products: ${totalActive}`);
    console.log(`Products WITHOUT description: ${noDesc}`);
    console.log(`Products WITHOUT images: ${noImages}`);
    console.log(`Products WITH images: ${withImages}`);

    // 3. Test the aggregation pipeline (simulating what the controller does)
    console.log('\n=== Testing aggregation pipeline ===');
    const pipeline = [
      { $match: { isActive: true } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: 0 },
            { $limit: 5 }
          ]
        }
      }
    ];

    const [results] = await Product.aggregate(pipeline);
    const products = results.data;
    console.log(`Aggregation returned ${products.length} products:`);
    products.forEach(p => {
      console.log(`  - ${p.name} | desc: "${(p.description || '').substring(0, 50)}" | images: ${p.images?.length || 0}`);
    });

    // 4. Test Atlas Search
    console.log('\n=== Testing Atlas $search ===');
    try {
      const searchPipeline = [
        {
          $search: {
            index: 'default',
            text: {
              query: 'aceite',
              path: ['name', 'description', 'brand'],
              fuzzy: { maxEdits: 1 }
            }
          }
        },
        { $match: { isActive: true } },
        { $limit: 3 }
      ];
      const searchResults = await Product.aggregate(searchPipeline);
      console.log(`Atlas Search returned ${searchResults.length} results`);
      searchResults.forEach(p => console.log(`  - ${p.name}`));
    } catch (err) {
      console.log('Atlas Search FAILED:', err.message);
    }

    // 5. Check if tenantId filtering might be the issue
    const tenants = await Product.distinct('tenantId');
    console.log('\n=== Tenant IDs ===');
    tenants.forEach(t => console.log(`  - ${t}`));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

check();
