import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { financeService } from '../../services/finance.service';
import { productService } from '../../services/product.service';
import { formatPrice, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { 
  FiDollarSign, FiPlus, FiTrash2, FiArrowUpCircle, FiArrowDownCircle, 
  FiFilter, FiPackage, FiTool, FiCalendar, FiX, FiSearch, FiShoppingCart,
  FiFileText
} from 'react-icons/fi';

export default function FinancePage() {
  const [stats, setStats] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, ingreso, egreso

  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState(''); // '' es todos
  const [year, setYear] = useState(currentYear.toString());

  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'otros',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, [month, year]);

  // Bloquear el scroll del background si el modal está abierto
  useEffect(() => {
    if (showModal || showSaleModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [showModal, showSaleModal]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { year };
      if (month) params.month = month;

      const [statsData, transData] = await Promise.all([
        financeService.getStats(params),
        financeService.getTransactions(params)
      ]);
      setStats(statsData.data);
      setTransactions(transData.data.transactions);
    } catch (err) {
      toast.error('Error al cargar datos financieros');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await financeService.createExpense(expenseForm);
      toast.success('Gasto registrado con éxito');
      setShowModal(false);
      setExpenseForm({ description: '', amount: '', category: 'otros', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err) {
      toast.error('Error al registrar gasto');
    }
  };

  const handleDeleteTransaction = async (t) => {
    if (!window.confirm('¿Eliminar este registro? Tene en cuenta que si es una venta local o un egreso se restaurará el stock si corresponde.')) return;
    setDeletingId(t.id);
    try {
      if (t.source === 'venta_local') {
        await financeService.deleteLocalSale(t.id);
      } else {
        await financeService.deleteExpense(t.id);
      }
      toast.success('Registro eliminado');
      fetchData();
    } catch (err) {
      toast.error('Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTransactions = transactions.filter(t => 
    filterType === 'all' ? true : t.type === filterType
  );

  return (
    <div className="page">
      <div className="container">
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Módulo de Finanzas</h1>
            <p style={{ color: 'var(--color-text-3)' }}>Seguimiento general de ingresos y egresos</p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Filtros de Fecha */}
            <div style={{ display: 'flex', background: 'var(--color-bg-2)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <select 
                className="select" 
                value={month} 
                onChange={(e) => setMonth(e.target.value)}
                style={{ background: 'transparent', border: 'none', fontSize: '0.85rem', padding: '0.4rem' }}
              >
                <option value="">Todos los meses</option>
                <option value="1">Enero</option>
                <option value="2">Febrero</option>
                <option value="3">Marzo</option>
                <option value="4">Abril</option>
                <option value="5">Mayo</option>
                <option value="6">Junio</option>
                <option value="7">Julio</option>
                <option value="8">Agosto</option>
                <option value="9">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
              </select>
              <div style={{ width: '1px', background: 'var(--color-border)', margin: '0.2rem 0' }} />
              <select 
                className="select" 
                value={year} 
                onChange={(e) => setYear(e.target.value)}
                style={{ background: 'transparent', border: 'none', fontSize: '0.85rem', padding: '0.4rem' }}
              >
                {[currentYear, currentYear-1, currentYear-2].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button onClick={() => setShowSaleModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#22c55e', borderColor: '#22c55e' }}>
              <FiShoppingCart /> Venta Local
            </button>

            <Link to="/dashboard/local-sales" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <FiFileText /> Ver Historial
            </Link>

            <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiPlus /> Cargar Egreso
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card" style={{ borderLeft: '4px solid #22c55e' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-3)', fontWeight: 600 }}>Caja Total (Ingresos)</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e', marginTop: '0.5rem' }}>
              {formatPrice(stats.totalIncome)}
            </h2>
            <p style={{ fontSize: '0.75rem', marginTop: '0.4rem', opacity: 0.7 }}>Ventas web, local y servicios</p>
          </div>
          <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-3)', fontWeight: 600 }}>Egresos Totales</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', marginTop: '0.5rem' }}>
              {formatPrice(stats.totalExpenses)}
            </h2>
            <p style={{ fontSize: '0.75rem', marginTop: '0.4rem', opacity: 0.7 }}>Gastos operativos y sueldos</p>
          </div>
          <div className="card" style={{ borderLeft: '4px solid var(--color-primary)', background: 'var(--color-bg-2)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-3)', fontWeight: 600 }}>Balance Neto (Ganancia)</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.5rem' }}>
              {formatPrice(stats.balance)}
            </h2>
            <p style={{ fontSize: '0.75rem', marginTop: '0.4rem', opacity: 0.7 }}>Rentabilidad actual del taller</p>
          </div>
        </div>

        {/* Transactions List */}
        <div className="card" style={{ padding: '0' }}>
          <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-bg-2)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Libro Diario de Transacciones</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setFilterType('all')} className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-ghost'}`}>Todas</button>
              <button onClick={() => setFilterType('ingreso')} className={`btn btn-sm ${filterType === 'ingreso' ? 'btn-primary' : 'btn-ghost'}`}>Ingresos</button>
              <button onClick={() => setFilterType('egreso')} className={`btn btn-sm ${filterType === 'egreso' ? 'btn-primary' : 'btn-ghost'}`}>Egresos</button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Concepto</th>
                  <th>Origen/Categoría</th>
                  <th>Monto</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>Cargando movimientos...</td></tr>
                ) : filteredTransactions.length === 0 ? (
                   <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>No se encontraron transacciones.</td></tr>
                ) : filteredTransactions.map((t) => (
                  <tr key={`${t.id}-${t.type}`}>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(t.date).toLocaleDateString('es-AR')}</td>
                    <td>
                      <span style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.4rem', 
                        fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                        color: t.type === 'ingreso' ? '#22c55e' : '#ef4444' 
                      }}>
                        {t.type === 'ingreso' ? <FiArrowUpCircle size={14}/> : <FiArrowDownCircle size={14}/>}
                        {t.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{t.description}</td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                        background: 'var(--color-bg-2)', color: 'var(--color-text-2)'
                      }}>
                        {t.source === 'venta_web' ? '🛒 Web' : t.source === 'taller' ? '🔧 Taller' : t.source === 'venta_local' ? '🏠 Local' : `📉 ${t.source}`}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, color: t.type === 'ingreso' ? '#22c55e' : '#ef4444' }}>
                      {t.type === 'ingreso' ? '+' : '-'}{formatPrice(t.amount)}
                    </td>
                    <td>
                      {(t.type === 'egreso' || t.source === 'venta_local') && (
                        <button 
                          onClick={() => handleDeleteTransaction(t)} 
                          style={{ color: '#ef4444', opacity: deletingId === t.id ? 0.3 : 0.7 }}
                          disabled={deletingId === t.id}
                        >
                          {deletingId === t.id ? <div className="spinner" style={{ width: 16, height: 16 }}/> : <FiTrash2 size={16}/>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Egreso */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Registrar Nuevo Egreso</h2>
              <button onClick={() => setShowModal(false)}><FiX size={24}/></button>
            </div>

            <form onSubmit={handleCreateExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Descripción del gasto</label>
                <input 
                  className="input" required placeholder="Ej: Pago de alquiler, Repuestos..."
                  value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Monto ($)</label>
                <input 
                  type="number" className="input" required placeholder="0.00"
                  value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Categoría</label>
                <select 
                  className="select" value={expenseForm.category}
                  onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                >
                  <option value="insumos">Insumos/Mercadería</option>
                  <option value="servicios">Servicios (Luz/Agua/Luz)</option>
                  <option value="alquiler">Alquiler</option>
                  <option value="sueldos">Sueldos / Adelantos</option>
                  <option value="herramientas">Herramientas/Maquinaria</option>
                  <option value="impuestos">Impuestos/Tasas</option>
                  <option value="otros">Otros Gastos</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Fecha</label>
                <input 
                  type="date" className="input" required
                  value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost btn-full" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary btn-full">Guardar Egreso</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Venta Local */}
      {showSaleModal && (
        <LocalSaleModal 
          onClose={() => setShowSaleModal(false)}
          onSuccess={() => {
            setShowSaleModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

/* ─── Sub-componente Modal Venta Local ─── */
function LocalSaleModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [fetchingProducts, setFetchingProducts] = useState(false);
  
  const [form, setForm] = useState({
    description: '',
    date: new Date().toISOString().split('T')[0],
    items: []
  });

  useEffect(() => {
    if (productSearch.length > 2) {
      const delayDebounceFn = setTimeout(() => {
        searchProducts();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setProducts([]);
    }
  }, [productSearch]);

  const searchProducts = async () => {
    setFetchingProducts(true);
    try {
      const res = await productService.getAll({ search: productSearch, limit: 10 });
      setProducts(res.data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingProducts(false);
    }
  };

  const addItem = (p) => {
    const existing = form.items.find(i => i.productId === p._id);
    if (existing) return toast.error('El producto ya está en la lista');

    setForm({
      ...form,
      items: [...form.items, {
        productId: p._id,
        name: p.name,
        price: p.price,
        quantity: 1
      }]
    });
    setProductSearch('');
    setProducts([]);
  };

  const removeItem = (id) => {
    setForm({ ...form, items: form.items.filter(i => i.productId !== id) });
  };

  const updateItem = (id, field, value) => {
    setForm({
      ...form,
      items: form.items.map(i => i.productId === id ? { ...i, [field]: Number(value) } : i)
    });
  };

  const total = form.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.length === 0) return toast.error('Agregá al menos un producto');
    
    setLoading(true);
    try {
      await financeService.createLocalSale(form);
      toast.success('Venta registrada con éxito');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrar venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Registrar Venta Local</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-3)' }}>Se descontará stock automáticamente</p>
          </div>
          <button onClick={onClose}><FiX size={24}/></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div className="input-group" style={{ position: 'relative' }}>
            <label className="input-label">Buscar Productos</label>
            <div style={{ position: 'relative' }}>
              <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}/>
              <input 
                className="input" placeholder="Nombre o marca del producto..."
                style={{ paddingLeft: '2.5rem' }}
                value={productSearch} onChange={e => setProductSearch(e.target.value)}
              />
            </div>
            
            {/* Resultados de búsqueda */}
            {products.length > 0 && (
              <div style={{ 
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: '8px', marginTop: '0.5rem', boxShadow: 'var(--shadow-lg)',
                maxHeight: '200px', overflowY: 'auto', backdropFilter: 'blur(10px)'
              }}>
                {products.map(p => (
                  <div 
                    key={p._id} onClick={() => addItem(p)}
                    style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--color-bg-2)', display: 'flex', justifyContent: 'space-between' }}
                  >
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</p>
                      <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Stock: {p.stock}</p>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatPrice(p.price)}</span>
                  </div>
                ))}
              </div>
            )}
            {fetchingProducts && <div style={{ fontSize: '0.75rem', marginTop: '0.4rem', opacity: 0.5 }}>Buscando...</div>}
          </div>

          {/* Tabla de Items */}
          <div style={{ background: 'var(--color-bg-2)', borderRadius: '12px', padding: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiPackage size={16}/> Productos en Venta
            </h3>
            
            {form.items.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '1rem', fontSize: '0.85rem', opacity: 0.5 }}>Sin productos seleccionados</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {form.items.map(item => (
                  <div key={item.productId} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 30px', gap: '0.5rem', alignItems: 'center' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }} title={item.name}>{item.name}</p>
                    <input 
                      type="number" className="input" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                      value={item.quantity} onChange={e => updateItem(item.productId, 'quantity', e.target.value)}
                      min="1"
                    />
                    <input 
                      type="number" className="input" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                      value={item.price} onChange={e => updateItem(item.productId, 'price', e.target.value)}
                    />
                    <button type="button" onClick={() => removeItem(item.productId)} style={{ color: '#ef4444' }}><FiTrash2/></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">Descripción / Notas (Opcional)</label>
            <input 
              className="input" placeholder="Ej: Cliente ocasional, descuento por bulto..."
              value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Fecha</label>
            <input 
              type="date" className="input" required
              value={form.date} onChange={e => setForm({...form, date: e.target.value})}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Total Venta</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#22c55e' }}>{formatPrice(total)}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading || form.items.length === 0} style={{ background: '#22c55e', borderColor: '#22c55e' }}>
                {loading ? 'Procesando...' : 'Finalizar Venta'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
