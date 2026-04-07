import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { formatPrice, getImageUrl, categoryLabel } from '../../utils/formatters';
import { FiShoppingCart, FiEye, FiTag } from 'react-icons/fi';
import styles from './ProductCard.module.css';

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  const img = product.images?.[0];
  const isOutOfStock = product.stock === 0;

  return (
    <article className={styles.card}>
      {/* Imagen */}
      <Link to={`/products/${product._id}`} className={styles.imgWrapper}>
        {img ? (
          <img
            src={getImageUrl(img)}
            alt={product.name}
            className={styles.img}
            loading="lazy"
          />
        ) : (
          <div className={styles.imgPlaceholder}>
            <span>🔧</span>
          </div>
        )}

        {/* Badges */}
        <div className={styles.badges}>
          {product.featured && <span className={`badge badge-primary ${styles.badge}`}>Destacado</span>}
          {isOutOfStock && <span className={`badge badge-error ${styles.badge}`}>Sin stock</span>}
        </div>

        {/* Overlay */}
        <div className={styles.overlay}>
          <span className={styles.viewBtn}><FiEye size={16} /> Ver detalle</span>
        </div>
      </Link>

      {/* Info */}
      <div className={styles.body}>
        {/* Categoría + Marca */}
        <div className={styles.meta}>
          <span className={styles.category}>
            <FiTag size={11} /> {categoryLabel[product.category] || product.category}
          </span>
          {product.brand && <span className={styles.brand}>{product.brand}</span>}
        </div>

        {/* Nombre */}
        <Link to={`/products/${product._id}`} className={styles.name}>
          {product.name}
        </Link>

        {/* Viscosidad */}
        {product.viscosity && (
          <p className={styles.viscosity}>{product.viscosity}</p>
        )}

        {/* Precio + Carrito */}
        <div className={styles.footer}>
          <p className={styles.price}>{formatPrice(product.price)}</p>
          <button
            className={`btn btn-primary btn-sm ${styles.addBtn}`}
            onClick={() => addItem(product)}
            disabled={isOutOfStock}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <FiShoppingCart size={15} />
          </button>
        </div>

        {/* Stock */}
        {product.stock > 0 && product.stock <= 5 && (
          <p className={styles.lowStock}>⚠️ Quedan solo {product.stock} unidades</p>
        )}
      </div>
    </article>
  );
}
