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

/**
 * Obtener historial clínico unificado de un vehículo
 * Busca tanto en Tareas (taller) como en Órdenes (tienda)
 */
exports.getVehicleHistory = catchAsync(async (req, res) => {
  const { plate, startDate, endDate } = req.query;
  const tenantId = req.user.tenantId;

  // Cargar modelos necesarios
  const Order = require('../models/Order.model');

  // Filtros base
  const taskQuery = { tenantId, status: 'done' };
  const orderQuery = { tenantId, status: { $in: ['delivered', 'confirmed', 'processing', 'ready_pickup'] } };

  if (plate) {
    const cleanPlate = plate.replace(/\s+/g, '').split('').join('\\s*');
    const plateRegex = { $regex: new RegExp(`${cleanPlate}`, 'i') }; // Búsqueda parcial más flexible
    
    taskQuery.plate = plateRegex;
    orderQuery['workshopAppointment.vehicle'] = plateRegex;
  }

  if (startDate || endDate) {
    if (startDate) {
      taskQuery.date = { ...taskQuery.date, $gte: startDate };
      orderQuery.createdAt = { ...orderQuery.createdAt, $gte: new Date(startDate) };
    }
    if (endDate) {
      taskQuery.date = { ...taskQuery.date, $lte: endDate };
      // Para órdenes (Date), el endDate debe ser al final del día
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      orderQuery.createdAt = { ...orderQuery.createdAt, $lte: end };
    }
  }

  // Buscar en ambas colecciones
  const [tasks, orders] = await Promise.all([
    Task.find(taskQuery).lean(),
    Order.find(orderQuery).lean()
  ]);

  // Normalizar Órdenes para que se parezcan a Tareas en el listado
  const normalizedOrders = orders.map(o => ({
    _id: o._id,
    title: `Pedido Web #${o.orderNumber?.slice(-6) || o._id.toString().slice(-6)}`,
    date: o.createdAt,
    currentKm: o.workshopAppointment?.km || 0,
    items: (o.items || []).map(i => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price
    })),
    totalValue: o.total,
    serviceData: {
      observations: `Pedido vía web (${o.deliveryType === 'workshop' ? 'Turno Taller' : 'Envio/Retiro'}).`,
      oilBrand: (o.items || []).find(i => i.name.toLowerCase().includes('aceite'))?.name || 'N/A'
    },
    _type: 'order'
  }));

  const normalizedTasks = tasks.map(t => ({ 
    ...t, 
    _type: 'task',
    date: t.date // Aseguramos que tenga date
  }));

  // Combinar y ordenar cronológicamente descendente
  const history = [...normalizedTasks, ...normalizedOrders].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  res.status(200).json({
    status: 'success',
    results: history.length,
    data: { history }
  });
});
