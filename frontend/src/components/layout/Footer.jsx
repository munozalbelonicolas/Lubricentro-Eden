import { Link } from 'react-router-dom';
import { useTenant } from '../../hooks/useTenant';
import { FiInstagram, FiFacebook, FiPhone, FiMapPin, FiMail } from 'react-icons/fi';
import { getImageUrl } from '../../utils/formatters';
import styles from './Footer.module.css';

export default function Footer() {
  const { tenant } = useTenant();
  const cfg = tenant?.config || {};
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        {/* Marca */}
        <div className={styles.brand}>
          <div className={styles.footerLogo}>
            <img src={tenant?.config?.logo ? getImageUrl(tenant.config.logo) : '/logos/Logo-Eden.png'} alt={tenant?.name} style={{ height: '40px', marginBottom: '1rem' }} />
          </div>
          <p className={styles.brandName}>{tenant?.name || 'Lubricentro Eden'}</p>
          <p className={styles.brandDesc}>
            {cfg.description || 'Tu lubricentro de confianza. Aceites, filtros y repuestos automotor de primera calidad.'}
          </p>
          <div className={styles.social}>
            {cfg.socialLinks?.facebook && (
              <a href={cfg.socialLinks.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                <FiFacebook size={18} />
              </a>
            )}
          </div>
        </div>

        {/* Navegación */}
        <div className={styles.col}>
          <p className={styles.colTitle}>Tienda</p>
          <Link to="/">Inicio</Link>
          <Link to="/store">Catálogo</Link>
          <Link to="/store?category=aceite">Aceites</Link>
          <Link to="/store?category=filtro">Filtros</Link>
          <Link to="/store?category=aditivo">Aditivos</Link>
        </div>

        {/* Cuenta */}
        <div className={styles.col}>
          <p className={styles.colTitle}>Mi Cuenta</p>
          <Link to="/orders">Mis Pedidos</Link>
          <Link to="/login">Ingresar</Link>
          <Link to="/register">Registrarse</Link>
        </div>

        {/* Contacto */}
        <div className={styles.col}>
          <p className={styles.colTitle}>Contacto</p>
          {cfg.address && (
            <span className={styles.contactItem}><FiMapPin size={14} />{cfg.address}</span>
          )}
          {cfg.phone && (
            <a
              href={`https://wa.me/${cfg.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className={styles.contactItem}
            >
              <FiPhone size={14} />{cfg.phone}
            </a>
          )}
          {cfg.email && (
            <a href={`mailto:${cfg.email}`} className={styles.contactItem}><FiMail size={14} />{cfg.email}</a>
          )}
          {(cfg.socialLinks?.instagram || (!tenant && 'https://www.instagram.com/lubricentroeden/')) && (
            <a href={cfg.socialLinks?.instagram || 'https://www.instagram.com/lubricentroeden/'} target="_blank" rel="noreferrer" className={styles.contactItem}>
              <FiInstagram size={14} /> @lubricentroeden
            </a>
          )}
          {cfg.businessHours && (
            <span className={styles.contactItem} style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-3)' }}>
              {cfg.businessHours}
            </span>
          )}
        </div>
      </div>

      <div className={styles.bottom}>
        <div className="container">
          <p>© {year} {tenant?.name || 'Lubricentro Eden'} — Powered by NILO-TECH, Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
