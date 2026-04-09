require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');
const Product = require('../src/models/Product.model');

const generateSlugs = async () => {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado exitosamente.\n');

    const products = await Product.find({ slug: { $exists: false } });
    console.log(`Encontrados ${products.length} productos sin slug.`);

    for (let product of products) {
      let baseSlug = slugify(product.name, { lower: true, strict: true });
      let newSlug = baseSlug;
      let counter = 1;

      // Verificar colisión
      let existing = await Product.findOne({ tenantId: product.tenantId, slug: newSlug });
      while (existing && existing._id.toString() !== product._id.toString()) {
        newSlug = `${baseSlug}-${counter}`;
        existing = await Product.findOne({ tenantId: product.tenantId, slug: newSlug });
        counter++;
      }

      product.slug = newSlug;
      await product.save({ validateBeforeSave: false });
      console.log(`✅ Producto [${product.name}] actualizado -> ${product.slug}`);
    }

    console.log('\nProceso de generación de slugs finalizado con éxito.');
    process.exit(0);
  } catch (error) {
    console.error('Error generando slugs:', error);
    process.exit(1);
  }
};

generateSlugs();
