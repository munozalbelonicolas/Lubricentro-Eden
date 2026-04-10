import { useState, useEffect } from 'react';
import { userService } from '../../services/user.service';
import { formatPrice, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { 
  FiUser, FiMail, FiPhone, FiSearch, FiTrash2, 
  FiLock, FiUserPlus, FiActivity, FiX, FiCheckCircle, FiSlash, FiEdit2 
} from 'react-icons/fi';
import styles from './UsersAdmin.module.css';

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modales
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(null); // guardará el usuario a editar
  const [showHistory, setShowHistory] = useState(null);
  const [showPassModal, setShowPassModal] = useState(null);
  
  // Data de formularios
  const [newUserData, setNewUserData] = useState({
    firstName: '', lastName: '', email: '', document: '', phone: '', role: 'user',
    address: { street: '', number: '', city: '', province: '', zipCode: '' }
  });
  const [editUserData, setEditUserData] = useState({});
  const [newPass, setNewPass] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data.data.users);
    } catch (err) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await userService.toggleStatus(user._id);
      toast.success(user.isActive ? 'Usuario bloqueado' : 'Usuario desbloqueado');
      fetchUsers();
    } catch (err) {
      toast.error('No se pudo cambiar el estado');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${user.firstName}? Esta acción no se puede deshacer.`)) return;
    try {
      await userService.deleteUser(user._id);
      toast.success('Usuario eliminado');
      fetchUsers();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await userService.createUser(newUserData);
      toast.success('Usuario creado. Se envió email con password temporal.');
      setShowCreate(false);
      setNewUserData({ firstName: '', lastName: '', email: '', document: '', phone: '', role: 'user', address: { street: '', number: '', city: '', province: '', zipCode: '' } });
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Error al crear usuario');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await userService.updateUser(showEdit._id, editUserData);
      toast.success('Usuario actualizado');
      setShowEdit(null);
      fetchUsers();
    } catch (err) {
      toast.error('Error al actualizar');
    }
  };

  const openEdit = (user) => {
    setShowEdit(user);
    setEditUserData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      document: user.document,
      phone: user.phone,
      role: user.role
    });
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      await userService.updatePassword(showPassModal._id, newPass);
      toast.success('Contraseña actualizada');
      setShowPassModal(null);
      setNewPass('');
    } catch (err) {
      toast.error('Error al actualizar contraseña');
    }
  };

  const handleViewHistory = async (user) => {
    setShowHistory(user);
    setLoadingHistory(true);
    try {
      const data = await userService.getUserOrders(user._id);
      setHistory(data.data.orders);
    } catch (err) {
      toast.error('Error al cargar historial');
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredUsers = users.filter(u => 
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.document?.includes(search)
  );

  return (
    <div className="page">
      <div className="container">
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Gestión de Usuarios</h1>
            <p className={styles.subtitle}>Administrá tus clientes y personal</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <FiUserPlus /> Nuevo Usuario
          </button>
        </header>

        {/* Barra de búsqueda */}
        <div className={styles.searchBar}>
          <FiSearch className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, email o documento..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>DNI / Email</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner mr-auto ml-auto" /></td></tr>
              ) : filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className={styles.userInfo}>
                      <div className={styles.avatar}>
                        {(user.firstName?.[0] || 'U')}{(user.lastName?.[0] || '')}
                      </div>
                      <div>
                        <p className={styles.userName}>{user.firstName} {user.lastName}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-3)' }}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.roleBadge} data-role={user.role}>
                      {user.role?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <p style={{ margin: 0, fontWeight: 500 }}>{user.document || '---'}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-3)' }}>{user.phone || 'Sin télefono'}</p>
                  </td>
                  <td>
                    <span className={`badge badge-${user.isActive ? 'success' : 'error'}`}>
                      {user.isActive ? 'Activo' : 'Bloqueado'}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    <button title="Ver Historial" onClick={() => handleViewHistory(user)}><FiActivity /></button>
                    <button title="Editar Perfil" onClick={() => openEdit(user)}><FiEdit2 /></button>
                    <button title="Cambiar Password" onClick={() => setShowPassModal(user)}><FiLock /></button>
                    <button title={user.isActive ? 'Bloquear' : 'Desbloquear'} onClick={() => handleToggleStatus(user)}>
                      {user.isActive ? <FiSlash /> : <FiCheckCircle />}
                    </button>
                    <button title="Eliminar" onClick={() => handleDelete(user)} style={{ color: 'var(--color-error)' }}><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL CREAR USUARIO */}
        {showCreate && (
          <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h3>Crear Nuevo Usuario</h3>
                <button onClick={() => setShowCreate(false)}><FiX /></button>
              </div>
              <form onSubmit={handleCreateUser} className={styles.modalBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>Nombre</label>
                    <input className="input" type="text" required onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Apellido</label>
                    <input className="input" type="text" required onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>Email</label>
                    <input className="input" type="email" required onChange={(e) => setNewUserData({...newUserData, email: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Perfil / Rol</label>
                    <select className="select" value={newUserData.role} onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}>
                      <option value="user">Cliente</option>
                      <option value="admin">Administrador</option>
                      <option value="vendedor">Vendedor</option>
                      <option value="caja">Caja</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>Documento</label>
                    <input className="input" type="text" onChange={(e) => setNewUserData({...newUserData, document: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Teléfono</label>
                    <input className="input" type="text" onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})} />
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-3)', fontStyle: 'italic' }}>
                  * Se enviará un email con una contraseña temporal.
                </p>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">Crear Usuario</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EDITAR USUARIO */}
        {showEdit && (
          <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h3>Editar Perfil: {showEdit.firstName}</h3>
                <button onClick={() => setShowEdit(null)}><FiX /></button>
              </div>
              <form onSubmit={handleEditUser} className={styles.modalBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>Nombre</label>
                    <input className="input" type="text" value={editUserData.firstName} onChange={(e) => setEditUserData({...editUserData, firstName: e.target.value})} required />
                  </div>
                  <div className="input-group">
                    <label>Apellido</label>
                    <input className="input" type="text" value={editUserData.lastName} onChange={(e) => setEditUserData({...editUserData, lastName: e.target.value})} required />
                  </div>
                </div>
                <div className="input-group">
                  <label>Email</label>
                  <input className="input" type="email" value={editUserData.email} onChange={(e) => setEditUserData({...editUserData, email: e.target.value})} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>Perfil / Rol</label>
                    <select className="select" value={editUserData.role} onChange={(e) => setEditUserData({...editUserData, role: e.target.value})}>
                      <option value="user">Cliente</option>
                      <option value="admin">Administrador</option>
                      <option value="vendedor">Vendedor</option>
                      <option value="caja">Caja</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Documento</label>
                    <input className="input" type="text" value={editUserData.document} onChange={(e) => setEditUserData({...editUserData, document: e.target.value})} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Teléfono</label>
                  <input className="input" type="text" value={editUserData.phone} onChange={(e) => setEditUserData({...editUserData, phone: e.target.value})} />
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">Guardar Cambios</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL HISTORIAL UNIFICADO */}
        {showHistory && (
          <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '900px' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className={styles.avatar} style={{ width: 40, height: 40, fontSize: '0.9rem' }}>
                    {(showHistory.firstName?.[0] || 'U')}{(showHistory.lastName?.[0] || '')}
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>Historial Clínico: {showHistory.firstName} {showHistory.lastName}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-3)' }}>Seguimiento unificado de taller y tienda</p>
                  </div>
                </div>
                <button onClick={() => setShowHistory(null)}><FiX size={24}/></button>
              </div>
              <div className={styles.modalBody} style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1.5rem' }}>
                {loadingHistory ? (
                  <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner" /></div>
                ) : (
                  history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                      <FiActivity size={48} style={{ marginBottom: '1rem' }} />
                      <p>No hay registros de actividad para este usuario.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {history.map((item, idx) => (
                        <div key={idx} className="card" style={{ 
                          padding: '1.25rem', 
                          borderLeft: item._type === 'order' ? '4px solid #f59e0b' : '4px solid #3b82f6',
                          background: 'var(--color-bg-2)'
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                                <span style={{ 
                                  fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '4px',
                                  background: item._type === 'order' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
                                  color: item._type === 'order' ? '#f59e0b' : '#3b82f6'
                                }}>
                                  {item._type === 'order' ? 'Tienda Web' : 'Servicio Taller'}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-3)' }}>
                                  {formatDateTime(item.createdAt || item.date)}
                                </span>
                              </div>
                              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                                {item.title || (item._type === 'order' ? `Pedido #${item.orderNumber}` : 'Servicio Técnico')}
                              </h4>
                              {item.plate && <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-2)' }}>🚗 Patente: <strong>{item.plate}</strong></p>}
                              
                              <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {(item.items || []).map((prod, i) => (
                                  <span key={i} style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    {prod.name} <small style={{ opacity: 0.6 }}>x{prod.quantity}</small>
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text)' }}>
                                {formatPrice(item.totalValue || item.total)}
                              </p>
                              {item.currentKm && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-3)', fontWeight: 600 }}>{item.currentKm.toLocaleString()} KM</p>}
                              <span style={{ 
                                marginTop: '0.5rem', display: 'inline-block',
                                fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: '999px',
                                background: 'rgba(34,197,94,0.1)', color: '#22c55e'
                              }}>
                                {item.status?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL RESET PASSWORD */}
        {showPassModal && (
          <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <h3>Reset de Contraseña</h3>
                <button onClick={() => setShowPassModal(null)}><FiX /></button>
              </div>
              <form onSubmit={handleUpdatePassword} className={styles.modalBody}>
                <p>Ingresá la nueva contraseña para <strong>{showPassModal.firstName}</strong>:</p>
                <div className="input-group">
                  <input 
                    className="input" 
                    type="password" 
                    placeholder="Nueva contraseña" 
                    value={newPass} 
                    onChange={(e) => setNewPass(e.target.value)} 
                    required 
                  />
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">Guardar Cambios</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
