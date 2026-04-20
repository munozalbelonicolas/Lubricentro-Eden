import { useState, useEffect } from 'react';
import { financeService } from '../../services/finance.service';
import { formatPrice, formatDateTime } from '../../utils/formatters';
import { FiArrowLeft, FiSearch, FiCalendar, FiTrash2, FiPackage, FiFileText } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function LocalSalesAdmin() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSales();
    }, 500);
    return () => clearTimeout(handler);
  }, [search, startDate, endDate, page]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, search, startDate, endDate };
      const res = await financeService.getLocalSales(params);
      setSales(res.data.sales);
      setPagination(res.pagination);
    } catch (err) {
      toast.error('Error al cargar historial de ventas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta venta? El stock de los productos se restaurará automáticamente.')) return;
    
    setDeletingId(id);
    try {
      await financeService.deleteLocalSale(id);
      toast.success('Venta eliminada y stock restaurado');
      fetchSales();
    } catch (err) {
      toast.error('Error al eliminar la venta');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page">
      <div className="container">
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/dashboard/finance" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 600 }}>
            <FiArrowLeft /> Volver a Finanzas
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Historial de Ventas Locales</h1>
          <p style={{ color: 'var(--color-text-3)' }}>Consulta detallada de todas las ventas realizadas en el local</p>
        </div>

        {/* Filtros */}
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
            <label className="input-label">Buscar producto o descripción</label>
            <div style={{ position: 'relative' }}>
              <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
              <input 
                className="input" style={{ paddingLeft: '2.5rem' }}
                placeholder="Ej: Aceite, Filtro, Notas..."
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="input-group" style={{ width: '180px' }}>
            <label className="input-label">Desde</label>
            <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="input-group" style={{ width: '180px' }}>
            <label className="input-label">Hasta</label>
            <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button className="btn btn-ghost" onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); }}>Limpiar</button>
        </div>

        {/* Tabla */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Productos Vendidos</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>No se encontraron ventas para este criterio.</td></tr>
              ) : sales.map((sale) => (
                <tr key={sale._id}>
                  <td style={{ fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 600 }}>{new Date(sale.date).toLocaleDateString('es-AR')}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{formatDateTime(sale.createdAt).split(' ')[1]} hs</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{sale.description || <span style={{ opacity: 0.4 }}>Sin notas</span>}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {sale.items.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ background: 'var(--color-bg-2)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>{item.quantity}x</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: '#22c55e', fontSize: '1.1rem' }}>{formatPrice(sale.total)}</div>
                  </td>
                  <td>
                    <button 
                      className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }}
                      onClick={() => handleDelete(sale._id)}
                      disabled={deletingId === sale._id}
                    >
                      {deletingId === sale._id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <FiTrash2 />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Paginación */}
          {pagination.pages > 1 && (
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button 
                  key={p} 
                  className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
