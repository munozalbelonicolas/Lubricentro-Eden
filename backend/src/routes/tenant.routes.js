'use strict';

const express = require('express');
const router = express.Router();
const {
  getMyTenant, updateMyTenant, uploadLogo, getTenantUsers, getPublicTenant,
} = require('../controllers/tenant.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const tenantMiddleware = require('../middlewares/tenant.middleware');
const upload = require('../config/multer');

// Ruta pública: info de tienda por slug
router.get('/public/:slug', getPublicTenant);

// Rutas protegidas (requieren tenant + auth)
router.use(tenantMiddleware, protect, restrictTo('admin'));

router.get('/me', getMyTenant);
router.put('/me', updateMyTenant);
router.post('/me/logo', (req, _res, next) => { req.uploadType = 'logo'; next(); }, upload.single('logo'), uploadLogo);
router.get('/me/users', getTenantUsers);

module.exports = router;
