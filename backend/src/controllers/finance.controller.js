'use strict';

const Expense = require('../models/Expense.model');
const Order = require('../models/Order.model');
const Task = require('../models/Task.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

/**
 * Obtener balance general y estadísticas financieras
 */
exports.getFinanceStats = catchAsync(async (req, res, next) => {
  const tenantId = req.user.tenantId;
  const { month, year } = req.query;

  const filter = { tenantId };
  
  if (year) {
    const y = parseInt(year);
    const m = month ? parseInt(month) - 1 : null;
    
    let start, end;
    if (m !== null) {
      start = new Date(y, m, 1);
      end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    } else {
      start = new Date(y, 0, 1);
      end = new Date(y, 11, 31, 23, 59, 59, 999);
    }
    filter.createdAt = { $gte: start, $lte: end };
  }

  const expenseFilter = { ...filter };
  const taskFilter = { ...filter };
  if (filter.createdAt) {
    const startStr = filter.createdAt.$gte.toISOString().split('T')[0];
    const endStr = filter.createdAt.$lte.toISOString().split('T')[0];
    
    taskFilter.date = { $gte: startStr, $lte: endStr };
    expenseFilter.date = { $gte: filter.createdAt.$gte, $lte: filter.createdAt.$lte };
    
    delete taskFilter.createdAt;
    delete expenseFilter.createdAt;
  }

  const [incomeOrders, incomeTasks, totalExpenses] = await Promise.all([
    Order.aggregate([
      { $match: { ...filter, paymentStatus: 'approved' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    Task.aggregate([
      { $match: taskFilter },
      { $group: { _id: null, total: { $sum: '$totalValue' } } }
    ]),
    Expense.aggregate([
      { $match: expenseFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const totalIn = (incomeOrders[0]?.total || 0) + (incomeTasks[0]?.total || 0);
  const totalOut = totalExpenses[0]?.total || 0;

  res.json({
    status: 'success',
    data: {
      totalIncome: totalIn,
      totalExpenses: totalOut,
      balance: totalIn - totalOut
    }
  });
});

/**
 * Obtener listado unificado de transacciones (Libro Diario)
 */
exports.getTransactions = catchAsync(async (req, res, next) => {
  const tenantId = req.user.tenantId;
  const { startDate, endDate, month, year } = req.query;

  const orderFilter = { tenantId, paymentStatus: 'approved' };
  const taskFilter = { tenantId, status: 'done' };
  const expenseFilter = { tenantId };

  if (year) {
    const y = parseInt(year);
    const m = month ? parseInt(month) - 1 : null;
    let start, end;
    if (m !== null) {
      start = new Date(y, m, 1);
      end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    } else {
      start = new Date(y, 0, 1);
      end = new Date(y, 11, 31, 23, 59, 59, 999);
    }
    orderFilter.createdAt = { $gte: start, $lte: end };
    taskFilter.date = { $gte: start.toISOString().split('T')[0], $lte: end.toISOString().split('T')[0] };
    expenseFilter.date = { $gte: start.toISOString().split('T')[0], $lte: end.toISOString().split('T')[0] };
  } else if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : new Date(2000, 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    if (endDate) end.setHours(23, 59, 59, 999);

    const range = { $gte: start, $lte: end };
    orderFilter.createdAt = range;
    
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    taskFilter.date = { $gte: startStr, $lte: endStr };
    expenseFilter.date = range;
  }

  // Buscamos todo lo que genera movimiento de dinero
  const [orders, tasks, expenses] = await Promise.all([
    Order.find(orderFilter).lean(),
    Task.find(taskFilter).lean(),
    Expense.find(expenseFilter).lean()
  ]);

  // Normalizamos para unificar en un solo listado
  const transactions = [
    ...orders.map(o => ({
      id: o._id,
      date: o.createdAt,
      type: 'ingreso',
      source: 'venta_web',
      description: `Pedido #${o.orderNumber?.slice(-6) || o._id.toString().slice(-6)}`,
      amount: o.total
    })),
    ...tasks.map(t => ({
      id: t._id,
      date: t.date, // Tareas usan string YYYY-MM-DD
      type: 'ingreso',
      source: 'taller',
      description: `Servicio: ${t.title}`,
      amount: t.totalValue
    })),
    ...expenses.map(e => ({
      id: e._id,
      date: e.date,
      type: 'egreso',
      source: e.category,
      description: e.description,
      amount: e.amount
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({
    status: 'success',
    results: transactions.length,
    data: { transactions }
  });
});

/**
 * CRUD Egresos
 */
exports.createExpense = catchAsync(async (req, res, next) => {
  req.body.tenantId = req.user.tenantId;
  req.body.createdBy = req.user._id;

  const expense = await Expense.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { expense }
  });
});

exports.deleteExpense = catchAsync(async (req, res, next) => {
  const expense = await Expense.findOneAndDelete({
    _id: req.params.id,
    tenantId: req.user.tenantId
  });

  if (!expense) {
    return next(new AppError('No se encontró el gasto o no tienes permiso.', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
