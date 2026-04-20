require('dotenv').config({path: '.env'});
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const express = require('express');
const app = express();
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dummy',
  api_key: process.env.CLOUDINARY_API_KEY || 'dummy',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'dummy',
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

const upload = multer({ storage });

app.post('/test', upload.single('image'), (req, res) => {
  res.json({ ok: true, file: req.file });
});

app.use((err, req, res, next) => {
  console.error("EXPRESS ERROR CAUGHT:", err);
  res.status(500).send("error");
});

const server = app.listen(5001, () => {
    console.log("ready");
    const FormData = require('form-data');
    const http = require('http');

    const form = new FormData();
    // make sure frontend/public/aceite-premium.jpg exists!
    form.append('image', fs.createReadStream('../frontend/public/aceite-premium.jpg'));

    const request = http.request({
      method: 'POST',
      host: 'localhost',
      port: 5001,
      path: '/test',
      headers: form.getHeaders()
    });

    form.pipe(request);

    request.on('response', (res) => {
      console.log(`Status: ${res.statusCode}`);
      res.on('data', d => process.stdout.write(d));
      setTimeout(() => process.exit(0), 500);
    });
});
