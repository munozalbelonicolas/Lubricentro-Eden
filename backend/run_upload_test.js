require('dotenv').config({path: '.env'});
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'test',
  api_key: process.env.CLOUDINARY_API_KEY || 'test',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'test',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'test',
      public_id: 'test_id',
    };
  },
});

console.log("Cloudinary Configured successfully.");
process.exit(0);
