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
  const [selectedProd, setSelectedProd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [bestRes, historyRes] = await Promise.all([
        financeService.getBestSellers(),
        financeService.getFinanceEvolution()
      ]);
      setBestSellers(bestRes.data.bestSellers);
      setHistory(historyRes.data.history);
      
      if (bestRes.data.bestSellers.length > 0) {
        handleProductChange(bestRes.data.bestSellers[0]._id);
      }
    } catch (err) {
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = async (prodId) => {
    try {
      const prod = bestSellers.find(p => p._id === prodId);
      setSelectedProd(prod);
      const res = await financeService.getProductEvolution(prodId);
      setProdEvolution(res.data.evolution);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="page flex-center"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Estadísticas y Analítica</h1>
          <p style={{ color: 'var(--color-text-3)' }}>Evolución detallada de ventas, productos y rendimiento del sitio.</p>
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
                    formatter={(val) => formatPrice(val)}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Area type="monotone" name="Ingresos" dataKey="income" stroke="#22c55e" fillOpacity={1} fill="url(#colorInc)" strokeWidth={3} />
                  <Area type="monotone" name="Egresos" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
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

          {/* Visitas (Umami Info) */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, transparent 100%)' }}>
            <div style={{ padding: '1rem', background: 'rgba(168,85,247,0.2)', color: '#a855f7', borderRadius: '50%', marginBottom: '1rem' }}>
              <FiActivity size={32}/>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Analítica de Visitas</h3>
            <p style={{ color: 'var(--color-text-2)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Estamos recolectando datos mediante <strong>Umami</strong>. Podés ver las visitas detalladas, origen y dispositivos en tiempo real.
            </p>
            <a 
              href="https://cloud.umami.is/share/4c670384-9047-4217-8b65-ba7e7be9f9bc/lubricentro-eden" 
              target="_blank" rel="noreferrer" className="btn btn-primary"
            >
              Ver Panel Umami Externo
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
