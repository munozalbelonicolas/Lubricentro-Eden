# 🔧 Lubricentro Eden — SaaS Multi-Tenant E-Commerce

> **Mini Shopify especializado en lubricentros.** Un sistema SaaS multi-tenant real para gestionar tiendas de aceites, filtros y repuestos automotor.

## ✨ Features

- **Multi-tenant real** — Aislamiento por `tenantId` en todas las colecciones
- **Autenticación JWT** — Registro crea tenant + usuario automáticamente
- **CRUD de productos** — Con imágenes, viscosidad, compatibilidad de vehículo
- **Órdenes y pagos** — Integración con Mercado Pago (webhooks incluidos)
- **Sistema de suscripciones** — Plan FREE (20 productos) / PREMIUM (ilimitado)
- **Dashboard admin** — Stats, gestión de productos, órdenes y configuración
- **Diseño automotriz premium** — Negro carbón + naranja industrial

## 🗂 Estructura

```
Lubricentro-Eden/
├── backend/               # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── config/        # DB, Multer, Mercado Pago
│   │   ├── controllers/   # auth, tenant, product, order, payment, subscription
│   │   ├── middlewares/   # auth, tenant, plan, error
│   │   ├── models/        # User, Tenant, Product, Order, Payment, Subscription
│   │   ├── routes/        # Todas las rutas
│   │   └── utils/         # AppError, catchAsync, apiResponse
│   ├── uploads/           # Imágenes subidas
│   ├── server.js
│   └── .env.example
└── frontend/              # React + Vite
    ├── src/
    │   ├── components/    # layout/, products/, cart/
    │   ├── context/       # Auth, Cart, Tenant
    │   ├── hooks/         # useAuth, useCart, useTenant
    │   ├── pages/         # Home, Store, Product, Cart, Checkout, Orders + Dashboard
    │   ├── services/      # api.js + servicios por dominio
    │   └── utils/         # formatters
    └── .env.example
```

## 🚀 Instalación rápida

### 1. Clonar
```bash
git clone https://github.com/tu-usuario/lubricentro-eden.git
cd lubricentro-eden
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Completar variables en .env
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
npm run dev
```

## ⚙️ Variables de Entorno

### Backend (`.env`)
| Variable | Descripción |
|---------|-------------|
| `MONGODB_URI` | URI de conexión a MongoDB Atlas |
| `JWT_SECRET` | Secreto para firmar tokens (mín. 32 chars) |
| `JWT_EXPIRES_IN` | Expiración del token (ej: `7d`) |
| `MP_ACCESS_TOKEN` | Access Token de Mercado Pago |
| `FRONTEND_URL` | URL del frontend (para CORS y webhooks) |
| `PORT` | Puerto del servidor (default: `5000`) |

### Frontend (`.env`)
| Variable | Descripción |
|---------|-------------|
| `VITE_API_URL` | URL base del backend (`/api`) |
| `VITE_TENANT_ID` | TenantId por defecto (opcional en dev) |

## 🏗 Multi-Tenant — Cómo funciona

```
Request → Header: X-Tenant-ID: <slug o ObjectId>
         ↓
   tenantMiddleware → busca Tenant en DB → inyecta req.tenantId
         ↓
   authMiddleware → verifica JWT → verifica user.tenantId === req.tenantId
         ↓
   Controller → todas las queries filtran por { tenantId: req.tenantId }
```

## 💳 Mercado Pago

1. Crear aplicación en [developers.mercadopago.com](https://developers.mercadopago.com)
2. Copiar el **Access Token de prueba** al `.env` como `MP_ACCESS_TOKEN`
3. En producción: configurar el webhook hacia `/api/payments/webhook`
4. El flujo: frontend llama a `/api/payments/create-preference` → MP devuelve URL de pago → webhook actualiza la orden

## 📦 API — Endpoints principales

```
POST   /api/auth/register          → Crear cuenta + tenant
POST   /api/auth/login             → Login (requiere X-Tenant-ID)
GET    /api/auth/me                → Perfil

GET    /api/tenants/me             → Config del tenant (admin)
PUT    /api/tenants/me             → Actualizar config
GET    /api/tenants/public/:slug   → Info pública de tienda

GET    /api/products               → Catálogo (con filtros)
POST   /api/products               → Crear producto (admin)
PUT    /api/products/:id           → Editar
DELETE /api/products/:id           → Soft delete

POST   /api/orders                 → Crear orden
GET    /api/orders                 → Historial
PATCH  /api/orders/:id/status      → Actualizar estado (admin)
GET    /api/orders/stats           → Stats del dashboard

POST   /api/payments/create-preference → Crear preferencia MP
POST   /api/payments/webhook           → Webhook MP

GET    /api/subscriptions/plans    → Planes disponibles
GET    /api/subscriptions/me       → Mi suscripción
POST   /api/subscriptions/upgrade  → Cambiar plan
```

## 🌐 Deploy

### Backend → Render
1. Crear **Web Service** en [render.com](https://render.com)
2. Build command: `npm install`
3. Start command: `node server.js`
4. Agregar todas las variables de entorno

### Frontend → Vercel
1. Conectar repositorio en [vercel.com](https://vercel.com)
2. Framework preset: **Vite**
3. Agregar `VITE_API_URL` apuntando al backend en Render

## 🔐 Seguridad

- Contraseñas hasheadas con `bcrypt` (saltrounds: 12)
- JWT firmado con secreto seguro
- Rate limiting: 200 req / 15 min
- Helmet para headers HTTP seguros
- `express-mongo-sanitize` → previene NoSQL injection
- `xss-clean` → sanitiza inputs
- CORS configurado para dominio específico
- Variables sensibles nunca expuestas al frontend

## 📈 Escalabilidad futura

- [ ] Migrar uploads a **S3 / Cloudinary**
- [ ] Agregar **Redis** para caché de productos
- [ ] Detección de tenant por **subdominio**
- [ ] Integrar pago de suscripción con MP Subscriptions
- [ ] Separar en microservicios (productos, pagos, notificaciones)

---

Hecho con ❤️ usando Node.js, React, MongoDB y Mercado Pago.
