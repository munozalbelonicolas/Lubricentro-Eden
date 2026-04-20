require('dotenv').config({ path: '.env' });
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Testing Cloudinary connection...');
console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);

cloudinary.api.ping()
  .then(res => console.log('✅ Successfully connected to Cloudinary:', res))
  .catch(err => console.error('❌ Connection error:', err));
