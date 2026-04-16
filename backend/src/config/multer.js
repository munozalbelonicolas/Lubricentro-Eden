'use strict';

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const AppError = require('../utils/AppError');

// Configuramos Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuración de Storage para Multer con Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determinar la carpeta según el tipo de subida
    const folder = req.uploadType === 'logo' ? 'lubricentro_eden/logos' : 'lubricentro_eden/products';
    
    // Generar prefijo único para nombre
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const publicId = `${req.tenantId || 'general'}-${uniqueSuffix}`;
    
    return {
      folder: folder,
      public_id: publicId,
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new AppError('Solo se permiten imágenes (jpeg, jpg, png, gif, webp).', 400));
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

module.exports = upload;
