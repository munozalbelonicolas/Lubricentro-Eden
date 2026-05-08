import { useState, useEffect } from 'react';
import { FiX, FiPackage, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { taskService } from '../../services/index';
import { productService } from '../../services/product.service';
import { formatPrice } from '../../utils/formatters';

export default function ServiceModal({ isOpen, onClose, task, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    status: 'done',
    currentKm: task?.currentKm || '',
    nextChangeKm: task?.nextChangeKm || '',
    serviceData: {
      oilBrand: task?.serviceData?.oilBrand || '',
      oilType:  task?.serviceData?.oilType || '',
      filterOil:  task?.serviceData?.filterOil || false,
      filterAir:  task?.serviceData?.filterAir || false,
      filterFuel: task?.serviceData?.filterFuel || false,
      filterCabin: task?.serviceData?.filterCabin || false,
      observations: task?.serviceData?.observations || '',
      photos: task?.serviceData?.photos || []
    },
    items: task?.items || [],
    totalValue: task?.totalValue || 0
  });

  const [products, setProducts] = useState([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      setForm({
        status: 'done',
        currentKm: task.currentKm || '',
        nextChangeKm: task.nextChangeKm || '',
        serviceData: {
          oilBrand: task.serviceData?.oilBrand || '',
          oilType:  task.serviceData?.oilType || '',
          filterOil:  task.serviceData?.filterOil || false,
          filterAir:  task.serviceData?.filterAir || false,
          filterFuel: task.serviceData?.filterFuel || false,
          filterCabin: task.serviceData?.filterCabin || false,
          observations: task.serviceData?.observations || '',
          photos: task.serviceData?.photos || []
        },
        items: task.items || [],
        totalValue: task.totalValue || 0
      });
    }
  }, [isOpen, task]);

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
      productService.getAll({ category: ['aceite', 'filtro'], limit: 100 })
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

  const updateQuantity = (prodId, delta) => {
    const newItems = form.items.map(i => {
      if (i.productId === prodId) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    });
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
      await taskService.update(task._id, form);
      toast.success('Servicio guardado correctamente.');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al guardar servicio');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:'550px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <div>
            <h2 style={{ fontSize:'1.25rem', fontWeight:800 }}>Ficha Técnica de Servicio</h2>
            <p style={{ fontSize:'0.85rem', color:'var(--color-text-3)' }}>Patente: {task?.plate || 'S/P'}</p>
          </div>
          <button onClick={onClose} style={{ color:'var(--color-text-3)' }}><FiX size={24}/></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
          
          {/* Kilometraje */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="input-group">
              <label className="input-label">KM Actual</label>
              <input 
                type="number" className="input" required
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
              <FiPackage size={16}/> Insumos Utilizados (Stock)
            </h3>
            
            <div style={{ marginBottom:'1rem' }}>
              <select 
                className="select" 
                style={{ fontSize:'0.85rem' }}
                onChange={(e) => {
                  const p = products.find(x => x._id === e.target.value);
                  if (p) addItem(p);
                  e.target.value = "";
                }}
                disabled={fetchingProducts}
              >
                <option value="">{fetchingProducts ? 'Cargando stock...' : '++ Seleccionar Aceite o Filtro'}</option>
                {products.filter(p => !form.items.some(i => i.productId === p._id)).map(p => (
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
                      <div style={{ display:'flex', alignItems:'center', background:'rgba(0,0,0,0.05)', borderRadius:'6px', padding:'0.1rem' }}>
                        <button type="button" onClick={() => updateQuantity(item.productId, -1)} style={{ width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center', border:'none', background:'none', cursor:'pointer' }}>-</button>
                        <span style={{ width:'25px', textAlign:'center', fontSize:'0.85rem', fontWeight:700 }}>{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.productId, 1)} style={{ width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center', border:'none', background:'none', cursor:'pointer' }}>+</button>
                      </div>
                      <span style={{ fontWeight:700, minWidth:'60px', textAlign:'right' }}>{formatPrice(item.price * item.quantity)}</span>
                      <button type="button" onClick={() => removeItem(item.productId)} style={{ color:'#ef4444' }}>
                        <FiTrash2 size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop:'1px solid rgba(0,0,0,0.1)', marginTop:'0.5rem', paddingTop:'0.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:600 }}>Total Insumos:</span>
                  <span style={{ fontSize:'1.1rem', fontWeight:800, color:'#16a34a' }}>{formatPrice(form.totalValue)}</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'1rem', opacity:0.5 }}>
                 <p style={{ fontSize:'0.8rem' }}>No se han agregado productos todavía.</p>
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div className="input-group">
            <label className="input-label">Observaciones y Detalles Técnicos</label>
            <textarea 
              className="input textarea" placeholder="Escribe notas relevantes para el próximo service..."
              value={form.serviceData.observations} 
              onChange={e => setForm({...form, serviceData: {...form.serviceData, observations: e.target.value}})}
              style={{ minHeight:'80px' }}
            />
          </div>

          <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.5rem' }}>
            <button type="button" className="btn btn-ghost btn-full" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ background:'var(--color-success)' }}>
              {loading ? 'Guardando...' : 'Guardar Historial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
