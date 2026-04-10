import api from './api';

export const userService = {
  /**
   * Listar todos los usuarios del tenant
   */
  getUsers: async () => {
    const { data } = await api.get('/users');
    return data;
  },

  /**
   * Crear usuario (Admin)
   */
  createUser: async (userData) => {
    const { data } = await api.post('/users', userData);
    return data;
  },

  /**
   * Actualizar usuario (Admin)
   */
  updateUser: async (userId, userData) => {
    const { data } = await api.patch(`/users/${userId}`, userData);
    return data;
  },

  /**
   * Alternar estado (Bloquear/Desbloquear)
   */
  toggleStatus: async (userId) => {
    const { data } = await api.patch(`/users/${userId}/toggle-status`);
    return data;
  },

  /**
   * Resetear contraseña
   */
  updatePassword: async (userId, newPassword) => {
    const { data } = await api.patch(`/users/${userId}/password`, { newPassword });
    return data;
  },

  /**
   * Borrar definitivamente
   */
  deleteUser: async (userId) => {
    const { data } = await api.delete(`/users/${userId}`);
    return data;
  },

  /**
   * Obtener historial de órdenes de un usuario
   */
  getUserOrders: async (userId) => {
    const { data } = await api.get(`/users/${userId}/orders`);
    return data;
  },
};
