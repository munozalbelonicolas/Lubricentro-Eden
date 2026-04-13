import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { orderService, paymentService } from '../services/index';
import { formatPrice, getImageUrl } from '../utils/formatters';
import toast from 'react-hot-toast';
import {
  FiMapPin, FiPhone, FiCreditCard, FiShield,
  FiTruck, FiPackage, FiTool, FiCalendar, FiClock,
} from 'react-icons/fi';
import styles from './CheckoutPage.module.css';

// Generar franjas de 30 minutos (08:00 a 17:30)
const TIME_SLOTS = [];
for (let h = 8; h < 18; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2,'0')}:00`);
  if (h < 17 || h === 17) TIME_SLOTS.push(`${String(h).padStart(2,'0')}:30`);
}

// Mínimo mañana, máximo 30 días
const getDateRange = () => {
  const min = new Date(); min.setDate(min.getDate() + 1);
  const max = new Date(); max.setDate(max.getDate() + 30);
  const fmt = (d) => d.toISOString().split('T')[0];
  return { min: fmt(min), max: fmt(max) };
};

export default function CheckoutPage() {
  const { items, totalPrice, clearCart, isEmpty } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Tipo de entrega
  const [deliveryType, setDeliveryType] = useState('shipping');

  // Datos de envío (solo si shipping o pickup)
  const [shipping, setShipping] = useState({
    name: '', address: '', city: '', province: '', postalCode: '', phone: '',
  });
  const [notes, setNotes] = useState('');

  // Turno de taller
  const [wantWorkshop, setWantWorkshop] = useState(false);
  const [appointment, setAppointment] = useState({ date: '', timeSlot: '', vehicle: '' });

  // Detectar si el carrito tiene aceite Y filtro simultáneamente
  const canOfferWorkshop = useMemo(() => {
    const cats = items.map((i) => i.category?.toLowerCase() || '');
    return cats.some((c) => c.includes('aceite')) && cats.some((c) => c.includes('filtro'));
  }, [items]);

  const { min: dateMin, max: dateMax } = getDateRange();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validaciones en tiempo real
    if (name === 'name') {
      // Solo letras, espacios y algunos caracteres especiales de nombres (acentos, ñ)
      const cleanValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '');
      setShipping((s) => ({ ...s, [name]: cleanValue }));
      return;
    }
    
    if (name === 'phone') {
      // Solo números, +, -, y espacios
      const cleanValue = value.replace(/[^0-9+ \-]/g, '');
      setShipping((s) => ({ ...s, [name]: cleanValue }));
      return;
    }

    setShipping((s) => ({ ...s, [name]: value }));
  };
  const handleAppt = (e) => setAppointment((a) => ({ ...a, [e.target.name]: e.target.value }));

  const handleDeliveryType = (type) => {
    setDeliveryType(type);
    if (type === 'workshop') setWantWorkshop(true);
    else setWantWorkshop(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones según tipo de entrega
    if (deliveryType === 'shipping' && (!shipping.name || !shipping.address || !shipping.city)) {
      toast.error('Completá los datos de envío obligatorios.');
      return;
    }
    if (deliveryType === 'pickup' && !shipping.name) {
      toast.error('Ingresá tu nombre para el retiro.');
      return;
    }
    if (deliveryType === 'workshop') {
      if (!appointment.date || !appointment.timeSlot) {
        toast.error('Elegí una fecha y franja horaria para el turno.');
        return;
      }
    }

    setLoading(true);
    try {
      const orderPayload = {
        items: items.map((i) => ({ productId: i._id, quantity: i.quantity })),
        deliveryType,
        notes,
        shipping: deliveryType !== 'workshop' ? shipping : {},
        workshopAppointment: deliveryType === 'workshop'
          ? { date: appointment.date, timeSlot: appointment.timeSlot, vehicle: appointment.vehicle }
          : null,
      };

      const orderData = await orderService.create(orderPayload);
      const order = orderData.data.order;

      const prefData = await paymentService.createPreference(order._id);
      
      // ELIMINADO clearCart() aquí. Solo se vaciará si el usuario vuelve exitoso.
      // Así prevenimos el "Carrito abandonado destructivo" si falla el pago de MercadoPago.

      const redirectUrl = import.meta.env.DEV
        ? prefData.data.sandboxInitPoint
        : prefData.data.initPoint;

      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        toast.success('¡Orden creada! Te redirigiremos al pago.');
        navigate(`/orders/${order._id}`);
      }
    } catch (err) {
      toast.error(err.message || 'Error al procesar el pedido.');
      setLoading(false);
    }
  };

  if (isEmpty) { navigate('/cart'); return null; }

  return (
    <div className="page">
      <div className="container">
        <h1 className="section-title" style={{ marginBottom: '2rem' }}>Finalizar Compra</h1>

        <form onSubmit={handleSubmit} className={styles.layout}>
          <div className={styles.formSection}>

            {/* ── Tipo de entrega ── */}
            <div className={styles.formCard}>
              <p className={styles.formCardTitle}><FiPackage size={18} /> ¿Cómo recibís tu pedido?</p>
              <div className={styles.deliveryOptions}>

                <button
                  type="button"
                  className={`${styles.deliveryBtn} ${deliveryType === 'shipping' ? styles.deliveryBtnActive : ''}`}
                  onClick={() => handleDeliveryType('shipping')}
                >
                  <FiTruck size={22} />
                  <span className={styles.deliveryLabel}>Envío a domicilio</span>
                  <span className={styles.deliverySub}>Recibilo donde quieras</span>
                </button>

                <button
                  type="button"
                  className={`${styles.deliveryBtn} ${deliveryType === 'pickup' ? styles.deliveryBtnActive : ''}`}
                  onClick={() => handleDeliveryType('pickup')}
                >
                  <FiPackage size={22} />
                  <span className={styles.deliveryLabel}>Retiro en tienda</span>
                  <span className={styles.deliverySub}>Pasás a buscarlo</span>
                </button>

                {canOfferWorkshop && (
                  <button
                    type="button"
                    className={`${styles.deliveryBtn} ${deliveryType === 'workshop' ? styles.deliveryBtnActive : ''}`}
                    onClick={() => handleDeliveryType('workshop')}
                  >
                    <FiTool size={22} />
                    <span className={styles.deliveryLabel}>Cambio en taller 🔧</span>
                    <span className={styles.deliverySub}>Usamos tu aceite y filtro</span>
                  </button>
                )}
              </div>
            </div>

            {/* ── Datos de envío (solo si no es taller) ── */}
            {deliveryType !== 'workshop' && (
              <div className={styles.formCard}>
                <p className={styles.formCardTitle}>
                  <FiMapPin size={18} />
                  {deliveryType === 'shipping' ? ' Datos de Envío' : ' Datos para Retiro'}
                </p>
                <div className={styles.formGrid}>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">Nombre completo *</label>
                    <input className="input" name="name" placeholder="Juan García"
                      value={shipping.name} onChange={handleChange} required />
                  </div>
                  {deliveryType === 'shipping' && (
                    <>
                      <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="input-label">Dirección *</label>
                        <input className="input" name="address" placeholder="Av. San Martín 1234"
                          value={shipping.address} onChange={handleChange} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Ciudad *</label>
                        <input className="input" name="city" placeholder="Córdoba"
                          value={shipping.city} onChange={handleChange} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Provincia</label>
                        <input className="input" name="province" placeholder="Córdoba"
                          value={shipping.province} onChange={handleChange} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Código Postal</label>
                        <input className="input" name="postalCode" placeholder="5000"
                          value={shipping.postalCode} onChange={handleChange} />
                      </div>
                    </>
                  )}
                  <div className="input-group">
                    <label className="input-label"><FiPhone size={13} /> Teléfono</label>
                    <input className="input" name="phone" placeholder="+54 9 351 000 0000"
                      value={shipping.phone} onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Turno de taller ── */}
            {deliveryType === 'workshop' && (
              <div className={`${styles.formCard} ${styles.workshopCard}`}>
                <p className={styles.formCardTitle}><FiCalendar size={18} /> Turno en el Taller</p>
                <p className={styles.workshopNote}>
                  🔧 Traé tu vehículo en el horario elegido y usaremos el aceite y filtro que compraste para realizar el cambio.
                </p>
                <div className={styles.formGrid}>
                  <div className="input-group">
                    <label className="input-label"><FiCalendar size={13} /> Fecha *</label>
                    <input
                      type="date" className="input" name="date"
                      min={dateMin} max={dateMax}
                      value={appointment.date} onChange={handleAppt} required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label"><FiClock size={13} /> Franja horaria *</label>
                    <select className="select" name="timeSlot" value={appointment.timeSlot} onChange={handleAppt} required>
                      <option value="">Seleccioná un horario</option>
                      {TIME_SLOTS.map((s) => (
                        <option key={s} value={s}>{s} hs</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">Patente / Vehículo (opcional)</label>
                    <input className="input" name="vehicle" placeholder="Ej: ABC 123 — Ford Focus 2019"
                      value={appointment.vehicle} onChange={handleAppt} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Notas y pago ── */}
            <div className={styles.formCard}>
              <p className={styles.formCardTitle}><FiCreditCard size={18} /> Método de Pago</p>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label">Notas adicionales</label>
                <textarea className="input textarea" placeholder="Instrucciones especiales..."
                  value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
              <div className={styles.mpBadge}>
                <div>
                  <p className={styles.mpTitle}>Mercado Pago</p>
                  <p className={styles.mpSub}>Tarjeta de crédito, débito, efectivo y más</p>
                </div>
                <div className={styles.mpCheck}>✓</div>
              </div>
              <div className={styles.secureNote}>
                <FiShield size={14} /> Pago 100% seguro encriptado por Mercado Pago
              </div>
            </div>
          </div>

          {/* ── Resumen ── */}
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <p className={styles.summaryTitle}>Tu pedido</p>
              <div className={styles.summaryItems}>
                {items.map((item) => (
                  <div key={item._id} className={styles.summaryItem}>
                    <div className={styles.summaryItemImg}>
                      {item.images?.[0]
                        ? <img src={getImageUrl(item.images[0])} alt={item.name} />
                        : <span>🔧</span>
                      }
                    </div>
                    <div className={styles.summaryItemInfo}>
                      <p className={styles.summaryItemName}>{item.name}</p>
                      <p className={styles.summaryItemQty}>x{item.quantity}</p>
                    </div>
                    <p className={styles.summaryItemPrice}>{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Resumen de entrega */}
              <div className={styles.deliverySummary}>
                {deliveryType === 'shipping' && <span>🚚 Envío a domicilio</span>}
                {deliveryType === 'pickup'   && <span>📦 Retiro en tienda</span>}
                {deliveryType === 'workshop' && appointment.date && (() => {
                  const [y, m, d] = appointment.date.split('-');
                  const localDate = new Date(y, m - 1, d);
                  return <span>🔧 Taller: {localDate.toLocaleDateString('es-AR')} — {appointment.timeSlot} hs</span>;
                })()}
                {deliveryType === 'workshop' && !appointment.date && <span>🔧 Cambio en taller</span>}
              </div>

              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span className={styles.totalPrice}>{formatPrice(totalPrice)}</span>
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg"
                disabled={loading} style={{ marginTop: '1rem' }}>
                {loading
                  ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  : '💳 Ir al pago'
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
