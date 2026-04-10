'use strict';

const mongoose = require('mongoose');
const Order = require('../models/Order.model');
const Expense = require('../models/Expense.model');
const Task = require('../models/Task.model');
const catchAsync = require('../utils/catchAsync');

/**
 * Obtener productos más vendidos
 */
exports.getBestSellers = catchAsync(async (req, res) => {
  const tenantId = new mongoose.Types.ObjectId(req.user.tenantId);
  const { startDate, endDate } = req.query;

  const match = { tenantId, paymentStatus: 'approved' };
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const bestSellers = await Order.aggregate([
    { $match: match },
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
  const tenantId = new mongoose.Types.ObjectId(req.user.tenantId);
  const { startDate, endDate } = req.query;
  
  const now = new Date();
  const defaultTwelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  
  const start = startDate ? new Date(startDate) : defaultTwelveMonthsAgo;
  const end = endDate ? new Date(endDate) : now;

  // 1. Ingresos por Órdenes Web
  const orderIncome = await Order.aggregate([
    { 
      $match: { 
        tenantId, 
        paymentStatus: 'approved',
        createdAt: { $gte: start, $lte: end }
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
        date: { 
          $gte: start,
          $lte: end
        }
      } 
    },
    {
      $group: {
        _id: { 
          year: { $year: '$date' }, 
          month: { $month: '$date' } 
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
        date: { 
          $gte: start,
          $lte: end
        }
      } 
    },
    {
      $group: {
        _id: { 
          year: { $year: '$date' }, 
          month: { $month: '$date' } 
        },
        total: { $sum: '$amount' }
      }
    }
  ]);

  // Determinar cuántos meses cubrir
  const history = [];
  const tempDate = new Date(start.getFullYear(), start.getMonth(), 1);
  
  while (tempDate <= end) {
    const y = tempDate.getFullYear();
    const m = tempDate.getMonth() + 1;

    const ordIn = orderIncome.find(x => x._id.year === y && x._id.month === m)?.total || 0;
    const tskIn = taskIncome.find(x => x._id.year === y && x._id.month === m)?.total || 0;
    const exp   = expenses.find(x    => x._id.year === y && x._id.month === m)?.total || 0;

    history.push({
      monthName: tempDate.toLocaleString('es-AR', { month: 'short' }),
      month: m,
      year: y,
      income: ordIn + tskIn,
      expenses: exp,
      profit: (ordIn + tskIn) - exp
    });
    
    tempDate.setMonth(tempDate.getMonth() + 1);
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
  const tenantId = new mongoose.Types.ObjectId(req.user.tenantId);
  const prodId = new mongoose.Types.ObjectId(productId);
  
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const evolution = await Order.aggregate([
    { 
      $match: { 
        tenantId, 
        paymentStatus: 'approved',
        createdAt: { $gte: sixMonthsAgo },
        'items.productId': prodId
      } 
    },
    { $unwind: '$items' },
    { $match: { 'items.productId': prodId } },
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

  // Rellenar meses faltantes (fijo a 6 meses por ahora para este gráfico específico)
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

/**
 * Obtener estadísticas de visitas desde Umami
 */
const umamiService = require('../services/umami.service');

exports.getSiteVisits = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const now = new Date();
  const start = startDate ? new Date(startDate).getTime() : new Date(now.getFullYear(), now.getMonth() - 5, 1).getTime();
  const end = endDate ? new Date(endDate).getTime() : now.getTime();

  const [stats, pageviews] = await Promise.all([
    umamiService.getUmamiStats(start, end),
    umamiService.getUmamiPageviews(start, end, 'month')
  ]);

  // Formatear pageviews para el frontend
  let formattedViews = [];
  if (pageviews && pageviews.pageviews) {
    formattedViews = pageviews.pageviews.map(pv => {
      const d = new Date(pv.t);
      return {
        monthName: d.toLocaleString('es-AR', { month: 'short' }),
        views: pv.y,
        visitors: pageviews.sessions.find(s => s.t === pv.t)?.y || 0
      };
    });
  }

  res.json({
    status: 'success',
    data: {
      summary: stats,
      history: formattedViews
    }
  });
});

