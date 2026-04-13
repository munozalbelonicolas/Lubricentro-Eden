'use strict';

const { Preference, Payment: MPPayment } = require('mercadopago');
const mpClient = require('../config/mercadopago');
const Order   = require('../models/Order.model');
const Payment = require('../models/Payment.model');
const Product = require('../models/Product.model');
const StockService = require('../services/stockService');
const catchAsync    = require('../utils/catchAsync');
const AppError      = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');

const isDev = process.env.NODE_ENV !== 'production';

/**
 * POST /api/payments/create-preference
 * Crea preferencia de pago en Mercado Pago para una orden.
 */
const createPreference = catchAsync(async (req, res, next) => {
  const { orderId } = req.body;
  if (!orderId) return next(new AppError('orderId es obligatorio.', 400));

  const order = await Order.findOne({ _id: orderId, tenantId: req.tenantId });
  if (!order) return next(new AppError('Orden no encontrada.', 404));
  if (order.paymentStatus === 'approved') {
    return next(new AppError('Esta orden ya fue pagada.', 400));
  }

  const preference = new Preference(mpClient);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const backendUrl  = process.env.BACKEND_URL  || '';

  // unit_price DEBE ser float; quantity DEBE ser entero positivo
  const items = order.items.map((item) => ({
    id: item.productId.toString(),
    title: String(item.name).slice(0, 256),   // MP limita a 256 chars
    quantity: Math.max(1, parseInt(item.quantity, 10)),
    unit_price: parseFloat(item.price),        // ← float obligatorio
    currency_id: 'ARS',
    // picture_url solo en prod (MP no puede alcanzar localhost)
    ...(backendUrl && item.image ? { picture_url: `${backendUrl}${item.image}` } : {}),
  }));

  const preferenceData = {
    items,
    external_reference: order._id.toString(),
    back_urls: {
      success: `${frontendUrl}/orders/${order._id}?payment=success`,
      failure: `${frontendUrl}/orders/${order._id}?payment=failure`,
      pending: `${frontendUrl}/orders/${order._id}?payment=pending`,
    },
    // auto_return solo funciona con URLs públicas (no localhost)
    ...(backendUrl ? { auto_return: 'approved' } : {}),
    // notification_url solo si tenemos BACKEND_URL real (no funciona con localhost)
    ...(backendUrl ? { notification_url: `${backendUrl}/api/payments/webhook` } : {}),
    metadata: {
      tenantId: req.tenantId.toString(),
      orderId:  order._id.toString(),
    },
  };

  let response;
  try {
    response = await preference.create({ body: preferenceData });
  } catch (mpErr) {
    // Loguear el error detallado de MercadoPago para debugging
    const mpMessage = mpErr?.cause?.[0]?.description
      || mpErr?.message
      || JSON.stringify(mpErr);
    console.error('❌ MercadoPago createPreference error:', mpMessage);
    if (isDev) {
      console.error('   payload enviado:', JSON.stringify(preferenceData, null, 2));
    }
    return next(new AppError(`Error al crear preferencia de pago: ${mpMessage}`, 502));
  }

  // Crear o actualizar registro de pago
  await Payment.findOneAndUpdate(
    { orderId: order._id },
    {
      tenantId:     req.tenantId,
      orderId:      order._id,
      preferenceId: response.id,
      status:       'pending',
      amount:       order.total,
    },
    { upsert: true, new: true }
  );

  sendSuccess(res, {
    preferenceId:     response.id,
    initPoint:        response.init_point,
    sandboxInitPoint: response.sandbox_init_point,
  });
});

/**
 * POST /api/payments/webhook
 */
const webhook = catchAsync(async (req, res, next) => {
  res.status(200).json({ received: true });

  const { type, data } = req.query;
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  const notificationType = type || body?.type;
  const paymentId = data?.id || body?.data?.id;

  if (notificationType !== 'payment' || !paymentId) return;

  try {
    const mpPayment = new MPPayment(mpClient);
    const paymentData = await mpPayment.get({ id: paymentId });

    const orderId = paymentData.external_reference;
    if (!orderId) return;

    const order = await Order.findById(orderId);
    if (!order) return;

    const status = paymentData.status;
    const mpStatus = {
      approved:   'approved',
      rejected:   'rejected',
      pending:    'pending',
      in_process: 'in_process',
      cancelled:  'pending',
      refunded:   'refunded',
    }[status] || 'pending';

    const previousPaymentStatus = order.paymentStatus;

    await Payment.findOneAndUpdate(
      { orderId: order._id },
      {
        mercadoPagoPaymentId: paymentId.toString(),
        mercadoPagoData:      paymentData,
        status:               mpStatus,
        paidAt: status === 'approved' ? new Date() : undefined,
      },
      { upsert: true }
    );

    // ── Prevenir Race Conditions (Modificación Atómica) ────────
    // Intentamos actualizar la orden SOLAMENTE si el estado de pago está cambiando.
    // Esto previene que 2 webhooks concurrentes procesen la deducción de stock dos veces.
    const newStatus = (status === 'approved' && order.status === 'pending') ? 'confirmed' : order.status;
    
    // IMPORTANTE: order.paymentStatus en la BD puede ser distinto al objeto `order` si hubo race condition.
    const updatedOrder = await Order.findOneAndUpdate(
      { 
        _id: orderId,
        paymentStatus: { $ne: mpStatus } // Condición Atómica
      },
      {
        paymentStatus: mpStatus,
        status: newStatus,
      },
      { new: true }
    );

    if (!updatedOrder) {
      console.log(`⚠️ Orden ${orderId} ya estaba en estado ${mpStatus} o procesada. Webhook ignorado por concurrencia.`);
      return;
    }

    // ── Gestión de stock ──────────────────────────────────────
    if (mpStatus === 'approved') {
      await StockService.deductStock(order.tenantId, order.items);
      console.log(`✅ Stock descontado de forma segura para orden ${orderId}`);
    }

    // Restaurar stock si el pago pasa de aprobado a rechazado/reembolsado
    if (['rejected', 'refunded'].includes(mpStatus) && order.paymentStatus === 'approved') {
      await StockService.restoreStock(order.tenantId, order.items);
      console.log(`↩️  Stock restaurado para orden ${orderId} (${mpStatus})`);
    }
    // ─────────────────────────────────────────────────────────

  } catch (err) {
    console.error('❌ Error procesando webhook MP:', err.message);
  }
});

/**
 * GET /api/payments/order/:orderId
 */
const getPaymentByOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.orderId, tenantId: req.tenantId });
  if (!order) return next(new AppError('Orden no encontrada.', 404));

  if (req.user.role !== 'admin' && order.userId.toString() !== req.user._id.toString()) {
    return next(new AppError('No tienes acceso a este pago.', 403));
  }

  const payment = await Payment.findOne({ orderId: req.params.orderId });
  sendSuccess(res, { payment });
});

module.exports = { createPreference, webhook, getPaymentByOrder };
