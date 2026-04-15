'use strict';

const express = require('express');
const router  = express.Router();
const { quote } = require('../controllers/shipping.controller');
const tenantMiddleware = require('../middlewares/tenant.middleware');

// tenantMiddleware inyecta req.tenantId (y req.tenant) con el único tenant
// de la BD — hace que la configuración de envío gratis funcione sin multi-tenant
router.use(tenantMiddleware);

/**
 * POST /api/shipping/quote
 * Calcula el costo de envío para un código postal destino.
 * Puede ser usado sin autenticación (info pública del carrito).
 */
router.post('/quote', quote);

module.exports = router;
