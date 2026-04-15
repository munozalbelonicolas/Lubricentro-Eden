import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { formatPrice, getImageUrl } from '../utils/formatters';
import SEOHead from '../components/seo/SEOHead';
import ShippingCalculator from '../components/common/ShippingCalculator';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowLeft, FiTool } from 'react-icons/fi';
import styles from './CartPage.module.css';

export default function CartPage() {
  const { items, totalPrice, totalItems, isEmpty, removeItem, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();
  const [shippingOption, setShippingOption] = useState(null); // { type, cost, days, servicio, cp }

  // Detectar si hay aceite + filtro para ofrecer turno de taller
  const canOfferWorkshop = useMemo(() => {
    const cats = items.map((i) => i.category?.toLowerCase() || '');
    return cats.some((c) => c.includes('aceite')) && cats.some((c) => c.includes('filtro'));
  }, [items]);

  if (isEmpty) {
    return (
      <div className="page">
        <SEOHead title="Carrito" noindex />
        <div className="container">
          <div className={styles.empty}>
            <FiShoppingBag size={64} className={styles.emptyIcon} />
            <h1>Tu carrito está vacío</h1>
            <p>Agregá productos desde el catálogo para comenzar.</p>
            <Link to="/store" className="btn btn-primary btn-lg" style={{ marginTop: '1.5rem' }}>
              Ir al catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <SEOHead title="Mi Carrito" noindex />
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className="section-title">Mi Carrito</h1>
            <p className={styles.itemCount}>{totalItems} {totalItems === 1 ? 'producto' : 'productos'}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={clearCart}>
            <FiTrash2 size={14} /> Vaciar carrito
          </button>
        </div>

        <div className={styles.layout}>
          {/* Items */}
          <div className={styles.items}>
            {items.map((item) => (
              <div key={item._id} className={styles.item}>
                <div className={styles.itemImg}>
                  {item.images?.[0] ? (
                    <img src={getImageUrl(item.images[0])} alt={item.name} />
                  ) : (
                    <span>🔧</span>
                  )}
                </div>
                <div className={styles.itemInfo}>
                  <Link to={`/store/${item.slug}`} className={styles.itemName}>{item.name}</Link>
                  {item.brand && <p className={styles.itemBrand}>{item.brand}</p>}
                  {item.viscosity && <p className={styles.itemViscosity}>{item.viscosity}</p>}
                </div>
                <div className={styles.itemQty}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <FiMinus size={14} />
                  </button>
                  <span className={styles.qtyVal}>{item.quantity}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                  >
                    <FiPlus size={14} />
                  </button>
                </div>
                <p className={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</p>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeItem(item._id)}
                  aria-label="Eliminar"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <p className={styles.summaryTitle}>Resumen del pedido</p>
              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>Subtotal ({totalItems} ítems)</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {shippingOption && (
                  <div className={styles.summaryRow}>
                    <span>Envío {shippingOption.type === 'pickup' ? '(Retiro en suc.)' : 'a domicilio'}</span>
                    <span className={shippingOption.cost === 0 ? styles.free : ''}>
                      {shippingOption.cost === 0 ? '¡Gratis!' : formatPrice(shippingOption.cost)}
                    </span>
                  </div>
                )}
              </div>

              {/* ── Calculador de envío Andreani ── */}
              <div className={styles.shippingCalcWrap}>
                <ShippingCalculator
                  totalPrice={totalPrice}
                  weightGrams={items.reduce((acc, i) => acc + (i.weight || 500) * i.quantity, 0) || 1000}
                  onSelectOption={(opt) => {
                    setShippingOption(opt);
                    // Persistir en sessionStorage para reutilizar en el checkout
                    sessionStorage.setItem('shippingOption', JSON.stringify(opt));
                  }}
                  selectedType={shippingOption?.type}
                />
              </div>

              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span className={styles.totalPrice}>
                  {formatPrice(totalPrice + (shippingOption?.cost || 0))}
                </span>
              </div>
              {/* Banner de taller cuando hay aceite + filtro */}
              {canOfferWorkshop && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.06))',
                  border: '1px solid rgba(245,158,11,0.4)',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  marginTop: '1rem',
                  display: 'flex',
                  gap: '0.6rem',
                  alignItems: 'flex-start',
                }}>
                  <FiTool size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f59e0b', marginBottom: '0.2rem' }}>
                      ¡Podés agendar el cambio en el taller!
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-2)', lineHeight: 1.4 }}>
                      Tenés aceite y filtro en el carrito. En el siguiente paso podrás elegir un turno para que lo hagamos nosotros.
                    </p>
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={() => navigate('/checkout')}
                style={{ marginTop: '1rem' }}
              >
                {shippingOption ? 'Proceder al pago →' : 'Proceder al pago'}
              </button>
              <Link to="/store" className={styles.continueShopping}>
                <FiArrowLeft size={14} /> Seguir comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
