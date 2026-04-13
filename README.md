# 🔧 Lubricentro Eden — Plataforma E-Commerce y Gestión de Taller

> **Sistema integral para lubricentros.** Plataforma de e-comerce con integración de pagos y panel de gestión de taller (CRM) para servicios automotores.

## ✨ Características Principales

- **Gestión Single-Tenant** — Diseñado para el funcionamiento exclusivo de Lubricentro Edén.
- **Autenticación JWT** — Registro e inicio de sesión seguro con roles (Admin, Vendedor, Cliente).
- **Catálogo de Productos** — Gestión de aceites, filtros y repuestos con filtros avanzados por viscosidad y marca.
- **Órdenes y Pagos** — Integración completa con Mercado Pago (Checkouts y Webhooks).
- **Agenda de Taller** — CRM para turnos, historial clínico de vehículos y reportes técnicos automáticos.
- **Chatbot Asistente (Groq AI)** — Asistencia inteligente para recomendaciones de aceite y agendamiento de turnos.
- **Diseño Automotriz Premium** — Interfaz moderna en negro carbón con acentos naranja industrial.

## 🗂 Estructura del Proyecto

```
Lubricentro-Eden/
├── backend/               # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── config/        # Base de datos y integraciones (MP, Groq)
│   │   ├── controllers/   # Lógica de negocio (Auth, Productos, Tareas, etc.)
│   │   ├── middlewares/   # Seguridad y validación (Auth, Error)
│   │   ├── models/        # Esquemas de Mongoose (User, Product, Task, Order, etc.)
│   │   ├── routes/        # Definición de Endpoints
│   │   └── utils/         # Helpers y manejo de errores
│   ├── server.js          # Punto de entrada del servidor
│   └── .env.example
└── frontend/              # React + Vite
    ├── src/
    │   ├── components/    # Componentes reutilizables (Chat, UI, Products)
    │   ├── pages/         # Vistas principales y Dashboard Admin
    │   ├── services/      # Cliente API para comunicación con backend
    │   └── utils/         # Formateadores y utilidades
    └── .env.example
```

## 🚀 Instalación y Desarrollo

### 1. Clonar el repositorio
```bash
git clone https://github.com/munozalbelonicolas/Lubricentro-Eden.git
cd Lubricentro-Eden
```

### 2. Backend (Servidor)
```bash
cd backend
npm install
cp .env.example .env
# Configurar MONGODB_URI, JWT_SECRET y MP_ACCESS_TOKEN
npm run dev
```

### 3. Frontend (Cliente)
```bash
cd frontend
npm install
cp .env.example .env
# Configurar VITE_API_URL=http://localhost:5000/api
npm run dev
```

## ⚙️ Configuración (Variables de Entorno)

### Backend (`.env`)
- `MONGODB_URI`: Conexión a Base de datos.
- `JWT_SECRET`: Llave de encriptación para sesiones.
- `MP_ACCESS_TOKEN`: Token de Mercado Pago.
- `GROQ_API_KEY`: API Key para el asistente de IA.
- `FRONTEND_URL`: URL base para CORS.

### Frontend (`.env`)
- `VITE_API_URL`: URL del servidor backend.

## 💳 Mercado Pago e Integraciones

1. **Checkout**: El sistema genera preferencias de pago únicas por cada orden de compra.
2. **Webhooks**: El servidor escucha notificaciones de cambio de estado para actualizar órdenes automáticamente y gestionar el stock.
3. **Groq AI**: Utilizado por el Asistente chatbot para identificar vehículos y recomendar el aceite adecuado según especificaciones de fábrica.

## 🏗 Arquitectura Single-Tenant

A diferencia de versiones SaaS previas, el sistema está optimizado para un único dueño de comercio:
- **Aislamiento**: Se mantiene la estructura de `tenantId` en la DB por compatibilidad y escalabilidad, pero se opera bajo una única configuración global.
- **Acceso**: El registro de administradores está restringido para prevenir acceso no autorizado al panel de control.

## 🔐 Seguridad Implementada

- **Cifrado**: Contraseñas con `bcrypt` y tokens `JWT`.
- **Sanitización**: `express-mongo-sanitize` y `xss-clean` activos.
- **Rate Limiting**: Protección contra ataques de fuerza bruta.
- **Validaciones**: Esquemas de Mongoose con validación estricta de tipos de datos.

---
Hecho con ❤️ para **Lubricentro Edén**.
