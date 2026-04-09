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
  const { plate } = req.params;

  if (!plate) {
    return next(new AppError('Debes proporcionar una patente.', 400));
  }

  // Buscar todas las tareas hechas para esta patente en este tenant
  const history = await Task.find({
    tenantId: req.user.tenantId,
    plate: plate.toUpperCase().trim(),
    status: 'done'
  }).sort({ date: -1 });

  res.status(200).json({
    status: 'success',
    results: history.length,
    data: { history }
  });
});
