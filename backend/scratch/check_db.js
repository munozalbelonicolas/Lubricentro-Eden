require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product.model');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const product = await Product.findOne({ name: /Elfmatic D2/i });
    if (product) {
      console.log('Product Found:', product.name);
      console.log('Images:', product.images);
    } else {
      console.log('Product not found');
    }


  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

check();
