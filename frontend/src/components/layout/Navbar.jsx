import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useTenant } from '../../hooks/useTenant';
import { getImageUrl } from '../../utils/formatters';
import {
  FiShoppingCart, FiMenu, FiX, FiUser, FiLogOut,
  FiSettings, FiPackage, FiGrid, FiChevronDown,
} from 'react-icons/fi';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems }   = useCart();
  const { tenant }       = useTenant();
  const navigate         = useNavigate();

  const [menuOpen,    setMenuOpen]    = useState(false);
  const [userOpen,    setUserOpen]    = useState(false);
  const [scrolled,    setScrolled]    = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cerrar dropdowns al hacer click afuera
  useEffect(() => {
    const handler = () => { setUserOpen(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const navLinks = [
    { to: '/',       label: 'Inicio' },
    { to: '/store',  label: 'Catálogo' },
  ];

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <img 
            src={tenant?.config?.logo ? getImageUrl(tenant.config.logo) : '/logos/Logo-Eden.png'} 
            alt={tenant?.name || 'Lubricentro Eden'} 
            className={styles.logoImg} 
          />
        </Link>

        {/* Nav links — desktop */}
        <nav className={styles.nav}>
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
              end={to === '/'}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Acciones */}
        <div className={styles.actions}>
          {/* Carrito */}
          <Link to="/cart" className={styles.cartBtn} aria-label="Carrito">
            <FiShoppingCart size={20} />
            {totalItems > 0 && (
              <span className={styles.cartBadge}>{totalItems > 99 ? '99+' : totalItems}</span>
            )}
          </Link>

          {/* Usuario */}
          {user ? (
            <div
              className={styles.userMenu}
              onClick={(e) => { e.stopPropagation(); setUserOpen((o) => !o); }}
            >
              <button className={styles.userBtn} aria-label="Menú de usuario">
                <div className={styles.userAvatar}>
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className={styles.userName}>{user.name?.split(' ')[0]}</span>
                <FiChevronDown size={14} className={`${styles.chevron} ${userOpen ? styles.open : ''}`} />
              </button>

              {userOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <p className={styles.dropdownName}>{user.name}</p>
                    <p className={styles.dropdownEmail}>{user.email}</p>
                  </div>
                  <div className={styles.dropdownDivider} />
                  {user.role === 'admin' && (
                    <>
                      <Link to="/dashboard" className={styles.dropdownItem} onClick={() => setUserOpen(false)}>
                        <FiGrid size={15} /> Dashboard
                      </Link>
                      <Link to="/dashboard/products" className={styles.dropdownItem} onClick={() => setUserOpen(false)}>
                        <FiPackage size={15} /> Productos
                      </Link>
                      <Link to="/dashboard/config" className={styles.dropdownItem} onClick={() => setUserOpen(false)}>
                        <FiSettings size={15} /> Configuración
                      </Link>
                      <div className={styles.dropdownDivider} />
                    </>
                  )}
                  <Link to="/orders" className={styles.dropdownItem} onClick={() => setUserOpen(false)}>
                    <FiPackage size={15} /> Mis Pedidos
                  </Link>
                  <button className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={logout}>
                    <FiLogOut size={15} /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.authBtns}>
              <Link to="/login"    className="btn btn-ghost btn-sm">Ingresar</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Registrarse</Link>
            </div>
          )}

          {/* Hamburguesa mobile */}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menú"
          >
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Menú mobile */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={styles.mobileLink}
              onClick={() => setMenuOpen(false)}
              end={to === '/'}
            >
              {label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <Link to="/dashboard" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              Dashboard Admin
            </Link>
          )}
          {user ? (
            <button className={`${styles.mobileLink} ${styles.mobileLogout}`} onClick={logout}>
              Cerrar sesión
            </button>
          ) : (
            <>
              <Link to="/login"    className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Ingresar</Link>
              <Link to="/register" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Registrarse</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
