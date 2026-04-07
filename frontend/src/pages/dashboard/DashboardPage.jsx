import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/index';
import { subscriptionService } from '../../services/index';
import { productService } from '../../services/product.service';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import { formatPrice, formatDateTime } from '../../utils/formatters';
import {
  FiPackage, FiDollarSign, FiClock, FiTrendingUp,
  FiSettings, FiShoppingBag, FiGrid, FiStar, FiTool,
} from 'react-icons/fi';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { user }   = useAuth();
  const { tenant } = useTenant();
  const [stats,  setStats]  = useState(null);
  const [sub,    setSub]    = useState(null);
  const [prodCount, setProdCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      orderService.getStats(),
      subscriptionService.getMine(),
      productService.getAll({ limit: 1 }),
    ]).then(([statsData, subData, prodData]) => {
      setStats(statsData.data);
      setSub(subData.data.subscription);
      setProdCount(prodData.pagination?.total || 0);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const planLimit = sub?.plan === 'premium' ? '∞' : '20';

  const cards = [
    { icon: <FiPackage size={22} />,    label: 'Total Órdenes',    value: stats?.totalOrders    ?? '-', color: '#3B82F6' },
    { icon: <FiDollarSign size={22} />, label: 'Ingresos Aprobados', value: stats ? formatPrice(stats.totalRevenue) : '-', color: '#22C55E' },
    { icon: <FiClock size={22} />,      label: 'Órdenes Pendientes', value: stats?.pendingOrders  ?? '-', color: '#FBBF24' },
    { icon: <FiTool size={22} />,       label: 'Turnos Taller',     value: stats?.workshopOrders ?? '-', color: '#F59E0B' },
    { icon: <FiShoppingBag size={22}/>, label: 'Productos',         value: `${prodCount} / ${planLimit}`,  color: '#FF6B00' },
  ];

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>
              Hola, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className={styles.storeName}>{tenant?.name}</p>
          </div>
          <div className={styles.planBadge}>
            <FiStar size={14} />
            Plan {sub?.plan?.toUpperCase() || 'FREE'}
            {sub?.plan !== 'premium' && (
              <Link to="/dashboard/subscription" className={styles.upgradeCta}>Mejorar</Link>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          {cards.map(({ icon, label, value, color }) => (
            <div key={label} className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: `${color}22`, color }}>
                {icon}
              </div>
              <div>
                <p className={styles.statValue}>{loading ? '...' : value}</p>
                <p className={styles.statLabel}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className={styles.quickLinks}>
          <Link to="/dashboard/products" className={styles.quickCard}>
            <FiPackage size={28} />
            <p className={styles.quickTitle}>Productos</p>
            <p className={styles.quickDesc}>Administrar catálogo</p>
          </Link>
          <Link to="/dashboard/orders" className={styles.quickCard}>
            <FiShoppingBag size={28} />
            <p className={styles.quickTitle}>Órdenes</p>
            <p className={styles.quickDesc}>Ver y gestionar pedidos</p>
          </Link>
          <Link to="/dashboard/workshop" className={styles.quickCard} style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.06)' }}>
            <FiTool size={28} style={{ color: '#f59e0b' }} />
            <p className={styles.quickTitle} style={{ color: '#f59e0b' }}>Agenda del Taller</p>
            <p className={styles.quickDesc}>
              {stats?.workshopOrders ?? 0} turnos en total
            </p>
          </Link>
          <Link to="/dashboard/config" className={styles.quickCard}>
            <FiSettings size={28} />
            <p className={styles.quickTitle}>Configuración</p>
            <p className={styles.quickDesc}>Datos de la tienda</p>
          </Link>
          <Link to="/dashboard/subscription" className={styles.quickCard}>
            <FiStar size={28} />
            <p className={styles.quickTitle}>Suscripción</p>
            <p className={styles.quickDesc}>Plan actual: {sub?.plan || 'free'}</p>
          </Link>
        </div>

        {/* Órdenes recientes */}
        {stats?.recentOrders?.length > 0 && (
          <div className={styles.recentSection}>
            <div className={styles.recentHeader}>
              <p className={styles.recentTitle}>Órdenes Recientes</p>
              <Link to="/dashboard/orders" className={styles.viewAll}>Ver todas →</Link>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Orden</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <Link to={`/orders/${order._id}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td>{order.userId?.name || 'N/A'}</td>
                      <td style={{ color: 'var(--color-text-2)', fontSize: '0.85rem' }}>{formatDateTime(order.createdAt)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatPrice(order.total)}</td>
                      <td>
                        <span className={`badge badge-${order.paymentStatus === 'approved' ? 'success' : order.paymentStatus === 'rejected' ? 'error' : 'warning'}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
