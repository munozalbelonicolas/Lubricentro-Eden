'use strict';

const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
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
    const validSlots = ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00'];
    if (!validSlots.includes(workshopAppointment.timeSlot)) {
      return next(new AppError(`Franja horaria inválida. Opciones: ${validSlots.join(', ')}.`, 400));
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
      return next(new AppError(`Producto ${item.productId} no encontrado o no disponible.`, 400));
    }
    if (product.stock < item.quantity) {
      return next(
        new AppError(`Stock insuficiente para "${product.name}". Disponible: ${product.stock}.`, 400)
      );
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
  const { page = 1, limit = 20, status, paymentStatus } = req.query;

  const filter = { tenantId: req.tenantId };
  if (req.user.role !== 'admin') filter.userId = req.user._id;
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('userId', 'name email')
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

  const order = await Order.findOne(filter).populate('userId', 'name email');
  if (!order) return next(new AppError('Orden no encontrada.', 404));
  sendSuccess(res, { order });
});

/**
 * PATCH /api/orders/:id/status (admin)
 */
const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return next(new AppError(`Estado inválido. Usa: ${validStatuses.join(', ')}.`, 400));
  }

  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    { status },
    { new: true }
  );
  if (!order) return next(new AppError('Orden no encontrada.', 404));

  // Solo restaurar stock si el pago fue aprobado alguna vez
  // (el stock solo se descuenta en el webhook cuando paymentStatus === 'approved')
  if (status === 'cancelled' && order.paymentStatus === 'approved') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    }
  }

  sendSuccess(res, { order });
});

/**
 * GET /api/orders/stats (admin)
 * Estadísticas del dashboard.
 */
const getOrderStats = catchAsync(async (req, res, next) => {
  const [totalOrders, totalRevenue, pendingOrders, workshopOrders, shippingOrders, pickupOrders, recentOrders] = await Promise.all([
    Order.countDocuments({ tenantId: req.tenantId }),
    Order.aggregate([
      { $match: { tenantId: req.tenantId, paymentStatus: 'approved' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.countDocuments({ tenantId: req.tenantId, status: 'pending' }),
    Order.countDocuments({ tenantId: req.tenantId, deliveryType: 'workshop' }),
    Order.countDocuments({ tenantId: req.tenantId, deliveryType: 'shipping', status: { $nin: ['delivered', 'cancelled'] } }),
    Order.countDocuments({ tenantId: req.tenantId, deliveryType: 'pickup', status: { $nin: ['delivered', 'cancelled'] } }),
    Order.find({ tenantId: req.tenantId })
      .sort('-createdAt')
      .limit(5)
      .populate('userId', 'name email'),
  ]);

  sendSuccess(res, {
    totalOrders,
    totalRevenue: totalRevenue[0]?.total || 0,
    pendingOrders,
    workshopOrders,
    shippingOrders,
    pickupOrders,
    recentOrders,
  });
});

module.exports = { createOrder, getOrders, getOrder, updateOrderStatus, getOrderStats };
