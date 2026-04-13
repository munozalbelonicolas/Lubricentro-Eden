import { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión de localStorage al montar
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token      = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    storeAuthData(data);
    return data;
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    const data = await authService.googleSignIn(credential);
    if (!data.unregistered) {
      storeAuthData(data);
    }
    return data;
  }, []);

  const registerWithGoogle = useCallback(async (payload) => {
    const data = await authService.googleRegister(payload);
    storeAuthData(data);
    return data;
  }, []);

  const storeAuthData = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    if (data.data.tenant) {
      localStorage.setItem('tenantId', data.data.tenant._id);
    }
    setUser(data.data.user);
  };

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    // El endpoint de registro de cliente NO devuelve token (requiere verificación email).
    // Solo guardamos si viene token (caso admin/SaaS).
    if (data.token) {
      storeAuthData(data);
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    setUser(null);
    toast.success('Sesión cerrada correctamente.');
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, registerWithGoogle, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
