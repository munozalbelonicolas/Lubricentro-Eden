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
  const defaultStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  
  // Validar fechas de entrada
  let start = startDate ? new Date(startDate) : defaultStart;
  let end = endDate ? new Date(endDate) : now;
  
  if (isNaN(start.getTime())) start = defaultStart;
  if (isNaN(end.getTime())) end = now;
  if (start > end) start = new Date(end.getFullYear(), end.getMonth() - 11, 1);

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
        total: { $sum: { $ifNull: ['$total', 0] } }
      }
    }
  ]);

  // 2. Ingresos por Taller (Task.date: String 'YYYY-MM-DD')
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  const taskIncome = await Task.aggregate([
    { 
      $match: { 
        tenantId, 
        status: 'done',
        date: { $gte: startStr, $lte: endStr }
      } 
    },
    {
      $group: {
        _id: { 
          year: { $year: { $convert: { input: '$date', to: 'date', onError: new Date(2000,0,1) } } }, 
          month: { $month: { $convert: { input: '$date', to: 'date', onError: new Date(2000,0,1) } } } 
        },
        total: { $sum: { $ifNull: ['$totalValue', 0] } }
      }
    }
  ]);

  // 3. Egresos (Expense.date: Date)
  const expenses = await Expense.aggregate([
    { 
      $match: { 
        tenantId,
        date: { $gte: start, $lte: end }
      } 
    },
    {
      $group: {
        _id: { 
          year: { $year: { $ifNull: ['$date', new Date(2000,0,1)] } }, 
          month: { $month: { $ifNull: ['$date', new Date(2000,0,1)] } } 
        },
        total: { $sum: { $ifNull: ['$amount', 0] } }
      }
    }
  ]);

  // Reconstruir histórico mes a mes
  const history = [];
  const curr = new Date(start.getFullYear(), start.getMonth(), 1);
  const stop = new Date(end.getFullYear(), end.getMonth(), 1);
  
  // Límite de seguridad para evitar bucles infinitos
  let safetyCounter = 0;
  while (curr <= stop && safetyCounter < 100) {
    safetyCounter++;
    const y = curr.getFullYear();
    const m = curr.getMonth() + 1;

    const ordIn = orderIncome.find(x => x._id && x._id.year === y && x._id.month === m)?.total || 0;
    const tskIn = taskIncome.find(x => x._id && x._id.year === y && x._id.month === m)?.total || 0;
    const exp   = expenses.find(x => x._id && x._id.year === y && x._id.month === m)?.total || 0;

    history.push({
      monthName: curr.toLocaleString('es-AR', { month: 'short' }),
      month: m,
      year: y,
      income: Number(ordIn + tskIn).toFixed(2) * 1,
      expenses: Number(exp).toFixed(2) * 1,
      profit: Number((ordIn + tskIn) - exp).toFixed(2) * 1
    });
    
    curr.setMonth(curr.getMonth() + 1);
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

