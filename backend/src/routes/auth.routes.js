'use strict';

const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePassword } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const tenantMiddleware = require('../middlewares/tenant.middleware');

// El registro NO requiere tenant previo (crea uno nuevo)
router.post('/register', register);

// Login SÍ requiere X-Tenant-ID para encontrar la tienda
router.post('/login', tenantMiddleware, login);

router.use(protect);
router.get('/me', tenantMiddleware, getMe);
router.patch('/update-password', updatePassword);

module.exports = router;
