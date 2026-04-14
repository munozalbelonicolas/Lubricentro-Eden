import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente que fuerza el scroll a la parte superior de la página
 * cada vez que cambia la ruta (pathname). Esto mitiga el problema
 * nativo de React Router en SPAs.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Retrasar levemente para asegurar que la nueva página esté montada
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
