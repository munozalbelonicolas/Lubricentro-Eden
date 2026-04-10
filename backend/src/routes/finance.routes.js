'use strict';

const express = require('express');
const financeController = require('../controllers/finance.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

// Todas las rutas de finanzas requieren autenticación y rol admin por seguridad financiera
router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', financeController.getFinanceStats);
router.get('/transactions', financeController.getTransactions);

// Estadísticas avanzadas
const statsController = require('../controllers/stats.controller');
router.get('/stats/best-sellers', statsController.getBestSellers);
router.get('/stats/evolution', statsController.getFinanceEvolution);
router.get('/stats/product/:productId', statsController.getProductEvolution);

router.post('/expenses', financeController.createExpense);
router.delete('/expenses/:id', financeController.deleteExpense);

module.exports = router;
