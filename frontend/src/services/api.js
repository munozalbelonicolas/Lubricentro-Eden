import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const TENANT_ID = import.meta.env.VITE_TENANT_ID || '';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: inyectar token y tenantId ──
api.interceptors.request.use(
  (config) => {
    // Token JWT
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // TenantId (del storage o variable de entorno)
    const tenantId = localStorage.getItem('tenantId') || TENANT_ID;
    if (tenantId) config.headers['X-Tenant-ID'] = tenantId;

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: manejo global de errores ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Error de red';
    const status  = error.response?.status;

    // Sesión expirada: limpiar y redirigir
    if (status === 401) {
      const isAuthRoute = ['/auth/login', '/auth/register'].some((r) =>
        error.config?.url?.includes(r)
      );
      
      const currentPath = window.location.pathname;
      const isAlreadyOnAuthPage = currentPath === '/login' || currentPath === '/register';

      if (!isAuthRoute && !isAlreadyOnAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject({ message, status, data: error.response?.data });
  }
);

export default api;
