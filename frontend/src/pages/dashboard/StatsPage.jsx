import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area 
} from 'recharts';
import { financeService } from '../../services/finance.service';
import { formatPrice } from '../../utils/formatters';
import { FiTrendingUp, FiPackage, FiActivity, FiArrowUpRight, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function StatsPage() {
  const [bestSellers, setBestSellers] = useState([]);
  const [history, setHistory] = useState([]);
  const [prodEvolution, setProdEvolution] = useState([]);
  const [visitStats, setVisitStats] = useState({ summary: {}, history: [] });
  const [selectedProd, setSelectedProd] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filtros de fecha
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [bestRes, historyRes, visitRes] = await Promise.all([
        financeService.getBestSellers(params),
        financeService.getFinanceEvolution(params),
        financeService.getSiteVisits(params)
      ]);
      
      const sellers = bestRes?.data?.bestSellers || [];
      const historyData = historyRes?.data?.history || [];
      const visitsData = visitRes?.data || { summary: {}, history: [] };

      setBestSellers(sellers);
      setHistory(historyData);
      setVisitStats(visitsData);
      
      // Si no hay producto seleccionado y hay disponibles, seleccionar el primero
      if (sellers.length > 0) {
        const nextProd = selectedProd 
          ? sellers.find(p => p._id === selectedProd._id) || sellers[0]
          : sellers[0];
        handleProductChange(nextProd._id, sellers);
      }
    } catch (err) {
      console.error('Fetch Stats Error:', err);
      toast.error('Error al cargar algunas estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = async (prodId, currentSellers = bestSellers) => {
    if (!prodId) return;
    try {
      const prod = currentSellers.find(p => p._id === prodId);
      if (!prod) return;
      setSelectedProd(prod);
      const res = await financeService.getProductEvolution(prodId);
      setProdEvolution(res?.data?.evolution || []);
    } catch (err) {
      console.error('Product Change Error:', err);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  if (loading) return <div className="page flex-center"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Estadísticas y Analítica</h1>
            <p style={{ color: 'var(--color-text-3)' }}>Evolución detallada de ventas, productos y rendimiento del sitio.</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'var(--color-bg-2)', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase' }}>Desde:</span>
              <input type="date" className="input" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', width: 'auto' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase' }}>Hasta:</span>
              <input type="date" className="input" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', width: 'auto' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            {(startDate || endDate) && (
              <button onClick={clearFilters} style={{ padding: '0.4rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}>
                <FiX />
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          
          {/* Evolución Financiera */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: '8px' }}>
                <FiTrendingUp size={20}/>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Evolución de Finanzas (12 meses)</h3>
            </div>
            <div style={{ height: '300px' }}>
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-3)', fontSize: 12}} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)', background: 'var(--color-surface)' }}
                      formatter={(val) => formatPrice(val || 0)}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    <Area type="monotone" name="Ingresos" dataKey="income" stroke="#22c55e" fillOpacity={1} fill="url(#colorInc)" strokeWidth={3} />
                    <Area type="monotone" name="Egresos" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex-center" style={{ height: '100%', opacity: 0.5 }}>Sin datos en este periodo</div>
              )}
            </div>
          </div>

          {/* Más Vendidos */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(203,26,32,0.1)', color: 'var(--color-primary)', borderRadius: '8px' }}>
                <FiPackage size={20}/>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Top 10 Productos Más Vendidos</h3>
            </div>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestSellers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-2)', fontSize: 10}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)', background: 'var(--color-surface)' }}
                  />
                  <Bar dataKey="totalSold" name="Vendidos" fill="var(--color-primary)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
          
          {/* Evolución de un producto */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '8px' }}>
                  <FiArrowUpRight size={20}/>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Evolución de Producto</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-3)' }}>{selectedProd?.name}</p>
                </div>
              </div>
              <select 
                className="select" style={{ width: 'auto', minWidth: '200px' }}
                onChange={(e) => handleProductChange(e.target.value)}
                value={selectedProd?._id || ''}
              >
                {bestSellers.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prodEvolution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-3)', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)', background: 'var(--color-surface)' }}
                  />
                  <Line type="stepAfter" name="Ventas" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6, fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Visitas (Real Analytics) */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(168,85,247,0.1)', color: '#a855f7', borderRadius: '8px' }}>
                  <FiActivity size={20}/>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Tráfico del Sitio</h3>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase' }}>Visitas</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a855f7' }}>{visitStats.summary?.pageviews?.value || 0}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase' }}>Únicos</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3b82f6' }}>{visitStats.summary?.visitors?.value || 0}</p>
                </div>
              </div>
            </div>
            <div style={{ height: '220px' }}>
              {visitStats && visitStats.history && visitStats.history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={visitStats.history}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{fill: 'var(--color-text-3)', fontSize: 11}} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)', background: 'var(--color-surface)' }}
                    />
                    <Bar dataKey="views" name="Visitas" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="visitors" name="Únicos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex-center" style={{ height: '100%', opacity: 0.5, fontSize: '0.85rem', flexDirection: 'column', gap: '0.5rem' }}>
                  <FiActivity size={24} />
                  <p>No hay datos de visitas para este periodo</p>
                </div>
              )}
            </div>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
               <a 
                href="https://cloud.umami.is/share/4c670384-9047-4217-8b65-ba7e7be9f9bc/lubricentro-eden" 
                target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', textDecoration: 'underline' }}
              >
                Ver reporte detallado en Umami Cloud →
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
