import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productService } from '../services/product.service';
import { useTenant } from '../hooks/useTenant';
import ProductCard from '../components/products/ProductCard';
import ProductFilters from '../components/products/ProductFilters';
import SEOHead from '../components/seo/SEOHead';
import { FiChevronLeft, FiChevronRight, FiGrid, FiList } from 'react-icons/fi';
import { categoryLabel } from '../utils/formatters';
import styles from './StorePage.module.css';

const ITEMS_PER_PAGE = 20;

export default function StorePage() {
  const { tenant }        = useTenant();
  const [params]          = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [brands, setBrands]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [view, setView]         = useState('grid');

  // Leer todos los filtros de los search params
  const currentPage = parseInt(params.get('page') || '1', 10);
  const filters = {
    search:    params.get('search') || undefined,
    category:  params.get('category') || undefined,
    brand:     params.get('brand') || undefined,
    viscosity: params.get('viscosity') || undefined,
    minPrice:  params.get('minPrice') || undefined,
    maxPrice:  params.get('maxPrice') || undefined,
    page:      currentPage,
    limit:     ITEMS_PER_PAGE,
  };

  useEffect(() => {
    setLoading(true);
    productService.getAll(filters)
      .then((data) => {
        setProducts(data.data.products);
        setPagination(data.pagination || { total: 0, pages: 1, page: 1 });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  useEffect(() => {
    productService.getBrands()
      .then((data) => setBrands(data.data.brands || []))
      .catch(console.error);
  }, []);

  const activeCategory = params.get('category');
  const pageTitle = activeCategory
    ? `${categoryLabel[activeCategory] || ''} — Catálogo`
    : 'Catálogo Completo';

  const seoDescription = activeCategory
    ? `Comprá ${(categoryLabel[activeCategory] || activeCategory).toLowerCase()} automotor online en Lubricentro Eden. Las mejores marcas al mejor precio con envío a todo el país.`
    : 'Explorá nuestro catálogo completo de aceites, filtros, aditivos y repuestos automotor. Las mejores marcas al mejor precio.';

  return (
    <div className="page">
      <SEOHead
        title={pageTitle}
        description={seoDescription}
        canonical="/store"
      />
      <div className="container">
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className="section-title">{pageTitle}</h1>
            {!loading && (
              <p className={styles.resultCount}>
                {pagination.total} {pagination.total === 1 ? 'producto' : 'productos'}
              </p>
            )}
          </div>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${view === 'grid' ? styles.viewActive : ''}`}
              onClick={() => setView('grid')}
              aria-label="Vista grilla"
            >
              <FiGrid size={18} />
            </button>
            <button
              className={`${styles.viewBtn} ${view === 'list' ? styles.viewActive : ''}`}
              onClick={() => setView('list')}
              aria-label="Vista lista"
            >
              <FiList size={18} />
            </button>
          </div>
        </div>

        <div className={styles.layout}>
          {/* Sidebar filtros */}
          <ProductFilters brands={brands} />

          {/* Productos */}
          <section className={styles.content}>
            {/* Mobile filter button viene del componente */}

            {loading ? (
              <div className={styles.loadingGrid}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={styles.skeleton} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyIcon}>🔍</p>
                <h3>No encontramos productos</h3>
                <p>Intenta con otros filtros o términos de búsqueda.</p>
                <Link to="/store" className="btn btn-outline" style={{ marginTop: '1rem' }}>
                  Ver todos los productos
                </Link>
              </div>
            ) : (
              <>
                <div className={view === 'grid' ? 'products-grid' : styles.listGrid}>
                  {products.map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>

                {/* Paginación */}
                {pagination.pages > 1 && (
                  <div className={styles.pagination}>
                    <Link
                      to={`?${new URLSearchParams({ ...Object.fromEntries(params), page: currentPage - 1 })}`}
                      className={`btn btn-ghost btn-sm ${currentPage <= 1 ? styles.disabled : ''}`}
                      aria-disabled={currentPage <= 1}
                    >
                      <FiChevronLeft size={16} /> Anterior
                    </Link>
                    <span className={styles.pageInfo}>
                      Página {currentPage} de {pagination.pages}
                    </span>
                    <Link
                      to={`?${new URLSearchParams({ ...Object.fromEntries(params), page: currentPage + 1 })}`}
                      className={`btn btn-ghost btn-sm ${currentPage >= pagination.pages ? styles.disabled : ''}`}
                      aria-disabled={currentPage >= pagination.pages}
                    >
                      Siguiente <FiChevronRight size={16} />
                    </Link>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
