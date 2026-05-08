import { useState, useEffect } from 'react';
import { FiX, FiUser, FiPackage, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { taskService } from '../../services/index';
import { productService } from '../../services/product.service';
import { formatPrice } from '../../utils/formatters';

const TIME_SLOTS = [];
for (let h = 8; h < 12; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2,'0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2,'0')}:30`);
}
for (let h = 14; h < 18; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2,'0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2,'0')}:30`);
}
const SLOT_LABEL = TIME_SLOTS.reduce((acc, slot) => {
  acc[slot] = `${slot} hs`;
  return acc;
}, {});

export default function TaskModal({ isOpen, onClose, selectedDay, onSuccess, taskToEdit }) {
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
    date: selectedDay,
    timeSlot: '08:00',
    priority: 'medium',
    status: 'pending',
    items: [],
    totalValue: 0,
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });

  useEffect(() => {
    if (isOpen && taskToEdit) {
      setForm({
        ...taskToEdit,
        items: taskToEdit.items || [],
        totalValue: taskToEdit.totalValue || 0,
        date: taskToEdit.date || selectedDay
      });
    } else if (isOpen) {
      setForm(prev => ({ ...prev, date: selectedDay }));
    }
  }, [isOpen, taskToEdit, selectedDay]);

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
    
    // Solo validar fecha si es una tarea nueva
    if (!taskToEdit) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const selectedDate = new Date(form.date + 'T12:00:00');
      if (selectedDate < today) {
        return toast.error('No podés agendar tareas en fechas pasadas.');
      }
    }

    setLoading(true);
    try {
      if (taskToEdit) {
        await taskService.update(taskToEdit._id, form);
        toast.success('Tarea actualizada');
      } else {
        await taskService.create({ ...form, status: 'pending' });
        toast.success('Tarea agendada con éxito');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al procesar la tarea');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:'550px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <h2 style={{ fontSize:'1.25rem', fontWeight:800 }}>{taskToEdit ? 'Editar Tarea' : 'Agendar Tarea Manual'}</h2>
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
              <FiUser size={14}/> Datos del Cliente (Para Historial y Email)
            </h3>
            <div className="input-group">
              <label className="input-label" style={{ fontSize:'0.75rem' }}>Nombre Completo</label>
              <input 
                required className="input" placeholder="Ej: Juan Pérez"
                value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})}
                style={{ fontSize:'0.85rem', padding:'0.4rem 0.75rem' }}
              />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <div className="input-group">
                <label className="input-label" style={{ fontSize:'0.75rem' }}>Email</label>
                <input 
                  required type="email" className="input" placeholder="juan@gmail.com"
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

          <div className="input-group">
            <label className="input-label">Descripción / Notas</label>
            <textarea 
              className="input textarea" placeholder="Detalles del trabajo..."
              value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              style={{ minHeight: '60px' }}
            />
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
              <label className="input-label">KM Actual</label>
              <input 
                type="number" className="input" placeholder="Kilometraje"
                value={form.currentKm} onChange={e => setForm({...form, currentKm: e.target.value})}
              />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div className="input-group">
              <label className="input-label">Fecha</label>
              <input 
                type="date" required className="input"
                value={form.date} onChange={e => setForm({...form, date: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Turno</label>
              <select 
                className="select" value={form.timeSlot}
                onChange={e => setForm({...form, timeSlot: e.target.value})}
              >
                {Object.entries(SLOT_LABEL).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ background:'rgba(203,26,32,0.05)', border:'1px dashed var(--color-primary-glow)', padding:'1.2rem', borderRadius:'12px' }}>
            <h3 style={{ fontSize:'0.9rem', fontWeight:700, marginBottom:'0.75rem', color:'var(--color-primary)', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <FiPackage size={16}/> Selección de Insumos (Opcional)
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
                <option value="">{fetchingProducts ? 'Cargando stock...' : '++ Seleccionar Aceite o Filtro'}</option>
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
              <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                {form.items.map(item => (
                  <div key={item.productId} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'0.85rem', background:'rgba(255,255,255,0.03)', padding:'0.4rem 0.6rem', borderRadius:'8px' }}>
                    <span>{item.name} <span style={{ opacity:0.6 }}>x{item.quantity}</span></span>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                      <div style={{ display:'flex', alignItems:'center', background:'rgba(0,0,0,0.05)', borderRadius:'4px', padding:'0.05rem' }}>
                        <button type="button" onClick={() => updateQuantity(item.productId, -1)} style={{ width:'20px', height:'20px', border:'none', background:'none', cursor:'pointer' }}>-</button>
                        <span style={{ width:'25px', textAlign:'center', fontSize:'0.75rem' }}>{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.productId, 1)} style={{ width:'20px', height:'20px', border:'none', background:'none', cursor:'pointer' }}>+</button>
                      </div>
                      <span style={{ fontWeight:700 }}>{formatPrice(item.price * item.quantity)}</span>
                      <button type="button" onClick={() => removeItem(item.productId)} style={{ color:'#ef4444' }}>
                        <FiTrash2 size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop:'1px solid rgba(203,26,32,0.1)', marginTop:'0.5rem', paddingTop:'0.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:600 }}>Presupuesto Estimado:</span>
                  <span style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--color-primary)' }}>{formatPrice(form.totalValue)}</span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize:'0.75rem', color:'var(--color-text-3)', textAlign:'center' }}>Sin productos seleccionados todavía.</p>
            )}
          </div>

          <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.5rem' }}>
            <button type="button" className="btn btn-ghost btn-full" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Procesando...' : (taskToEdit ? 'Guardar Cambios' : 'Confirmar Agenda')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
