import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { orderService, paymentService } from '../services/index';
import { formatPrice, formatDateTime, orderStatusLabel, paymentStatusLabel, deliveryTypeLabel, getImageUrl } from '../utils/formatters';
import { FiArrowLeft, FiPackage, FiMapPin, FiClock, FiTool, FiCalendar } from 'react-icons/fi';
import styles from './OrderDetailPage.module.css';

export default function OrderDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [order, setOrder]     = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCart();

  const paymentResult = searchParams.get('payment'); // success | failure | pending

  useEffect(() => {
    // Si el pago retorna éxito, vaciamos el carrito del usuario.
    if (paymentResult === 'success') {
      clearCart();
    }

    orderService.getById(id)
      .then(async (data) => {
        setOrder(data.data.order);
        // Intentar cargar pago
        try {
          const pData = await paymentService.getByOrder(id);
          setPayment(pData.data.payment);
        } catch { /* no hay pago aún */ }
      })
      .catch(() => navigate('/orders'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  if (!order)  return null;

  const statusInfo = orderStatusLabel[order.status]   || { label: order.status,   class: 'badge-neutral' };
  const payInfo    = paymentStatusLabel[order.paymentStatus] || { label: order.paymentStatus, class: 'badge-neutral' };

  return (
    <div className="page">
      <div className="container">
        <Link to="/orders" className={styles.backLink}>
          <FiArrowLeft size={16} /> Mis pedidos
        </Link>

        {/* Banner de resultado de pago */}
        {paymentResult === 'success' && (
          <div className={styles.paymentBanner} data-type="success">
            ✅ ¡Pago aprobado! Tu pedido está confirmado.
          </div>
        )}
        {paymentResult === 'failure' && (
          <div className={styles.paymentBanner} data-type="failure">
            ❌ El pago no fue aprobado. Podés intentarlo nuevamente.
          </div>
        )}
        {paymentResult === 'pending' && (
          <div className={styles.paymentBanner} data-type="pending">
            ⏳ El pago está en proceso. Te notificaremos cuando se confirme.
          </div>
        )}

        <div className={styles.header}>
          <div>
            <h1 className={styles.orderNum}>Pedido #{order.orderNumber}</h1>
            <p className={styles.orderDate}>{formatDateTime(order.createdAt)}</p>
          </div>
          <div className={styles.statuses}>
            <span className={`badge ${statusInfo.class}`} style={{ fontSize: '0.9rem', padding: '0.35rem 0.9rem' }}>
              <FiPackage size={13} /> {statusInfo.label}
            </span>
            <span className={`badge ${payInfo.class}`} style={{ fontSize: '0.9rem', padding: '0.35rem 0.9rem' }}>
              💳 {payInfo.label}
            </span>
          </div>
        </div>

        <div className={styles.layout}>
          {/* Items */}
          <div className={styles.main}>
            <div className="card">
              <p className={styles.sectionTitle}>Productos</p>
              <div className={styles.items}>
                {order.items.map((item, i) => (
                  <div key={i} className={styles.item}>
                    <div className={styles.itemImg}>
                      {item.image ? <img src={getImageUrl(item.image)} alt={item.name} /> : <span>🔧</span>}
                    </div>
                    <div className={styles.itemInfo}>
                      <p className={styles.itemName}>{item.name}</p>
                      <p className={styles.itemQty}>x{item.quantity} × {formatPrice(item.price)}</p>
                    </div>
                    <p className={styles.itemTotal}>{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className={styles.totals}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Envío</span><span>{order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'Gratis'}</span>
                </div>
                <div className={`${styles.totalRow} ${styles.totalFinal}`}>
                  <span>Total</span><span className={styles.totalPrice}>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="card" style={{ marginTop: '1rem' }}>
                <p className={styles.sectionTitle}>Notas</p>
                <p style={{ color: 'var(--color-text-2)', fontSize: '0.9rem' }}>{order.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>

            {/* Turno de taller */}
            {order.deliveryType === 'workshop' && order.workshopAppointment && (
              <div className="card" style={{ borderLeft: '4px solid var(--color-warning, #f59e0b)' }}>
                <p className={styles.sectionTitle}><FiTool size={15} /> Turno en el Taller 🔧</p>
                <div className={styles.shippingInfo}>
                  <p><FiCalendar size={13} style={{ marginRight: 6 }} />
                    <strong>
                      {new Date(order.workshopAppointment.date + 'T12:00:00').toLocaleDateString('es-AR', {
                        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                      })}
                    </strong>
                  </p>
                  <p><FiClock size={13} style={{ marginRight: 6 }} />
                    Franja: <strong>{order.workshopAppointment.timeSlot} hs</strong>
                  </p>
                  {order.workshopAppointment.vehicle && (
                    <p>🚗 Vehículo: <strong>{order.workshopAppointment.vehicle}</strong></p>
                  )}
                  <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-3)' }}>
                    Presentate con tu vehículo en el horario indicado. El aceite y filtro que compraste serán utilizados para el cambio.
                  </p>
                </div>
              </div>
            )}

            {/* Retiro en tienda */}
            {order.deliveryType === 'pickup' && (
              <div className="card">
                <p className={styles.sectionTitle}><FiPackage size={15} /> Retiro en tienda</p>
                <div className={styles.shippingInfo}>
                  {order.shipping?.name && <p><strong>{order.shipping.name}</strong></p>}
                  {order.shipping?.phone && <p>📞 {order.shipping.phone}</p>}
                  <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-3)' }}>
                    Te avisaremos cuando tu pedido esté listo para retirar.
                  </p>
                </div>
              </div>
            )}

            {/* Envío a domicilio */}
            {order.deliveryType === 'shipping' && (
              <div className="card">
                <p className={styles.sectionTitle}><FiMapPin size={15} /> Datos de Envío</p>
                <div className={styles.shippingInfo}>
                  {order.shipping?.name      && <p><strong>{order.shipping.name}</strong></p>}
                  {order.shipping?.address   && <p>{order.shipping.address}</p>}
                  {order.shipping?.city      && <p>{order.shipping.city}{order.shipping.province ? `, ${order.shipping.province}` : ''}</p>}
                  {order.shipping?.postalCode && <p>CP: {order.shipping.postalCode}</p>}
                  {order.shipping?.phone     && <p>📞 {order.shipping.phone}</p>}
                </div>
              </div>
            )}

            {/* Pago */}
            {payment && (
              <div className="card">
                <p className={styles.sectionTitle}>Información de Pago</p>
                <div className={styles.shippingInfo}>
                  <p>ID: {payment.mercadoPagoPaymentId || '-'}</p>
                  <p>Método: {payment.paymentMethod || 'Mercado Pago'}</p>
                  {payment.paidAt && <p>Pagado: {formatDateTime(payment.paidAt)}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
