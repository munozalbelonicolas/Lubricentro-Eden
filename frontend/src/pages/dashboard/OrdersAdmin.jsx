import { useState, useEffect } from 'react';
import { orderService } from '../../services/index';
import {
  formatPrice, formatDateTime,
  orderStatusLabel, paymentStatusLabel, deliveryTypeLabel,
} from '../../utils/formatters';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiSearch, FiCalendar } from 'react-icons/fi';
import styles from './OrdersAdmin.module.css';

const ORDER_STATUSES = ['pending','confirmed','processing','shipped','ready_pickup','delivered','cancelled'];
const DELIVERY_TYPES = ['shipping','pickup','workshop'];

export default function OrdersAdmin() {
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');

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
    const handler = setTimeout(() => {
      load();
    }, 500); // Debounce de 500ms
    return () => clearTimeout(handler);
  }, [statusFilter, search]);

  const handleStatusChange = async (orderId, status) => {
    try {
      await orderService.updateStatus(orderId, status);
      toast.success(`Estado actualizado a "${status}".`);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const filtered = orders.filter((o) => {
    return !typeFilter || o.deliveryType === typeFilter;
  });

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

          {/* Filtro por estado */}
          <select
            className="select"
            style={{ maxWidth: 180 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{orderStatusLabel[s]?.label || s}</option>
            ))}
          </select>

          {/* Filtro por tipo de entrega */}
          <select
            className="select"
            style={{ maxWidth: 180 }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
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
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-3)' }}>
                    No hay órdenes.
                  </td></tr>
                ) : filtered.map((order) => {
                  const sInfo = orderStatusLabel[order.status]          || { label: order.status,          class: 'badge-neutral' };
                  const pInfo = paymentStatusLabel[order.paymentStatus]  || { label: order.paymentStatus,  class: 'badge-neutral' };
                  const dInfo = deliveryTypeLabel[order.deliveryType]    || { label: order.deliveryType,   icon: '—', class: 'badge-neutral' };
                  const isWorkshop = order.deliveryType === 'workshop';
                  return (
                    <>
                      <tr key={order._id} style={isWorkshop ? { background: 'rgba(245,158,11,0.05)' } : {}}>
                        <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>#{order.orderNumber}</td>
                        <td>
                          <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{order.userId ? `${order.userId.firstName || ''} ${order.userId.lastName || ''}`.trim() : 'N/A'}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{order.userId?.email}</p>
                        </td>
                        <td>
                          <span className={`badge ${dInfo.class}`}>
                            {dInfo.icon} {dInfo.label}
                          </span>
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
                      </tr>
                      {/* Fila extra para datos de taller */}
                      {isWorkshop && order.workshopAppointment && (
                        <tr key={`${order._id}-ws`} style={{ background: 'rgba(245,158,11,0.04)' }}>
                          <td colSpan={8} style={{ paddingTop: 0, paddingBottom: '0.6rem', paddingLeft: '2rem', borderTop: 'none' }}>
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
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
