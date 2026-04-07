import api from './api';

export const authService = {
  /**
   * Registro: crea tenant + usuario admin en un solo paso.
   */
  register: async ({ name, email, password, storeName }) => {
    const { data } = await api.post('/auth/register', { name, email, password, storeName });
    return data;
  },

  /**
   * Login dentro de un tenant específico.
   */
  login: async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  /**
   * Obtener perfil del usuario autenticado.
   */
  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  /**
   * Cambiar contraseña.
   */
  updatePassword: async ({ currentPassword, newPassword }) => {
    const { data } = await api.patch('/auth/update-password', { currentPassword, newPassword });
    return data;
  },
};
