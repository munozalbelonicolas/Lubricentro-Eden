'use strict';

const express = require('express');
const router = express.Router();
const {
  createOrder, getOrders, getOrder, updateOrderStatus, getOrderStats,
} = require('../controllers/order.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const tenantMiddleware = require('../middlewares/tenant.middleware');

router.use(tenantMiddleware, protect);

router.get('/stats', restrictTo('admin'), getOrderStats);
router.get('/', getOrders);
router.post('/', createOrder);
router.get('/:id', getOrder);
router.patch('/:id/status', restrictTo('admin'), updateOrderStatus);

module.exports = router;
