import { useState, useEffect } from 'react';
import { FiX, FiUser, FiPackage, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/formatters';
import { productService } from '../../services/product.service';
import { taskService } from '../../services/index';

export default function DirectServiceModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    plate: '',
    currentKm: '',
    nextChangeKm: '',
    date: new Date().toISOString().split('T')[0], // Hoy
    timeSlot: '12:00', // Horario genérico por defecto
    priority: 'medium',
    status: 'done', // CLAVE: Se envía como finalizado
    items: [],
    totalValue: 0,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    serviceData: {
      observations: '',
    }
  });

  useEffect(() => {
    if (form.currentKm) {
      const current = parseInt(form.currentKm);
      if (!isNaN(current) && !form.nextChangeKm) {
        setForm(prev => ({ ...prev, nextChangeKm: current + 10000 }));
      }
    }
  }, [form.currentKm]);

  useEffect(() => {
    if (isOpen) {
      setFetchingProducts(true);
      productService.getAll({ limit: 500 })
        .then(res => setProducts(res.data.products || []))
        .catch(err => console.error('Error cargando productos:', err))
        .finally(() => setFetchingProducts(false));
    }
  }, [isOpen]);

  const addItem = (prod) => {
    const existing = form.items.find(i => i.productId === prod._id);
    if (existing) {
      const newItems = form.items.map(i => 
        i.productId === prod._id ? { ...i, quantity: i.quantity + 1 } : i
      );
      updateItems(newItems);
    } else {
      const newItems = [...form.items, {
        productId: prod._id,
        name: prod.name,
        price: prod.price,
        quantity: 1
      }];
      updateItems(newItems);
    }
  };

  const removeItem = (prodId) => {
    const newItems = form.items.filter(i => i.productId !== prodId);
    updateItems(newItems);
  };

  const updateItems = (newItems) => {
    const total = newItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    setForm(prev => ({ ...prev, items: newItems, totalValue: total }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await taskService.create(form);
      toast.success('Servicio completado. Ingresos y stock actualizados.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al guardar el servicio');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:'600px', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <div>
            <h2 style={{ fontSize:'1.25rem', fontWeight:800, color:'var(--color-primary)' }}>Service Rápido</h2>
            <p style={{ fontSize:'0.85rem', color:'var(--color-text-3)' }}>Completa el servicio y actualiza finanzas automáticamente.</p>
          </div>
          <button onClick={onClose} style={{ color:'var(--color-text-3)' }}><FiX size={24}/></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          
          <div className="input-group">
            <label className="input-label">Título o Vehículo</label>
            <input 
              required className="input" placeholder="Ej: VW Gol - Cambio de Aceite"
              value={form.title} onChange={e => setForm({...form, title: e.target.value})}
            />
          </div>

          <div style={{ background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.2)', padding:'1rem', borderRadius:'12px', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            <h3 style={{ fontSize:'0.85rem', fontWeight:800, color:'#3b82f6', marginBottom:'0.25rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
              <FiUser size={14}/> Datos del Cliente (Opcional)
            </h3>
            <div className="input-group">
              <label className="input-label" style={{ fontSize:'0.75rem' }}>Nombre Completo</label>
              <input 
                className="input" placeholder="Ej: Juan Pérez"
                value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})}
                style={{ fontSize:'0.85rem', padding:'0.4rem 0.75rem' }}
              />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <div className="input-group">
                <label className="input-label" style={{ fontSize:'0.75rem' }}>Email</label>
                <input 
                  type="email" className="input" placeholder="juan@gmail.com"
                  value={form.customerEmail} onChange={e => setForm({...form, customerEmail: e.target.value})}
                  style={{ fontSize:'0.85rem', padding:'0.4rem 0.75rem' }}
                />
              </div>
              <div className="input-group">
                <label className="input-label" style={{ fontSize:'0.75rem' }}>Teléfono</label>
                <input 
                  className="input" placeholder="342 123456"
                  value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})}
                  style={{ fontSize:'0.85rem', padding:'0.4rem 0.75rem' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div className="input-group">
              <label className="input-label">Identificación (Patente)</label>
              <input 
                className="input" placeholder="ABC 123"
                value={form.plate} onChange={e => setForm({...form, plate: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Fecha</label>
              <input 
                type="date" required className="input"
                value={form.date} onChange={e => setForm({...form, date: e.target.value})}
              />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="input-group">
              <label className="input-label">KM Actual</label>
              <input 
                type="number" className="input" placeholder="Kilometraje"
                value={form.currentKm} onChange={e => setForm({...form, currentKm: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Próximo Cambio (KM)</label>
              <input 
                type="number" className="input"
                value={form.nextChangeKm} onChange={e => setForm({...form, nextChangeKm: e.target.value})}
              />
            </div>
          </div>

          {/* Insumos del Stock */}
          <div style={{ background:'rgba(34,197,94,0.05)', border:'1px dashed rgba(34,197,94,0.3)', padding:'1.2rem', borderRadius:'12px' }}>
            <h3 style={{ fontSize:'0.9rem', fontWeight:700, marginBottom:'0.75rem', color:'#16a34a', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <FiPackage size={16}/> Insumos Utilizados (Se descontarán del stock)
            </h3>
            
            <div style={{ marginBottom:'1rem' }}>
              <input
                type="text"
                className="input"
                placeholder="🔍 Buscar insumo..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}
              />
              <select 
                className="select" 
                style={{ fontSize:'0.85rem' }}
                onChange={(e) => {
                  const p = products.find(x => x._id === e.target.value);
                  if (p) addItem(p);
                  e.target.value = "";
                  setProductSearch("");
                }}
                disabled={fetchingProducts}
              >
                <option value="">{fetchingProducts ? 'Cargando stock...' : '++ Seleccionar Insumo/Producto'}</option>
                {products.filter(p => !form.items.some(i => i.productId === p._id))
                         .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                         .map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({formatPrice(p.price)})
                  </option>
                ))}
              </select>
            </div>

            {form.items.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {form.items.map(item => (
                  <div key={item.productId} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'0.85rem', background:'rgba(255,255,255,0.05)', padding:'0.4rem 0.6rem', borderRadius:'8px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight:600 }}>{item.name}</p>
                      <p style={{ fontSize:'0.75rem', opacity:0.7 }}>{formatPrice(item.price)} x {item.quantity}</p>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <span style={{ fontWeight:700 }}>{formatPrice(item.price * item.quantity)}</span>
                      <button type="button" onClick={() => removeItem(item.productId)} style={{ color:'#ef4444' }}>
                        <FiTrash2 size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Costo Extra Manual (Mano de obra u otros) */}
                <div style={{ marginTop:'0.5rem', display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.85rem' }}>
                  <label style={{ flex: 1, fontWeight:600 }}>Mano de obra / Extra ($):</label>
                  <input 
                    type="number" className="input" 
                    style={{ width:'120px', padding:'0.3rem' }}
                    value={form.totalValue - form.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)}
                    onChange={e => {
                      const extra = parseFloat(e.target.value) || 0;
                      const itemsTotal = form.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
                      setForm({...form, totalValue: itemsTotal + extra});
                    }}
                  />
                </div>

                <div style={{ borderTop:'1px solid rgba(0,0,0,0.1)', marginTop:'0.5rem', paddingTop:'0.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:600 }}>Total a Cobrar:</span>
                  <span style={{ fontSize:'1.1rem', fontWeight:800, color:'#16a34a' }}>{formatPrice(form.totalValue)}</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'1rem', opacity:0.5 }}>
                 <p style={{ fontSize:'0.8rem' }}>No se han agregado productos todavía.</p>
                 
                 {/* Si no hay productos, permitir ingresar total igual */}
                 <div style={{ marginTop:'1rem', display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.85rem', justifyContent:'center' }}>
                  <label style={{ fontWeight:600 }}>Total a Cobrar ($):</label>
                  <input 
                    type="number" className="input" 
                    style={{ width:'120px', padding:'0.3rem' }}
                    value={form.totalValue}
                    onChange={e => setForm({...form, totalValue: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">Observaciones y Detalles Técnicos</label>
            <textarea 
              className="input textarea" placeholder="Notas internas, estado del vehículo..."
              value={form.serviceData.observations} 
              onChange={e => setForm({...form, serviceData: {...form.serviceData, observations: e.target.value}})}
              style={{ minHeight:'60px' }}
            />
          </div>

          <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.5rem' }}>
            <button type="button" className="btn btn-ghost btn-full" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ background:'var(--color-success)' }}>
              {loading ? 'Guardando...' : 'Finalizar y Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
