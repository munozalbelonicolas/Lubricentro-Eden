import { createContext, useState, useEffect } from 'react';
import { tenantService } from '../services/index';

export const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const [tenant, setTenant]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tenantId = localStorage.getItem('tenantId') || import.meta.env.VITE_TENANT_ID;
    if (!tenantId) { setLoading(false); return; }

    const applyConfig = (tenantData) => {
      if (!tenantData?.config) return;
      const root = document.documentElement;
      const primary = (tenantData.config.primaryColor === '#FF6B00' || !tenantData.config.primaryColor) 
        ? '#CB1A20' 
        : tenantData.config.primaryColor;
      root.style.setProperty('--color-primary', primary);
      if (tenantData.config.secondaryColor) {
        root.style.setProperty('--color-secondary', tenantData.config.secondaryColor);
        // También podemos usar el secundario para reemplazar algunos grises/negros si queremos
      }
    };

    // Intentar cargar info del tenant
    tenantService.getMe()
      .then((data) => {
        setTenant(data.data.tenant);
        applyConfig(data.data.tenant);
      })
      .catch(() => {
        // Fallback pidiendo la data pública usando el ID de .env
        if (import.meta.env.VITE_TENANT_ID) {
          tenantService.getPublic(import.meta.env.VITE_TENANT_ID)
            .then((data) => {
              setTenant(data.data.tenant);
              applyConfig(data.data.tenant);
            }).catch(() => setTenant(null));
        } else {
          setTenant(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const refreshTenant = async () => {
    try {
      const data = await tenantService.getMe();
      setTenant(data.data.tenant);
      
      const root = document.documentElement;
      const primary = (data.data.tenant?.config?.primaryColor === '#FF6B00' || !data.data.tenant?.config?.primaryColor) 
        ? '#CB1A20' 
        : data.data.tenant.config.primaryColor;
      root.style.setProperty('--color-primary', primary);
    } catch { /* ignorar */ }
  };

  return (
    <TenantContext.Provider value={{ tenant, loading, setTenant, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
}
