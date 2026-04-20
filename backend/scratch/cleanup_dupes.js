require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product.model');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const tenantId = new mongoose.Types.ObjectId('69d2f3e5e85e559ce87e9d19');

    // 1. Remove products with tenantId: null (old test products)
    const nullResult = await Product.deleteMany({ tenantId: null });
    console.log(`✅ Deleted ${nullResult.deletedCount} products with null tenantId`);

    // 2. Remove duplicate products (keep the newer one with images if any, else keep the first)
    const dupes = await Product.aggregate([
      { $match: { tenantId } },
      { $group: { _id: '$name', count: { $sum: 1 }, docs: { $push: { _id: '$_id', images: '$images', createdAt: '$createdAt' } } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    console.log(`\nFound ${dupes.length} duplicate groups to resolve:`);
    
    let totalDeleted = 0;
    for (const group of dupes) {
      // Sort: prefer documents with images, then keep the newest
      const sorted = group.docs.sort((a, b) => {
        const aHasImg = (a.images?.length || 0) > 0 ? 1 : 0;
        const bHasImg = (b.images?.length || 0) > 0 ? 1 : 0;
        if (bHasImg !== aHasImg) return bHasImg - aHasImg;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      // Keep first (best), delete the rest
      const toDelete = sorted.slice(1).map(d => d._id);
      const deleteResult = await Product.deleteMany({ _id: { $in: toDelete } });
      console.log(`  - "${group._id}": kept ${sorted[0]._id}, deleted ${deleteResult.deletedCount}`);
      totalDeleted += deleteResult.deletedCount;
    }
    
    console.log(`\n✅ Total duplicates removed: ${totalDeleted}`);
    
    // Final count
    const remaining = await Product.countDocuments({ tenantId });
    console.log(`✅ Remaining active products for tenant: ${remaining}`);
    
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

cleanup();
