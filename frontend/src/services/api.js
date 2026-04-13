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

// ── Response interceptor: manejo global de errores y refresh token ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Si es 401 y no es una re-petición de refresh, intentamos refrescar
    if (status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      const isAuthRoute = ['/auth/login', '/auth/register', '/auth/refresh'].some((r) =>
        originalRequest.url?.includes(r)
      );

      if (refreshToken && !isAuthRoute) {
        originalRequest._retry = true;
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const newToken = data.token;
          
          localStorage.setItem('token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          return api(originalRequest);
        } catch (refreshError) {
          // Si falla el refresh, limpiamos sesión y redirigimos
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    const message = error.response?.data?.message || error.message || 'Error de red';
    return Promise.reject({ message, status, data: error.response?.data });
  }
);

export default api;
