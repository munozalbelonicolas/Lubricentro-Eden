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
  FiShoppingBag, FiGrid, FiStar, FiTool, FiActivity, FiUser, FiBarChart2
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
    { icon: <FiPackage size={22} />,    label: 'Total Órdenes',    value: stats?.totalOrders    ?? '-', color: '#3B82F6', link: '/dashboard/orders' },
    { icon: <FiDollarSign size={22} />, label: 'Finanzas', value: stats ? formatPrice(stats.totalRevenue) : '-', color: '#22C55E', link: '/dashboard/finance' },
    { icon: <FiClock size={22} />,      label: 'Órdenes Pendientes', value: stats?.pendingOrders  ?? '-', color: '#FBBF24', link: '/dashboard/orders?status=pending' },
    { icon: <FiTool size={22} />,       label: 'Turnos Taller',     value: stats?.workshopOrders ?? '-', color: '#F59E0B', link: '/dashboard/workshop' },
    { icon: <FiShoppingBag size={22}/>, label: 'Productos',         value: `${prodCount} / ${planLimit}`,  color: '#CB1A20', link: '/dashboard/products' },
  ];

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>
              Hola, {(user?.firstName || user?.name || 'Usuario').split(' ')[0]} 👋
            </h1>
            <p className={styles.storeName}>{tenant?.name}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          {cards.map(({ icon, label, value, color, link }) => (
            <Link key={label} to={link} className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: `${color}22`, color }}>
                {icon}
              </div>
              <div style={{ flex: 1 }}>
                <p className={styles.statValue}>{loading ? '...' : value}</p>
                <p className={styles.statLabel}>{label}</p>
              </div>
            </Link>
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
          <Link to="/dashboard/finance" className={styles.quickCard} style={{ borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.06)' }}>
            <FiDollarSign size={28} style={{ color: '#22c55e' }} />
            <p className={styles.quickTitle} style={{ color: '#22c55e' }}>Finanzas</p>
            <p className={styles.quickDesc}>Ingresos y Egresos</p>
          </Link>
          <Link to="/dashboard/stats" className={styles.quickCard} style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' }}>
            <FiBarChart2 size={28} style={{ color: '#ef4444' }} />
            <p className={styles.quickTitle} style={{ color: '#ef4444' }}>Estadísticas</p>
            <p className={styles.quickDesc}>Analítica y Evolución</p>
          </Link>
          <Link to="/dashboard/history" className={styles.quickCard} style={{ borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.06)' }}>
            <FiActivity size={28} style={{ color: '#3b82f6' }} />
            <p className={styles.quickTitle} style={{ color: '#3b82f6' }}>Historial Clínico</p>
            <p className={styles.quickDesc}>Consulta por patente</p>
          </Link>
          <Link to="/dashboard/users" className={styles.quickCard} style={{ borderColor: 'rgba(168,85,247,0.3)', background: 'rgba(168,85,247,0.06)' }}>
            <FiUser size={28} style={{ color: '#a855f7' }} />
            <p className={styles.quickTitle} style={{ color: '#a855f7' }}>Usuarios</p>
            <p className={styles.quickDesc}>Clientes y accesos</p>
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
