import { Link } from 'react-router-dom';
import SEOHead from '../components/seo/SEOHead';
import { FiHome, FiShoppingBag } from 'react-icons/fi';

export default function NotFoundPage() {
  return (
    <>
      <SEOHead
        title="Página No Encontrada"
        description="La página que buscás no existe en Lubricentro Eden."
        noindex
      />
      <div className="page flex-center" style={{ textAlign: 'center', padding: '4rem 1rem', flexDirection: 'column', gap: '1.5rem' }}>
        <p style={{ fontSize: '5rem', lineHeight: 1, fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-primary)' }}>404</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Página no encontrada</h1>
        <p style={{ color: 'var(--color-text-3)', maxWidth: '400px' }}>
          Lo sentimos, la página que buscás no existe o fue movida.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-primary">
            <FiHome size={16} /> Volver al inicio
          </Link>
          <Link to="/store" className="btn btn-outline">
            <FiShoppingBag size={16} /> Ver catálogo
          </Link>
        </div>
      </div>
    </>
  );
}
