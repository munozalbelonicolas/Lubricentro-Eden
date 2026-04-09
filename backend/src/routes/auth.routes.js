'use strict';

const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePassword, verifyEmail } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const tenantMiddleware = require('../middlewares/tenant.middleware');

// Registro (usa tenantMiddleware para detectar si es registro de cliente en tienda existente)
router.post('/register', tenantMiddleware, register);

// Verificación de email
router.get('/verify-email', verifyEmail);

// Login SÍ requiere X-Tenant-ID para encontrar la tienda
router.post('/login', tenantMiddleware, login);

router.use(protect);
router.get('/me', tenantMiddleware, getMe);
router.patch('/update-password', updatePassword);

module.exports = router;
