'use strict';

const Order = require('../models/Order.model');
const Expense = require('../models/Expense.model');
const Task = require('../models/Task.model');
const catchAsync = require('../utils/catchAsync');

/**
 * Obtener productos más vendidos
 */
exports.getBestSellers = catchAsync(async (req, res) => {
  const tenantId = req.user.tenantId;

  const bestSellers = await Order.aggregate([
    { $match: { tenantId, paymentStatus: 'approved' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.name' },
        totalSold: { $sum: '$items.quantity' },
        ordersCount: { $sum: 1 },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 }
  ]);

  res.json({
    status: 'success',
    data: { bestSellers }
  });
});

/**
 * Evolución mensual de finanzas (Ingresos vs Egresos)
 */
exports.getFinanceEvolution = catchAsync(async (req, res) => {
  const tenantId = req.user.tenantId;
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // 1. Ingresos por Órdenes Web
  const orderIncome = await Order.aggregate([
    { 
      $match: { 
        tenantId, 
        paymentStatus: 'approved',
        createdAt: { $gte: twelveMonthsAgo }
      } 
    },
    {
      $group: {
        _id: { 
          year: { $year: '$createdAt' }, 
          month: { $month: '$createdAt' } 
        },
        total: { $sum: '$total' }
      }
    }
  ]);

  // 2. Ingresos por Taller
  const taskIncome = await Task.aggregate([
    { 
      $match: { 
        tenantId, 
        status: 'done',
        date: { $gte: twelveMonthsAgo.toISOString().split('T')[0] }
      } 
    },
    {
      $group: {
        _id: { 
          year: { $year: { $toDate: '$date' } }, 
          month: { $month: { $toDate: '$date' } } 
        },
        total: { $sum: '$totalValue' }
      }
    }
  ]);

  // 3. Egresos
  const expenses = await Expense.aggregate([
    { 
      $match: { 
        tenantId,
        date: { $gte: twelveMonthsAgo.toISOString().split('T')[0] }
      } 
    },
    {
      $group: {
        _id: { 
          year: { $year: { $toDate: '$date' } }, 
          month: { $month: { $toDate: '$date' } } 
        },
        total: { $sum: '$amount' }
      }
    }
  ]);

  // Unificar por mes
  const history = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;

    const ordIn = orderIncome.find(x => x._id.year === y && x._id.month === m)?.total || 0;
    const tskIn = taskIncome.find(x => x._id.year === y && x._id.month === m)?.total || 0;
    const exp   = expenses.find(x    => x._id.year === y && x._id.month === m)?.total || 0;

    history.push({
      monthName: d.toLocaleString('es-AR', { month: 'short' }),
      month: m,
      year: y,
      income: ordIn + tskIn,
      expenses: exp,
      profit: (ordIn + tskIn) - exp
    });
  }

  res.json({
    status: 'success',
    data: { history }
  });
});

/**
 * Evolución de un producto específico
 */
exports.getProductEvolution = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const tenantId = req.user.tenantId;
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const evolution = await Order.aggregate([
    { 
      $match: { 
        tenantId, 
        paymentStatus: 'approved',
        createdAt: { $gte: sixMonthsAgo },
        'items.productId': new (require('mongoose').Types.ObjectId)(productId)
      } 
    },
    { $unwind: '$items' },
    { $match: { 'items.productId': new (require('mongoose').Types.ObjectId)(productId) } },
    {
      $group: {
        _id: { 
          year: { $year: '$createdAt' }, 
          month: { $month: '$createdAt' } 
        },
        sales: { $sum: '$items.quantity' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Rellenar meses faltantes
  const result = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;

    const found = evolution.find(x => x._id.year === y && x._id.month === m);
    result.push({
      monthName: d.toLocaleString('es-AR', { month: 'short' }),
      sales: found ? found.sales : 0
    });
  }

  res.json({
    status: 'success',
    data: { evolution: result }
  });
});
