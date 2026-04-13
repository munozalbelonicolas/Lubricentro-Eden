'use strict';
const Task = require('../models/Task.model');
const User = require('../models/User.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { sendServiceReportEmail } = require('../utils/email.utils');
const crypto = require('crypto');

exports.getAllTasks = catchAsync(async (req, res, next) => {
  const tasks = await Task.find({ tenantId: req.user.tenantId })
    .sort({ date: 1, createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: { tasks }
  });
});

/**
 * Helper para descontar stock de productos usados en una tarea
 */
const deductStock = async (tenantId, items) => {
  if (!items || items.length === 0) return 0;
  const Product = require('../models/Product.model');
  let totalValue = 0;

  for (const item of items) {
    if (!item.productId) continue;
    
    // Solo intentar descontar si hay stock suficiente
    const product = await Product.findOneAndUpdate(
      { _id: item.productId, tenantId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );

    if (!product) {
      console.warn(`Stock insuficiente para producto ${item.productId} o no encontrado.`);
      continue;
    }
    totalValue += item.price * item.quantity;
  }
  return totalValue;
};

exports.createTask = catchAsync(async (req, res, next) => {
  const { customerName, customerEmail, customerPhone } = req.body;
  req.body.tenantId = req.user.tenantId;
  req.body.createdBy = req.user._id;

  // Si se envían datos de cliente, buscamos o creamos usuario
  if (customerEmail) {
    let user = await User.findOne({ email: customerEmail.toLowerCase(), tenantId: req.user.tenantId });
    
    if (!user && customerName) {
      // Crear usuario referido (Ghost)
      const nameParts = customerName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || 'Cliente';
      
      const tempPassword = crypto.randomBytes(6).toString('hex');
      
      user = await User.create({
        firstName,
        lastName,
        email: customerEmail.toLowerCase(),
        phone: customerPhone || '---',
        role: 'referido',
        password: tempPassword,
        tenantId: req.user.tenantId,
        isVerified: true,
        document: req.body.plate || '000000',
        birthDate: new Date('1990-01-01'),
        address: {
          street: 'Sin especificar',
          number: '0',
          city: 'Sin especificar',
          province: 'Sin especificar',
          zipCode: '0000'
        }
      });
    }

    if (user) {
      req.body.userId = user._id;
    }
  }

  const newTask = await Task.create(req.body);

  // Si se crea como 'done', descontamos stock inmediatamente
  if (newTask.status === 'done' && newTask.items && newTask.items.length > 0) {
    const calculatedTotal = await deductStock(req.user.tenantId, newTask.items);
    if (!newTask.totalValue) {
      newTask.totalValue = calculatedTotal;
      await newTask.save();
    }
  }

  res.status(201).json({
    status: 'success',
    data: { task: newTask }
  });
});

exports.updateTask = catchAsync(async (req, res, next) => {
  // Primero buscamos la tarea actual para ver el estado anterior
  const currentTask = await Task.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!currentTask) {
    return next(new AppError('No se encontró la tarea o no tenés permiso.', 404));
  }

  // Actualizamos con los nuevos datos
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user.tenantId },
    req.body,
    { new: true, runValidators: true }
  );

  // --- Lógica de Stock e Ingresos ---
  // SOLO descontamos stock si está pasando de 'pending' a 'done'
  if (currentTask.status === 'pending' && req.body.status === 'done') {
    if (task.items && task.items.length > 0) {
      const calculatedTotal = await deductStock(req.user.tenantId, task.items);
      
      // Actualizar el totalValue si no se envió uno manualmente
      if (!req.body.totalValue) {
        task.totalValue = calculatedTotal;
        await task.save();
      }
    }

    // Enviar email de reporte si hay un usuario asociado
    if (task.userId) {
      const user = await User.findById(task.userId);
      if (user && user.email) {
        try {
          await sendServiceReportEmail(user, task);
        } catch (err) {
          console.error('Error enviando reporte por email:', err);
        }
      }
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
