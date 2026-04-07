'use strict';

const express = require('express');
const router = express.Router();
const { getMySubscription, getPlans, upgradePlan } = require('../controllers/subscription.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const tenantMiddleware = require('../middlewares/tenant.middleware');

router.get('/plans', getPlans);

router.use(tenantMiddleware, protect, restrictTo('admin'));
router.get('/me', getMySubscription);
router.post('/upgrade', upgradePlan);

module.exports = router;
