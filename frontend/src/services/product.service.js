import api from './api';

export const productService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/products', { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },

  getBySlug: async (slug) => {
    const { data } = await api.get(`/products/slug/${slug}`);
    return data;
  },

  getBrands: async () => {
    const { data } = await api.get('/products/brands');
    return data;
  },

  create: async (formData) => {
    const { data } = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  update: async (id, formData) => {
    const { data } = await api.put(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },

  deleteImage: async (id, imageIndex) => {
    const { data } = await api.delete(`/products/${id}/images/${imageIndex}`);
    return data;
  },
};
