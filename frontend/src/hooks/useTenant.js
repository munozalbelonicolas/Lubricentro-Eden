import { useContext } from 'react';
import { TenantContext } from '../context/TenantContext';

export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant debe usarse dentro de TenantProvider');
  return ctx;
};
