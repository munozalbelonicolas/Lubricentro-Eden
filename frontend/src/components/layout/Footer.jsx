import { Link } from 'react-router-dom';
import { useTenant } from '../../hooks/useTenant';
import { FiInstagram, FiFacebook, FiPhone, FiMapPin, FiMail } from 'react-icons/fi';
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
          <p className={styles.brandName}>🔧 {tenant?.name || 'Lubricentro Eden'}</p>
          <p className={styles.brandDesc}>
            {cfg.description || 'Tu lubricentro de confianza. Aceites, filtros y repuestos automotor de primera calidad.'}
          </p>
          <div className={styles.social}>
            {cfg.socialLinks?.instagram && (
              <a href={cfg.socialLinks.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                <FiInstagram size={18} />
              </a>
            )}
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
            <a href={`tel:${cfg.phone}`} className={styles.contactItem}><FiPhone size={14} />{cfg.phone}</a>
          )}
          {cfg.email && (
            <a href={`mailto:${cfg.email}`} className={styles.contactItem}><FiMail size={14} />{cfg.email}</a>
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
          <p>© {year} {tenant?.name || 'Lubricentro Eden'} — Todos los derechos reservados.</p>
          <p>Powered by <span className={styles.powered}>Lubricentro Eden SaaS</span></p>
        </div>
      </div>
    </footer>
  );
}
