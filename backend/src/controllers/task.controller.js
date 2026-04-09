'use strict';
const Task = require('../models/Task.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getAllTasks = catchAsync(async (req, res, next) => {
  const tasks = await Task.find({ tenantId: req.user.tenantId })
    .sort({ date: 1, createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: { tasks }
  });
});

exports.createTask = catchAsync(async (req, res, next) => {
  // Asegurar que el tenantId sea el del usuario logueado
  req.body.tenantId = req.user.tenantId;
  req.body.createdBy = req.user._id;

  const newTask = await Task.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { task: newTask }
  });
});

exports.updateTask = catchAsync(async (req, res, next) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user.tenantId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!task) {
    return next(new AppError('No se encontró la tarea o no tenés permiso.', 404));
  }

  // --- Lógica de Stock e Ingresos ---
  // Si la tarea se marca como 'done' y tiene ítems, descontamos stock
  if (req.body.status === 'done' && req.body.items && req.body.items.length > 0) {
    const Product = require('../models/Product.model');
    let totalValue = 0;

    for (const item of req.body.items) {
      if (!item.productId) continue;
      
      const product = await Product.findOneAndUpdate(
        { _id: item.productId, tenantId: req.user.tenantId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!product) {
        console.warn(`No se pudo descontar stock para producto ${item.productId}. Stock insuficiente o no encontrado.`);
        continue;
      }
      totalValue += item.price * item.quantity;
    }

    // Actualizar el totalValue en la tarea si no se envió uno manualmente
    if (!req.body.totalValue) {
      task.totalValue = totalValue;
      await task.save();
    }
  }

  res.status(200).json({
    status: 'success',
    data: { task }
  });
});

exports.deleteTask = catchAsync(async (req, res, next) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    tenantId: req.user.tenantId
  });

  if (!task) {
    return next(new AppError('No se encontró la tarea o no tenés permiso.', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getVehicleHistory = catchAsync(async (req, res, next) => {
  const { plate, startDate, endDate } = req.query;

  const query = {
    tenantId: req.user.tenantId,
    status: 'done'
  };

  if (plate) {
    // Escapar caracteres especiales y crear regex que ignore espacios y sea insensible a mayúsculas
    const cleanPlate = plate.replace(/\s+/g, '').split('').join('\\s*');
    query.plate = { $regex: new RegExp(`^\\s*${cleanPlate}\\s*$`, 'i') };
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate)   query.date.$lte = endDate;
  }

  // Si no hay filtros, podríamos limitar a los últimos 30 días para no saturar
  // Pero por ahora traemos todo lo que pida
  const history = await Task.find(query)
    .populate('items.productId', 'name brand category')
    .sort({ date: -1 });

  res.status(200).json({
    status: 'success',
    results: history.length,
    data: { history }
  });
});
