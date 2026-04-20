require('dotenv').config();
const mongoose = require('mongoose');

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const collection = mongoose.connection.collection('products');
    
    // Check the Renault filter raw
    const renault = await collection.findOne({ name: /Renault 8200108203/i });
    console.log('Renault raw images:', JSON.stringify(renault?.images));
    console.log('Images type:', typeof renault?.images);
    console.log('Is array?', Array.isArray(renault?.images));
    if (Array.isArray(renault?.images)) {
      console.log('First element type:', typeof renault.images[0]);
      console.log('First element:', JSON.stringify(renault.images[0]));
    }
    
    // Find all products where images is an array-of-arrays (double nested)
    const all = await collection.find({}).toArray();
    let doubleNested = 0;
    let correctArrayWithUrl = 0;
    let emptyArray = 0;
    let stringImages = 0;
    let nullImages = 0;
    
    for (const doc of all) {
      if (doc.images === null || doc.images === undefined) nullImages++;
      else if (typeof doc.images === 'string') stringImages++;
      else if (Array.isArray(doc.images)) {
        if (doc.images.length === 0) emptyArray++;
        else if (Array.isArray(doc.images[0])) doubleNested++;
        else if (typeof doc.images[0] === 'string' && doc.images[0] !== '') correctArrayWithUrl++;
        else emptyArray++; // array with empty strings
      }
    }
    
    console.log('\n=== Images field breakdown ===');
    console.log(`  null/undefined: ${nullImages}`);
    console.log(`  plain string: ${stringImages}`);
    console.log(`  empty array []: ${emptyArray}`);
    console.log(`  array with URL strings (correct): ${correctArrayWithUrl}`);
    console.log(`  double-nested (broken): ${doubleNested}`);
    
    // Fix double-nested
    if (doubleNested > 0) {
      console.log('\nFixing double-nested arrays...');
      let fixed = 0;
      for (const doc of all) {
        if (Array.isArray(doc.images) && doc.images.length > 0 && Array.isArray(doc.images[0])) {
          const flattened = doc.images.flat();
          await collection.updateOne({ _id: doc._id }, { $set: { images: flattened } });
          fixed++;
        }
      }
      console.log(`✅ Fixed ${fixed} double-nested products`);
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

inspect();
