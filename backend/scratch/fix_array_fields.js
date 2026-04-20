require('dotenv').config();
const mongoose = require('mongoose');

async function fixArrayFields() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const collection = mongoose.connection.collection('products');
    
    // Find all products where images is a string (not an array)
    const cursor = collection.find({});
    let fixedImages = 0;
    let fixedCompatibility = 0;
    let fixedBoth = 0;
    
    const updates = [];
    
    await cursor.forEach(doc => {
      const update = {};
      let needsUpdate = false;
      
      // Fix images field
      if (typeof doc.images === 'string') {
        if (doc.images === '') {
          update.images = [];
        } else {
          update.images = [doc.images];
        }
        fixedImages++;
        needsUpdate = true;
      }
      
      // Fix vehicleCompatibility field
      if (typeof doc.vehicleCompatibility === 'string') {
        if (doc.vehicleCompatibility === '') {
          update.vehicleCompatibility = [];
        } else {
          // Split by comma if it has commas (was comma-separated string)
          update.vehicleCompatibility = doc.vehicleCompatibility.split(',').map(v => v.trim()).filter(Boolean);
        }
        fixedCompatibility++;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        updates.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: update }
          }
        });
      }
    });
    
    console.log(`\nFound issues:`);
    console.log(`  - Products with string images: ${fixedImages}`);
    console.log(`  - Products with string vehicleCompatibility: ${fixedCompatibility}`);
    
    if (updates.length > 0) {
      const result = await collection.bulkWrite(updates);
      console.log(`\n✅ Fixed ${result.modifiedCount} products`);
    } else {
      console.log('\n✅ No fixes needed');
    }
    
    // Verify
    const sample = await collection.find({ 
      images: { $type: 'string' } 
    }).limit(3).toArray();
    console.log(`\nRemaining string images: ${sample.length}`);
    
    // Show a product that had a cloudinary URL as string
    const fixed = await collection.findOne({ 
      images: { $elemMatch: { $regex: /cloudinary/ } }
    });
    if (fixed) {
      console.log(`\nSample fixed product: ${fixed.name}`);
      console.log(`  images: ${JSON.stringify(fixed.images)}`);
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

fixArrayFields();
