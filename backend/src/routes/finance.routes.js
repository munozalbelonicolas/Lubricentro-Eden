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

router.post('/expenses', financeController.createExpense);
router.delete('/expenses/:id', financeController.deleteExpense);

module.exports = router;
