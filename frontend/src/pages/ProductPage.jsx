import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService } from '../services/product.service';
import { useCart } from '../hooks/useCart';
import { formatPrice, getImageUrl, categoryLabel } from '../utils/formatters';
import { FiShoppingCart, FiArrowLeft, FiTag, FiPackage, FiDroplet } from 'react-icons/fi';
import styles from './ProductPage.module.css';

export default function ProductPage() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [qty, setQty]           = useState(1);
  const [mainImg, setMainImg]   = useState(0);

  useEffect(() => {
    productService.getBySlug(slug)
      .then((data) => setProduct(data.data.product))
      .catch(() => navigate('/store'))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  if (!product) return null;

  const isOutOfStock = product.stock === 0;
  const images = product.images?.length > 0 ? product.images : [null];

  const handleAdd = () => {
    addItem(product, qty);
  };

  return (
    <div className="page">
      <div className="container">
        <Link to="/store" className={styles.backLink}>
          <FiArrowLeft size={16} /> Volver al catálogo
        </Link>

        <div className={styles.layout}>
          {/* Galería */}
          <div className={styles.gallery}>
            <div className={styles.mainImg}>
              {images[mainImg] ? (
                <img src={getImageUrl(images[mainImg])} alt={product.name} />
              ) : (
                <div className={styles.imgPlaceholder}><span>🔧</span></div>
              )}
              {product.featured && <span className={`badge badge-primary ${styles.featBadge}`}>Destacado</span>}
              {isOutOfStock && <span className={`badge badge-error ${styles.featBadge}`} style={{ top: '3rem' }}>Sin stock</span>}
            </div>
            {images.length > 1 && (
              <div className={styles.thumbs}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`${styles.thumb} ${i === mainImg ? styles.thumbActive : ''}`}
                    onClick={() => setMainImg(i)}
                  >
                    {img ? (
                      <img src={getImageUrl(img)} alt={`${product.name} ${i + 1}`} />
                    ) : (
                      <span>🔧</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className={styles.info}>
            {/* Meta */}
            <div className={styles.meta}>
              <span className={`badge badge-primary`}>
                <FiTag size={11} /> {categoryLabel[product.category] || product.category}
              </span>
              {product.brand && <span className={styles.brand}>{product.brand}</span>}
            </div>

            <h1 className={styles.name}>{product.name}</h1>

            {/* Especificaciones técnicas */}
            <div className={styles.specs}>
              {product.viscosity && (
                <div className={styles.specItem}>
                  <FiDroplet size={14} />
                  <span className={styles.specLabel}>Viscosidad:</span>
                  <span className={styles.specVal}>{product.viscosity}</span>
                </div>
              )}
              {product.capacity && (
                <div className={styles.specItem}>
                  <FiPackage size={14} />
                  <span className={styles.specLabel}>Capacidad:</span>
                  <span className={styles.specVal}>{product.capacity}</span>
                </div>
              )}
              {product.vehicleCompatibility?.length > 0 && (
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Compatibilidad:</span>
                  <div className={styles.compatList}>
                    {product.vehicleCompatibility.map((v) => (
                      <span key={v} className={styles.compatTag}>{v}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Descripción */}
            {product.description && (
              <div className={styles.description}>
                <p className={styles.descTitle}>Descripción</p>
                <p>{product.description}</p>
              </div>
            )}

            <div className={styles.divider} />

            {/* Precio */}
            <div className={styles.priceRow}>
              <p className={styles.price}>{formatPrice(product.price)}</p>
              {product.stock > 0 && product.stock <= 5 && (
                <span className="badge badge-warning">⚠️ Últimas {product.stock} unidades</span>
              )}
            </div>

            {/* Cantidad + Agregar */}
            {!isOutOfStock && (
              <div className={styles.buyRow}>
                <div className={styles.qtyControl}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                  >−</button>
                  <span className={styles.qtyValue}>{qty}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    disabled={qty >= product.stock}
                  >+</button>
                </div>
                <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleAdd}>
                  <FiShoppingCart size={18} /> Agregar al carrito
                </button>
              </div>
            )}

            {isOutOfStock && (
              <div className={styles.outOfStock}>
                <p>😔 Este producto está temporalmente sin stock.</p>
              </div>
            )}

            {/* SKU */}
            {product.sku && (
              <p className={styles.sku}>SKU: {product.sku}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
