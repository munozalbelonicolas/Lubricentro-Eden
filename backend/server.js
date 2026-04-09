'use strict';

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./src/config/db');
const errorMiddleware = require('./src/middlewares/error.middleware');
const AppError = require('./src/utils/AppError');

// Rutas
const authRoutes = require('./src/routes/auth.routes');
const tenantRoutes = require('./src/routes/tenant.routes');
const productRoutes = require('./src/routes/product.routes');
const orderRoutes = require('./src/routes/order.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const financeRoutes = require('./src/routes/finance.routes');
const subscriptionRoutes = require('./src/routes/subscription.routes');
const chatRoutes = require('./src/routes/chatRoutes');
const taskRoutes = require('./src/routes/task.routes');

const app = express();
app.set('trust proxy', 1); // Confiar en el proxy de Render para detectar HTTPS correctamente

// ──────────────────────────────────────────────
// Conexión a MongoDB
// ──────────────────────────────────────────────
connectDB();

// ──────────────────────────────────────────────
// Seguridad y middlewares globales
// ──────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Desactivar CSP temporalmente si causa problemas de "Sitio no seguro"
}));

// Configurar orígenes permitidos
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) 
  : [
      'http://localhost:5173',
      'https://lubricentro-eden.com.ar',
      'http://lubricentro-eden.com.ar',
      'https://munozalbelonicolas.github.io'
    ];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      const isDomainAllowed = allowedOrigins.some(ao => 
        origin === ao || 
        (ao.startsWith('.') && origin.endsWith(ao)) ||
        origin.includes('lubricentro-eden.com.ar')
      );

      if (isDomainAllowed || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // aumentado en dev
  message: 'Demasiadas peticiones desde esta IP, intenta en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Webhook de Mercado Pago necesita body raw
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize());
app.use(xssClean());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ──────────────────────────────────────────────
// Servir archivos estáticos (uploads)
// ──────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ──────────────────────────────────────────────
// Rutas API
// ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Ruta no encontrada
app.all('*', (req, res, next) => {
  next(new AppError(`No se encontró la ruta ${req.originalUrl}`, 404));
});

// ──────────────────────────────────────────────
// Manejador global de errores
// ──────────────────────────────────────────────
app.use(errorMiddleware);

// ──────────────────────────────────────────────
// Iniciar servidor
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT} [${process.env.NODE_ENV}]`);
});

// Manejo de rechazos no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.name, err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.name, err.message);
  process.exit(1);
});

module.exports = app;
