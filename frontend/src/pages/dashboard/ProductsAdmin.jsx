import { useState, useEffect, useRef } from 'react';
import { productService } from '../../services/product.service';
import { formatPrice, categoryLabel, getImageUrl } from '../../utils/formatters';
import toast from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiUpload, FiSearch,
} from 'react-icons/fi';
import styles from './ProductsAdmin.module.css';

const CATEGORIES = Object.entries(categoryLabel);
const EMPTY_FORM = {
  name: '', description: '', category: '', brand: '', price: '', stock: '',
  viscosity: '', capacity: '', sku: '', vehicleCompatibility: '', featured: false,
};

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]   = useState(null); // null = crear, obj = editar
  const [form, setForm]         = useState(EMPTY_FORM);
  const [files, setFiles]       = useState([]);
  const [saving, setSaving]     = useState(false);
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll({ limit: 100, search: search || undefined });
      setProducts(data.data.products || []);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setForm(EMPTY_FORM); setFiles([]); setEditing(null); setModalOpen(true); };
  const openEdit   = (p)  => {
    setForm({
      name: p.name, description: p.description, category: p.category,
      brand: p.brand, price: p.price, stock: p.stock,
      viscosity: p.viscosity, capacity: p.capacity, sku: p.sku,
      vehicleCompatibility: (p.vehicleCompatibility || []).join(', '),
      featured: p.featured, isActive: p.isActive,
    });
    setFiles([]);
    setEditing(p);
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append('images', f));

      if (editing) {
        await productService.update(editing._id, fd);
        toast.success('Producto actualizado.');
      } else {
        await productService.create(fd);
        toast.success('Producto creado.');
      }
      closeModal();
      load();
    } catch (err) {
      toast.error(err.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await productService.delete(id);
      toast.success('Producto eliminado.');
      load();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="page">
      <div className="container">
        <div className={styles.header}>
          <h1 className="section-title">Productos</h1>
          <button className="btn btn-primary" onClick={openCreate}>
            <FiPlus size={16} /> Nuevo Producto
          </button>
        </div>

        {/* Search */}
        <div className={styles.searchBar}>
          <FiSearch size={16} className={styles.searchIcon} />
          <input
            className={`input ${styles.searchInput}`}
            placeholder="Buscar por nombre, marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner" /></div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-3)' }}>
                    Sin productos. Creá el primero.
                  </td></tr>
                ) : products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className={styles.productCell}>
                        <div className={styles.productThumb}>
                          {p.images?.[0] ? <img src={getImageUrl(p.images[0])} alt={p.name} /> : <span>🔧</span>}
                        </div>
                        <div>
                          <p className={styles.productName}>{p.name}</p>
                          {p.brand && <p className={styles.productBrand}>{p.brand}</p>}
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-primary">{categoryLabel[p.category] || p.category}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatPrice(p.price)}</td>
                    <td>
                      <span className={`badge ${p.stock === 0 ? 'badge-error' : p.stock <= 5 ? 'badge-warning' : 'badge-success'}`}>
                        {p.stock} u.
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.isActive ? 'badge-success' : 'badge-neutral'}`}>
                        {p.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} aria-label="Editar">
                          <FiEdit2 size={14} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)} aria-label="Eliminar">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <p className={styles.modalTitle}>{editing ? 'Editar Producto' : 'Nuevo Producto'}</p>
                <button className={styles.closeBtn} onClick={closeModal}><FiX size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.twoCol}>
                  <div className="input-group">
                    <label className="input-label">Nombre *</label>
                    <input className="input" name="name" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Categoría *</label>
                    <select className="select" name="category" value={form.category} onChange={handleChange} required>
                      <option value="">Seleccionar...</option>
                      {CATEGORIES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Marca</label>
                    <input className="input" name="brand" value={form.brand} onChange={handleChange} placeholder="Mobil, Shell..." />
                  </div>
                  <div className="input-group">
                    <label className="input-label">SKU</label>
                    <input className="input" name="sku" value={form.sku} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Precio *</label>
                    <input className="input" name="price" type="number" min="0" value={form.price} onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Stock</label>
                    <input className="input" name="stock" type="number" min="0" value={form.stock} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Viscosidad (aceites)</label>
                    <input className="input" name="viscosity" value={form.viscosity} onChange={handleChange} placeholder="10W40" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Capacidad</label>
                    <input className="input" name="capacity" value={form.capacity} onChange={handleChange} placeholder="1L, 4L..." />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Compatibilidad de vehículo (separar por coma)</label>
                  <input className="input" name="vehicleCompatibility" value={form.vehicleCompatibility}
                    onChange={handleChange} placeholder="Toyota Corolla, Honda Civic..." />
                </div>

                <div className="input-group">
                  <label className="input-label">Descripción</label>
                  <textarea className="input textarea" name="description" value={form.description}
                    onChange={handleChange} rows={3} />
                </div>

                <div className={styles.checkRow}>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" name="featured" checked={!!form.featured} onChange={handleChange} />
                    Producto destacado
                  </label>
                  {editing && (
                    <label className={styles.checkLabel}>
                      <input type="checkbox" name="isActive" checked={form.isActive !== false} onChange={handleChange} />
                      Activo
                    </label>
                  )}
                </div>

                {/* Upload */}
                <div className={styles.uploadArea} onClick={() => fileRef.current?.click()}>
                  <FiUpload size={20} />
                  <p>{files.length > 0 ? `${files.length} imagen(es) seleccionada(s)` : 'Click para agregar imágenes (max 5)'}</p>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 5))}
                  />
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : editing ? 'Actualizar' : 'Crear Producto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
