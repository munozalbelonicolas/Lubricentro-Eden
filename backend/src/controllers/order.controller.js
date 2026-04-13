'use strict';

const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const StockService = require('../services/stockService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * POST /api/orders
 * Crear nueva orden desde el carrito.
 */
const createOrder = catchAsync(async (req, res, next) => {
  const { items, shipping, notes, deliveryType, workshopAppointment } = req.body;

  if (!items || items.length === 0) {
    return next(new AppError('La orden debe contener al menos un producto.', 400));
  }

  // Validar turno de taller si corresponde
  if (deliveryType === 'workshop') {
    if (!workshopAppointment?.date || !workshopAppointment?.timeSlot) {
      return next(new AppError('Para el turno de taller se requiere fecha y franja horaria.', 400));
    }
    // Validar formato de franja horaria (HH:MM o HH:MM-HH:MM)
    const slotPattern = /^([01]\d|2[0-3]):[0-5]\d(-([01]\d|2[0-3]):[0-5]\d)?$/;
    if (!slotPattern.test(workshopAppointment.timeSlot)) {
      return next(new AppError('Franja horaria inválida. Use formato HH:MM (ej: 08:30).', 400));
    }
    const apptDate = new Date(workshopAppointment.date);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0,0,0,0);
    if (isNaN(apptDate.getTime()) || apptDate < tomorrow) {
      return next(new AppError('La fecha del turno debe ser a partir de mañana.', 400));
    }
  }

  // Validar y obtener precios actuales de la BD
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    tenantId: req.tenantId,
    isActive: true,
  });

  const productMap = {};
  products.forEach((p) => { productMap[p._id.toString()] = p; });

  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = productMap[item.productId];
    if (!product) {
      return res.status(409).json({
        status: 'fail',
        message: `Producto ${item.name} no encontrado o fue eliminado recientemente.`,
        errorItem: item.productId
      });
    }
    if (product.stock < item.quantity) {
      return res.status(409).json({
        status: 'fail',
        message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}.`,
        errorItem: item.productId
      });
    }

    orderItems.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      image: product.images[0] || '',
    });
    subtotal += product.price * item.quantity;
  }

  const shippingCost = 0;
  const total = subtotal + shippingCost;

  // ⚠️  NO se descuenta stock aquí.
  // El stock se descuenta solo cuando el pago es aprobado (webhook de MP).
  // Esto evita descuentos erróneos por pagos fallidos o abandonados.

  const order = await Order.create({
    tenantId: req.tenantId,
    userId: req.user._id,
    items: orderItems,
    subtotal,
    shippingCost,
    total,
    deliveryType: deliveryType || 'shipping',
    shipping: deliveryType === 'workshop' ? {} : (shipping || {}),
    workshopAppointment: deliveryType === 'workshop' ? workshopAppointment : null,
    notes: notes || '',
    status: 'pending',
    paymentStatus: 'pending',
  });

  sendSuccess(res, { order }, 201);
});

/**
 * GET /api/orders
 * Listar órdenes (admin: todas | user: solo las propias).
 */
const getOrders = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, status, paymentStatus, search } = req.query;

  const filter = { tenantId: req.tenantId };
  if (req.user.role !== 'admin') filter.userId = req.user._id;
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  // Búsqueda del lado del servidor
  if (search) {
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(escapeRegex(search), 'i');
    
    // Buscar usuarios que coincidan con el término
    const User = require('../models/User.model');
    const matchedUsers = await User.find({ 
      tenantId: req.tenantId, 
      $or: [{ firstName: rx }, { lastName: rx }, { email: rx }] 
    }).select('_id');
    
    const userIds = matchedUsers.map(u => u._id);

    filter.$or = [
      { orderNumber: rx },
      { userId: { $in: userIds } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(filter),
  ]);

  sendSuccess(res, { orders }, 200, {
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
});

/**
 * GET /api/orders/:id
 */
const getOrder = catchAsync(async (req, res, next) => {
  const filter = { _id: req.params.id, tenantId: req.tenantId };
  if (req.user.role !== 'admin') filter.userId = req.user._id;

  const order = await Order.findOne(filter).populate('userId', 'firstName lastName email');
  if (!order) return next(new AppError('Orden no encontrada.', 404));
  sendSuccess(res, { order });
});

/**
 * PATCH /api/orders/:id/status (admin)
 */
const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'ready_pickup', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return next(new AppError(`Estado inválido. Usa: ${validStatuses.join(', ')}.`, 400));
  }

  // Buscar el estado anterior
  const previousOrder = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!previousOrder) return next(new AppError('Orden no encontrada.', 404));

  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    { status },
    { new: true }
  );

  // Lógica de mitigación de fugas de stock
  // 1. Cancelando una orden paga -> Restaurar stock
  if (previousOrder.status !== 'cancelled' && status === 'cancelled' && order.paymentStatus === 'approved') {
    await StockService.restoreStock(req.tenantId, order.items);
  }
  
  // 2. Reactivando una orden cancelada que ya estaba paga -> Volver a descontar stock
  if (previousOrder.status === 'cancelled' && status !== 'cancelled' && order.paymentStatus === 'approved') {
    await StockService.deductStock(req.tenantId, order.items);
  }

  sendSuccess(res, { order });
});

/**
 * GET /api/orders/stats (admin)
 * Estadísticas del dashboard.
 */
const getOrderStats = catchAsync(async (req, res, next) => {
  const [totalOrders, totalRevDoc, taskRevDoc, pendingOrders, workshopOrders, shippingOrders, pickupOrders, recentOrders] = await Promise.all([
    Order.countDocuments({ tenantId: req.tenantId }),
    Order.aggregate([
      { $match: { tenantId: req.tenantId, paymentStatus: 'approved' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    // Ingresos de taller (tareas manuales completadas)
    require('../models/Task.model').aggregate([
      { $match: { tenantId: req.tenantId, status: 'done' } },
      { $group: { _id: null, total: { $sum: '$totalValue' } } },
    ]),
    Order.countDocuments({ tenantId: req.tenantId, status: 'pending' }),
    Order.countDocuments({ tenantId: req.tenantId, deliveryType: 'workshop' }),
    Order.countDocuments({ tenantId: req.tenantId, deliveryType: 'shipping', status: { $nin: ['delivered', 'cancelled'] } }),
    Order.countDocuments({ tenantId: req.tenantId, deliveryType: 'pickup', status: { $nin: ['delivered', 'cancelled'] } }),
    Order.find({ tenantId: req.tenantId })
      .sort('-createdAt')
      .limit(5)
      .populate('userId', 'firstName lastName email'),
  ]);

  const orderRevenue = totalRevDoc[0]?.total || 0;
  const taskRevenue  = taskRevDoc[0]?.total || 0;

  sendSuccess(res, {
    totalOrders,
    totalRevenue: orderRevenue + taskRevenue,
    pendingOrders,
    workshopOrders,
    shippingOrders,
    pickupOrders,
    recentOrders,
  });
});

module.exports = { createOrder, getOrders, getOrder, updateOrderStatus, getOrderStats };
