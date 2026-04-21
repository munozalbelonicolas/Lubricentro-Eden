import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { categoryLabel } from '../../utils/formatters';
import { FiSearch, FiX, FiSliders } from 'react-icons/fi';
import styles from './ProductFilters.module.css';

const CATEGORIES = Object.entries(categoryLabel);
const VISCOSITIES = ['5W30', '5W40', '10W40', '15W40', '20W50', '0W20', '0W30'];

// Separated component to avoid re-mounting on parent render
function FiltersContent({ current, set, brands, hasFilters, clearAll }) {
  return (
    <div className={styles.filters}>
      {/* Búsqueda */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Buscar</p>
        <div className={styles.searchBox}>
          <FiSearch size={15} className={styles.searchIcon} />
          <input
            type="text"
            className={`input ${styles.searchInput}`}
            placeholder="Nombre, marca..."
            value={current.search}
            onChange={(e) => set('search', e.target.value)}
          />
          {current.search && (
            <button className={styles.clearSearch} onClick={() => set('search', '')}>
              <FiX size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Categorías */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Categoría</p>
        <div className={styles.pills}>
          <button
            className={`${styles.pill} ${!current.category ? styles.pillActive : ''}`}
            onClick={() => set('category', '')}
          >
            Todas
          </button>
          {CATEGORIES.map(([key, label]) => (
            <button
              key={key}
              className={`${styles.pill} ${current.category === key ? styles.pillActive : ''}`}
              onClick={() => set('category', current.category === key ? '' : key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Marcas */}
      {brands.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Marca</p>
          <select
            className="select"
            value={current.brand}
            onChange={(e) => set('brand', e.target.value)}
          >
            <option value="">Todas las marcas</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      )}

      {/* Viscosidad */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Viscosidad</p>
        <div className={styles.pills}>
          <button
            className={`${styles.pill} ${!current.viscosity ? styles.pillActive : ''}`}
            onClick={() => set('viscosity', '')}
          >
            Todas
          </button>
          {VISCOSITIES.map((v) => (
            <button
              key={v}
              className={`${styles.pill} ${current.viscosity === v ? styles.pillActive : ''}`}
              onClick={() => set('viscosity', current.viscosity === v ? '' : v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Precio */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Precio (ARS)</p>
        <div className={styles.priceRow}>
          <input
            type="number"
            className="input"
            placeholder="Mín"
            value={current.minPrice}
            onChange={(e) => set('minPrice', e.target.value)}
            min="0"
          />
          <span className={styles.priceSep}>—</span>
          <input
            type="number"
            className="input"
            placeholder="Máx"
            value={current.maxPrice}
            onChange={(e) => set('maxPrice', e.target.value)}
            min="0"
          />
        </div>
      </div>

      {/* Limpiar */}
      {hasFilters && (
        <button className="btn btn-ghost btn-full" onClick={clearAll}>
          <FiX size={14} /> Limpiar filtros
        </button>
      )}
    </div>
  );
}

export default function ProductFilters({ brands = [], onClose }) {
  const [params, setParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const current = {
    search:   params.get('search') || '',
    category: params.get('category') || '',
    brand:    params.get('brand') || '',
    viscosity:params.get('viscosity') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
  };

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page'); // Resetear paginación
    setParams(next);
  };

  const clearAll = () => setParams({});
  const hasFilters = Object.values(current).some(Boolean);

  const filterProps = { current, set, brands, hasFilters, clearAll };

  return (
    <>
      {/* Desktop */}
      <aside className={styles.desktop}>
        <div className={styles.header}>
          <p className={styles.title}><FiSliders size={16} /> Filtros</p>
          {hasFilters && (
            <button className={styles.clearBtn} onClick={clearAll}>Limpiar</button>
          )}
        </div>
        <FiltersContent {...filterProps} />
      </aside>

      {/* Mobile toggle */}
      <div className={styles.mobileToggle}>
        <button className="btn btn-outline btn-sm" onClick={() => setMobileOpen(true)}>
          <FiSliders size={15} /> Filtros {hasFilters && <span className={styles.filterCount}>{Object.values(current).filter(Boolean).length}</span>}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)}>
          <div className={styles.mobileDrawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileHeader}>
              <p className={styles.title}><FiSliders size={16} /> Filtros</p>
              <button className={styles.closeBtn} onClick={() => setMobileOpen(false)}><FiX size={20} /></button>
            </div>
            <FiltersContent {...filterProps} />
            <button className="btn btn-primary btn-full" onClick={() => setMobileOpen(false)} style={{ marginTop: '1rem' }}>
              Ver resultados
            </button>
          </div>
        </div>
      )}
    </>
  );
}
