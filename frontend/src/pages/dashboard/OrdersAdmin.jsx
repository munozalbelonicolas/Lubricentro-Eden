import { useState, useEffect } from 'react';
import { orderService } from '../../services/index';
import {
  formatPrice, formatDateTime,
  orderStatusLabel, paymentStatusLabel, deliveryTypeLabel,
} from '../../utils/formatters';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiSearch, FiCalendar, FiPrinter, FiTruck, FiX, FiSave } from 'react-icons/fi';
import ShippingLabel from '../../components/common/ShippingLabel';
import styles from './OrdersAdmin.module.css';

const ORDER_STATUSES = ['pending','confirmed','processing','shipped','ready_pickup','delivered','cancelled'];
const DELIVERY_TYPES = ['shipping','pickup','workshop'];
const CARRIERS = [
  { value: '',          label: '(sin especificar)' },
  { value: 'enviopack', label: 'EnvioPack' },
  { value: 'andreani',  label: 'Andreani' },
  { value: 'correoarg', label: 'Correo Argentino' },
  { value: 'oca',       label: 'OCA' },
  { value: 'otro',      label: 'Otro' },
];

export default function OrdersAdmin() {
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');
  const [typeFilter,    setTypeFilter]    = useState('');

  // Estado del modal de etiqueta
  const [labelOrder,    setLabelOrder]    = useState(null);

  // Estado del panel de tracking por orden (expandible)
  const [trackingPanel, setTrackingPanel] = useState(null); // orderId abierto
  const [trackingForm,  setTrackingForm]  = useState({ trackingNumber: '', trackingCarrier: '', shippingStatus: '' });
  const [savingTracking, setSavingTracking] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const data = await orderService.getAll(params);
      setOrders(data.data.orders || []);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const handler = setTimeout(() => { load(); }, 500);
    return () => clearTimeout(handler);
  }, [statusFilter, search]);

  const handleStatusChange = async (orderId, status) => {
    try {
      await orderService.updateStatus(orderId, status);
      toast.success(`Estado actualizado a "${orderStatusLabel[status]?.label || status}".`);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const openTrackingPanel = (order) => {
    setTrackingPanel(order._id);
    setTrackingForm({
      trackingNumber:  order.trackingNumber  || '',
      trackingCarrier: order.trackingCarrier || '',
      shippingStatus:  order.shippingStatus  || '',
    });
  };

  const closeTrackingPanel = () => { setTrackingPanel(null); };

  const handleSaveTracking = async (orderId) => {
    setSavingTracking(true);
    try {
      await orderService.updateTracking(orderId, trackingForm);
      toast.success('Datos de seguimiento guardados.');
      closeTrackingPanel();
      load();
    } catch (err) {
      toast.error(err.message || 'Error al guardar el tracking.');
    } finally {
      setSavingTracking(false);
    }
  };

  const filtered = orders.filter((o) => !typeFilter || o.deliveryType === typeFilter);

  return (
    <div className="page">
      <div className="container">
        <div className={styles.header}>
          <h1 className="section-title">Órdenes</h1>
          <button className="btn btn-ghost btn-sm" onClick={load} aria-label="Refrescar">
            <FiRefreshCw size={15} /> Actualizar
          </button>
        </div>

        {/* Filtros */}
        <div className={styles.controls}>
          <div className={styles.searchBar}>
            <FiSearch size={15} className={styles.searchIcon} />
            <input
              className={`input ${styles.searchInput}`}
              placeholder="Buscar por # orden o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="select" style={{ maxWidth: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos los estados</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{orderStatusLabel[s]?.label || s}</option>
            ))}
          </select>

          <select className="select" style={{ maxWidth: 180 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Todos los tipos</option>
            {DELIVERY_TYPES.map((t) => (
              <option key={t} value={t}>{deliveryTypeLabel[t]?.icon} {deliveryTypeLabel[t]?.label || t}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Pago</th>
                  <th>Estado</th>
                  <th>Cambiar Estado</th>
                  <th>Envío</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-3)' }}>
                    No hay órdenes.
                  </td></tr>
                ) : filtered.map((order) => {
                  const sInfo = orderStatusLabel[order.status]         || { label: order.status,         class: 'badge-neutral' };
                  const pInfo = paymentStatusLabel[order.paymentStatus] || { label: order.paymentStatus,  class: 'badge-neutral' };
                  const dInfo = deliveryTypeLabel[order.deliveryType]   || { label: order.deliveryType,   icon: '—', class: 'badge-neutral' };
                  const isWorkshop = order.deliveryType === 'workshop';
                  const isShipping = order.deliveryType === 'shipping';
                  const isPaid     = order.paymentStatus === 'approved';
                  const isTrackingOpen = trackingPanel === order._id;

                  return (
                    <>
                      <tr key={order._id} style={isWorkshop ? { background: 'rgba(245,158,11,0.05)' } : {}}>
                        <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>#{order.orderNumber}</td>
                        <td>
                          <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                            {order.userId ? `${order.userId.firstName || ''} ${order.userId.lastName || ''}`.trim() : 'N/A'}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{order.userId?.email}</p>
                        </td>
                        <td>
                          <span className={`badge ${dInfo.class}`}>{dInfo.icon} {dInfo.label}</span>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--color-text-2)' }}>{formatDateTime(order.createdAt)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatPrice(order.total)}</td>
                        <td><span className={`badge ${pInfo.class}`}>{pInfo.label}</span></td>
                        <td><span className={`badge ${sInfo.class}`}>{sInfo.label}</span></td>
                        <td>
                          <select
                            className="select"
                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
                            value={order.status}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>{orderStatusLabel[s]?.label || s}</option>
                            ))}
                          </select>
                        </td>

                        {/* Columna de envío */}
                        <td>
                          {isShipping ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              {/* Tracking number badge */}
                              {order.trackingNumber ? (
                                <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--color-success)', fontWeight: 700 }}>
                                  ✓ {order.trackingNumber}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-3)' }}>Sin tracking</span>
                              )}
                              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                {/* Botón tracking */}
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                                  title="Cargar número de seguimiento"
                                  onClick={() => isTrackingOpen ? closeTrackingPanel() : openTrackingPanel(order)}
                                >
                                  <FiTruck size={12} /> Tracking
                                </button>
                                {/* Botón etiqueta — solo si está pago */}
                                {isPaid && (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                                    title="Imprimir etiqueta de envío"
                                    onClick={() => setLabelOrder(order)}
                                  >
                                    <FiPrinter size={12} /> Etiqueta
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--color-text-3)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>
                      </tr>

                      {/* Fila extra: panel de taller */}
                      {isWorkshop && order.workshopAppointment && (
                        <tr key={`${order._id}-ws`} style={{ background: 'rgba(245,158,11,0.04)' }}>
                          <td colSpan={9} style={{ paddingTop: 0, paddingBottom: '0.6rem', paddingLeft: '2rem', borderTop: 'none' }}>
                            <span style={{ fontSize: '0.78rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FiCalendar size={12} />
                              <strong>Turno:</strong>&nbsp;
                              {new Date(order.workshopAppointment.date + 'T12:00:00')
                                .toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })}
                              &nbsp;·&nbsp;
                              {order.workshopAppointment.timeSlot} hs
                              {order.workshopAppointment.vehicle && (
                                <>&nbsp;·&nbsp;🚗 {order.workshopAppointment.vehicle}</>
                              )}
                            </span>
                          </td>
                        </tr>
                      )}

                      {/* Fila extra: panel de tracking (expandible) */}
                      {isTrackingOpen && (
                        <tr key={`${order._id}-tracking`}>
                          <td colSpan={9} style={{ padding: '0.75rem 1.5rem', background: 'rgba(59,130,246,0.05)', borderTop: '1px solid var(--color-border)' }}>
                            <div className={styles.trackingPanel}>
                              <p className={styles.trackingPanelTitle}>
                                <FiTruck size={14} /> Datos de seguimiento — #{order.orderNumber}
                              </p>
                              <div className={styles.trackingPanelForm}>
                                {/* N° de seguimiento */}
                                <div className="input-group">
                                  <label className="input-label">N° de seguimiento</label>
                                  <input
                                    className="input"
                                    style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
                                    placeholder="Ej: AND-0001234567"
                                    value={trackingForm.trackingNumber}
                                    onChange={(e) => setTrackingForm(f => ({ ...f, trackingNumber: e.target.value }))}
                                  />
                                </div>
                                {/* Carrier */}
                                <div className="input-group">
                                  <label className="input-label">Carrier / Empresa</label>
                                  <select
                                    className="select"
                                    value={trackingForm.trackingCarrier}
                                    onChange={(e) => setTrackingForm(f => ({ ...f, trackingCarrier: e.target.value }))}
                                  >
                                    {CARRIERS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                  </select>
                                </div>
                                {/* Estado de envío */}
                                <div className="input-group">
                                  <label className="input-label">Estado del envío</label>
                                  <select
                                    className="select"
                                    value={trackingForm.shippingStatus}
                                    onChange={(e) => setTrackingForm(f => ({ ...f, shippingStatus: e.target.value }))}
                                  >
                                    <option value="">— Sin estado —</option>
                                    <option value="preparing">Preparando</option>
                                    <option value="dispatched">Despachado</option>
                                    <option value="in_transit">En tránsito</option>
                                    <option value="delivered">Entregado</option>
                                  </select>
                                </div>
                                {/* Acciones */}
                                <div className={styles.trackingPanelActions}>
                                  <button className="btn btn-ghost btn-sm" onClick={closeTrackingPanel}>
                                    <FiX size={13} /> Cancelar
                                  </button>
                                  <button
                                    className="btn btn-primary btn-sm"
                                    disabled={savingTracking}
                                    onClick={() => handleSaveTracking(order._id)}
                                  >
                                    {savingTracking
                                      ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                                      : <><FiSave size={13} /> Guardar</>
                                    }
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de etiqueta de envío */}
      {labelOrder && (
        <ShippingLabel
          order={labelOrder}
          onClose={() => setLabelOrder(null)}
        />
      )}
    </div>
  );
}
