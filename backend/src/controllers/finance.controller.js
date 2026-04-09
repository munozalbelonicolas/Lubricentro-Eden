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

  const [incomeOrders, incomeTasks, totalExpenses] = await Promise.all([
    Order.aggregate([
      { $match: { tenantId, paymentStatus: 'approved' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    Task.aggregate([
      { $match: { tenantId, status: 'done' } },
      { $group: { _id: null, total: { $sum: '$totalValue' } } }
    ]),
    Expense.aggregate([
      { $match: { tenantId } },
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
  const { startDate, endDate } = req.query;

  const filter = { tenantId };
  if (startDate || endDate) {
    filter.createdAt = {}; // Orders/Expenses use createdAt, Tasks use date. We'll handle this.
  }

  // Buscamos todo lo que genera movimiento de dinero
  const [orders, tasks, expenses] = await Promise.all([
    Order.find({ tenantId, paymentStatus: 'approved' }).lean(),
    Task.find({ tenantId, status: 'done' }).lean(),
    Expense.find({ tenantId }).lean()
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

exports.deleteExpense = catchAsync(async (req, res) => {
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
