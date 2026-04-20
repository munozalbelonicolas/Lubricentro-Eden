require('dotenv').config();
const mongoose = require('mongoose');

async function fixStringImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const collection = mongoose.connection.collection('products');
    
    // Find products where images is a BSON string type (type: 2)
    const strImages = await collection.find({ images: { $type: 2 } }).toArray();
    console.log(`\nProducts with string images: ${strImages.length}`);
    strImages.forEach(p => console.log(`  - "${p.name}" | images: ${JSON.stringify(p.images)}`));
    
    // Find products where vehicleCompatibility is a BSON string type
    const strCompat = await collection.find({ vehicleCompatibility: { $type: 2 } }).toArray();
    console.log(`\nProducts with string vehicleCompatibility: ${strCompat.length}`);
    strCompat.forEach(p => console.log(`  - "${p.name}" | compat: ${JSON.stringify(p.vehicleCompatibility)}`));
    
    // Fix string images -> wrap in array
    let fixedCount = 0;
    for (const doc of strImages) {
      const newImages = doc.images === '' ? [] : [doc.images];
      await collection.updateOne(
        { _id: doc._id },
        { $set: { images: newImages } }
      );
      fixedCount++;
    }
    if (fixedCount > 0) console.log(`\n✅ Fixed ${fixedCount} products with string images`);
    
    // Fix string vehicleCompatibility -> split by comma
    let fixedCompatCount = 0;
    for (const doc of strCompat) {
      const newCompat = doc.vehicleCompatibility === ''
        ? []
        : doc.vehicleCompatibility.split(',').map(v => v.trim()).filter(Boolean);
      await collection.updateOne(
        { _id: doc._id },
        { $set: { vehicleCompatibility: newCompat } }
      );
      fixedCompatCount++;
    }
    if (fixedCompatCount > 0) console.log(`✅ Fixed ${fixedCompatCount} products with string vehicleCompatibility`);
    
    // Verify
    const remaining = await collection.countDocuments({ images: { $type: 2 } });
    console.log(`\nRemaining string images after fix: ${remaining}`);
    
    // Show final state of the Renault filter
    const renault = await collection.findOne({ name: /Renault/i });
    if (renault) {
      console.log(`\nRenault product verification:`);
      console.log(`  images type: ${Array.isArray(renault.images) ? 'array' : typeof renault.images}`);
      console.log(`  images: ${JSON.stringify(renault.images)}`);
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

fixStringImages();
