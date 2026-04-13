'use strict';

const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePassword, verifyEmail, googleAuth, googleRegister, refresh } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const tenantMiddleware = require('../middlewares/tenant.middleware');

// Registro (usa tenantMiddleware para detectar si es registro de cliente en tienda existente)
router.post('/register', tenantMiddleware, registerValidator, validate, register);

// Verificación de email
router.get('/verify-email', verifyEmail);

// Login SÍ requiere X-Tenant-ID para encontrar la tienda
router.post('/login', tenantMiddleware, loginValidator, validate, login);

router.post('/refresh', refresh);

// Google SSO
router.post('/google', tenantMiddleware, googleAuth);
router.post('/google-register', tenantMiddleware, googleRegister);

router.use(protect);
router.get('/me', tenantMiddleware, getMe);
router.patch('/update-password', updatePassword);

module.exports = router;
