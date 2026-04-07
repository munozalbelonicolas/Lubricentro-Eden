'use strict';

const express = require('express');
const router = express.Router();
const { createPreference, webhook, getPaymentByOrder } = require('../controllers/payment.controller');
const { protect } = require('../middlewares/auth.middleware');
const tenantMiddleware = require('../middlewares/tenant.middleware');

// Webhook MP — sin auth, con body raw
router.post('/webhook', webhook);

// Rutas protegidas
router.use(tenantMiddleware, protect);
router.post('/create-preference', createPreference);
router.get('/order/:orderId', getPaymentByOrder);

module.exports = router;
