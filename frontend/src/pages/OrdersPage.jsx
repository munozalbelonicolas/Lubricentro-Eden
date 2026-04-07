import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/index';
import { formatPrice, formatDate, orderStatusLabel, paymentStatusLabel } from '../utils/formatters';
import { FiPackage, FiChevronRight } from 'react-icons/fi';
import styles from './OrdersPage.module.css';

export default function OrdersPage() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getAll({ limit: 50 })
      .then((data) => setOrders(data.data.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>
  );

  return (
    <div className="page">
      <div className="container">
        <h1 className="section-title" style={{ marginBottom: '2rem' }}>Mis Pedidos</h1>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-2)' }}>
            <FiPackage size={48} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.4 }} />
            <p>Aún no realizaste ningún pedido.</p>
            <Link to="/store" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <div className={styles.list}>
            {orders.map((order) => {
              const statusInfo  = orderStatusLabel[order.status]  || { label: order.status, class: 'badge-neutral' };
              const payInfo     = paymentStatusLabel[order.paymentStatus] || { label: order.paymentStatus, class: 'badge-neutral' };
              return (
                <Link to={`/orders/${order._id}`} key={order._id} className={styles.orderCard}>
                  <div className={styles.orderLeft}>
                    <div className={styles.orderIcon}><FiPackage size={20} /></div>
                    <div>
                      <p className={styles.orderNum}>#{order.orderNumber}</p>
                      <p className={styles.orderDate}>{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className={styles.orderMid}>
                    <p className={styles.orderItems}>{order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}</p>
                    <div className={styles.statusRow}>
                      <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>
                      <span className={`badge ${payInfo.class}`}>{payInfo.label}</span>
                    </div>
                  </div>
                  <div className={styles.orderRight}>
                    <p className={styles.orderTotal}>{formatPrice(order.total)}</p>
                    <FiChevronRight size={18} className={styles.arrow} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
