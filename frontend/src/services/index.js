import api from './api';

export const orderService = {
  create: async ({ items, shipping, notes, deliveryType, workshopAppointment }) => {
    const { data } = await api.post('/orders', {
      items,
      shipping,
      notes,
      deliveryType,
      workshopAppointment,
    });
    return data;
  },

  getAll: async (params = {}) => {
    const { data } = await api.get('/orders', { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  },

  updateStatus: async (id, status) => {
    const { data } = await api.patch(`/orders/${id}/status`, { status });
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/orders/stats');
    return data;
  },
};

export const paymentService = {
  createPreference: async (orderId) => {
    const { data } = await api.post('/payments/create-preference', { orderId });
    return data;
  },

  getByOrder: async (orderId) => {
    const { data } = await api.get(`/payments/order/${orderId}`);
    return data;
  },
};

export const tenantService = {
  getMe: async () => {
    const { data } = await api.get('/tenants/me');
    return data;
  },

  update: async (updates) => {
    const { data } = await api.put('/tenants/me', updates);
    return data;
  },

  uploadLogo: async (formData) => {
    const { data } = await api.post('/tenants/me/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getPublic: async (slug) => {
    const { data } = await api.get(`/tenants/public/${slug}`);
    return data;
  },
};

export const subscriptionService = {
  getPlans: async () => {
    const { data } = await api.get('/subscriptions/plans');
    return data;
  },

  getMine: async () => {
    const { data } = await api.get('/subscriptions/me');
    return data;
  },

  upgrade: async (plan) => {
    const { data } = await api.post('/subscriptions/upgrade', { plan });
    return data;
  },
};

export const taskService = {
  getAll: async () => {
    const { data } = await api.get('/tasks');
    return data;
  },
  create: async (taskData) => {
    const { data } = await api.post('/tasks', taskData);
    return data;
  },
  update: async (id, taskData) => {
    const { data } = await api.patch(`/tasks/${id}`, taskData);
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/tasks/${id}`);
    return data;
  },
  getHistory: async (plate) => {
    const { data } = await api.get(`/tasks/history/${plate}`);
    return data;
  },
};
