import { createContext, useState, useEffect } from 'react';
import { tenantService } from '../services/index';
import { getImageUrl } from '../utils/formatters';

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
      const { config, name } = tenantData;

      // 🎨 Colores
      const primary = (config.primaryColor === '#FF6B00' || !config.primaryColor) 
        ? '#CB1A20' 
        : config.primaryColor;
      
      root.style.setProperty('--color-primary', primary);
      if (config.secondaryColor) {
        root.style.setProperty('--color-secondary', config.secondaryColor);
      }

      // 🖼️ Logo y Favicon Dinámico
      try {
        const faviconLink = document.getElementById('favicon');
        if (faviconLink) {
          const newFavicon = config.logo ? getImageUrl(config.logo) : '/favicon.png';
          // Solo actualizar si el href es diferente para evitar parpadeo innecesario
          if (faviconLink.getAttribute('href') !== newFavicon) {
            faviconLink.href = newFavicon;
          }
        }
      } catch (err) {
        console.error('Error updating favicon:', err);
      }

      // 🏷️ Título del documento
      if (name) {
        document.title = `${name} — Lubricentro Pro`;
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
      const updatedTenant = data.data.tenant;
      setTenant(updatedTenant);
      
      // Re-aplicar configuración
      const root = document.documentElement;
      const config = updatedTenant.config || {};
      
      const primary = (config.primaryColor === '#FF6B00' || !config.primaryColor) 
        ? '#CB1A20' 
        : config.primaryColor;
      
      root.style.setProperty('--color-primary', primary);

      try {
        const faviconLink = document.getElementById('favicon');
        if (faviconLink) {
          const newFavicon = config.logo ? getImageUrl(config.logo) : '/favicon.png';
          if (faviconLink.getAttribute('href') !== newFavicon) {
            faviconLink.href = newFavicon;
          }
        }
      } catch (err) {
        console.error('Error refreshing favicon:', err);
      }
    } catch { /* ignorar */ }
  };

  return (
    <TenantContext.Provider value={{ tenant, loading, setTenant, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
}
