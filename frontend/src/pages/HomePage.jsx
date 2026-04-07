import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productService } from '../services/product.service';
import { useTenant } from '../hooks/useTenant';
import ProductCard from '../components/products/ProductCard';
import { formatPrice, getImageUrl, categoryLabel } from '../utils/formatters';
import { FiArrowRight, FiShield, FiTruck, FiStar, FiZap } from 'react-icons/fi';
import styles from './HomePage.module.css';

const CATEGORIES = [
  { key: 'aceite',      icon: '🛢️',  label: 'Aceites',      desc: 'Sintéticos, semi y mineral' },
  { key: 'filtro',      icon: '🔩',  label: 'Filtros',      desc: 'Aceite, aire, combustible' },
  { key: 'aditivo',     icon: '⚗️',  label: 'Aditivos',     desc: 'Tratamiento y protección' },
  { key: 'lubricante',  icon: '💧',  label: 'Lubricantes',  desc: 'Grasa, spray, especiales' },
  { key: 'repuesto',    icon: '⚙️',  label: 'Repuestos',    desc: 'Piezas y componentes' },
  { key: 'herramienta', icon: '🔧',  label: 'Herramientas', desc: 'Equipamiento técnico' },
];

const FEATURES = [
  { icon: <FiShield size={24} />, title: 'Productos Originales', desc: 'Solo marcas verificadas y certificadas.' },
  { icon: <FiTruck  size={24} />, title: 'Envío Rápido',         desc: 'Despacho en 24-48hs a todo el país.' },
  { icon: <FiStar   size={24} />, title: 'Calidad Garantizada',  desc: 'Asesoramiento técnico especializado.' },
  { icon: <FiZap    size={24} />, title: 'Mejor Precio',         desc: 'Precios competitivos en todo el catálogo.' },
];

export default function HomePage() {
  const { tenant }  = useTenant();
  const [featured, setFeatured]   = useState([]);
  const [recent,   setRecent]     = useState([]);
  const [loading,  setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      productService.getAll({ featured: true, limit: 4 }),
      productService.getAll({ sort: '-createdAt', limit: 8 }),
    ])
      .then(([featData, recData]) => {
        setFeatured(featData.data.products || []);
        setRecent(recData.data.products || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const heroTitle = tenant?.name || 'Tu Lubricentro Online';
  const primaryColor = tenant?.config?.primaryColor || '#FF6B00';

  return (
    <div className={styles.home}>
      {/* ── HERO ── */}
      <section className={styles.hero} style={{ '--accent': primaryColor }}>
        <div className={styles.heroBg}>
          <div className={styles.heroGlow} />
          <div className={styles.heroGrid} />
        </div>
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroText}>
            <span className={styles.heroBadge}>🔧 Especialistas en Lubricación</span>
            <h1 className={styles.heroTitle}>
              {heroTitle}
              <span className={styles.heroAccent}> — Calidad<br />que se siente</span>
            </h1>
            <p className={styles.heroDesc}>
              {tenant?.config?.description ||
                'Aceites, filtros, aditivos y repuestos automotor de las mejores marcas. Encontrá todo lo que necesitás para mantener tu vehículo en óptimas condiciones.'}
            </p>
            <div className={styles.heroCtas}>
              <Link to="/store" className="btn btn-primary btn-lg">
                Ver Catálogo <FiArrowRight size={18} />
              </Link>
              <Link to="/store?category=aceite" className="btn btn-outline btn-lg">
                🛢️ Aceites
              </Link>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroCard}>
              <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/aceite-premium.jpg`} alt="Aceites Premium Sintéticos" className={styles.heroCardImg} />
              <div className={styles.heroCardInner}>
                <p className={styles.heroCardTitle}>Aceites Premium</p>
                <p className={styles.heroCardSub}>Sintéticos y semi-sintéticos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORÍAS ── */}
      <section className={styles.section}>
        <div className="container">
          <h2 className={`section-title ${styles.centered}`}>Nuestras Categorías</h2>
          <p className={styles.sectionSub}>Todo lo que necesitás para tu vehículo, en un solo lugar.</p>
          <div className={styles.categoryGrid}>
            {CATEGORIES.map(({ key, icon, label, desc }) => (
              <Link key={key} to={`/store?category=${key}`} className={styles.categoryCard}>
                <span className={styles.categoryIcon}>{icon}</span>
                <p className={styles.categoryName}>{label}</p>
                <p className={styles.categoryDesc}>{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── DESTACADOS ── */}
      {(loading || featured.length > 0) && (
        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <div>
                <h2 className="section-title">Productos Destacados</h2>
                <p className={styles.sectionSub}>Seleccionados por nuestros expertos.</p>
              </div>
              <Link to="/store?featured=true" className="btn btn-outline btn-sm">
                Ver todos <FiArrowRight size={14} />
              </Link>
            </div>
            {loading ? (
              <div className="products-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={styles.skeletonCard} />
                ))}
              </div>
            ) : (
              <div className="products-grid">
                {featured.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── RECIENTES ── */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <h2 className="section-title">Novedades</h2>
              <p className={styles.sectionSub}>Los últimos productos incorporados.</p>
            </div>
            <Link to="/store" className="btn btn-outline btn-sm">
              Ver catálogo <FiArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="products-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard} />
              ))}
            </div>
          ) : recent.length > 0 ? (
            <div className="products-grid">
              {recent.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-3)' }}>
              <p style={{ fontSize: '2rem' }}>🏪</p>
              <p>Próximamente nuevos productos.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={styles.featuresSection}>
        <div className="container">
          <div className={styles.featuresGrid}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className={styles.featureCard}>
                <div className={styles.featureIcon}>{icon}</div>
                <div>
                  <p className={styles.featureTitle}>{title}</p>
                  <p className={styles.featureDesc}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
