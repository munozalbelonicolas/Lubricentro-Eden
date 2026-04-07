'use strict';

const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct,
  deleteProduct, deleteProductImage, getBrands,
} = require('../controllers/product.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const tenantMiddleware = require('../middlewares/tenant.middleware');
const { checkProductLimit } = require('../middlewares/plan.middleware');
const upload = require('../config/multer');

// Todas las rutas de productos requieren X-Tenant-ID
router.use(tenantMiddleware);

// Públicas (catálogo)
router.get('/', getProducts);
router.get('/brands', getBrands);
router.get('/:id', getProduct);

// Admin
router.use(protect, restrictTo('admin'));
router.post('/', checkProductLimit, upload.array('images', 5), createProduct);
router.put('/:id', upload.array('images', 5), updateProduct);
router.delete('/:id', deleteProduct);
router.delete('/:id/images/:imageIndex', deleteProductImage);

module.exports = router;
