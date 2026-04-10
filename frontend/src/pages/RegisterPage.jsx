import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import toast from 'react-hot-toast';
import { 
  FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiMapPin, 
  FiSmartphone, FiCreditCard, FiCalendar 
} from 'react-icons/fi';
import { getImageUrl } from '../utils/formatters';
import styles from './AuthPage.module.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const { tenant }   = useTenant();
  const navigate     = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
    document: '',
    birthDate: '',
    phone: '',
    address: {
      street: '',
      number: '',
      floor: '',
      apartment: '',
      city: '',
      province: '',
      zipCode: ''
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setForm(f => ({
        ...f,
        address: { ...f.address, [field]: value }
      }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.password !== form.confirm) {
      return toast.error('Las contraseñas no coinciden.');
    }

    setLoading(true);
    try {
      // Enviamos el objeto form completo exceptuando 'confirm'
      const { confirm, ...submitData } = form;
      await register(submitData);
      toast.success('¡Registro casi listo! Verificá tu email para activar la cuenta.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Error al registrarse.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={`${styles.card} ${styles.cardWide}`} style={{ maxWidth: '800px' }}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <img 
              src={tenant?.config?.logo ? getImageUrl(tenant.config.logo) : '/logos/Logo-Eden.png'} 
              alt={tenant?.name || 'Logo Eden'} 
            />
          </div>
          <h1 className={styles.title}>Creá tu cuenta</h1>
          <p className={styles.subtitle}>Completá tus datos para una experiencia personalizada</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          
          {/* SECCIÓN 1: DATOS PERSONALES */}
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            1. Datos Personales
          </h3>
          
          <div className={styles.twoCol}>
            <div className="input-group">
              <label className="input-label">Nombre</label>
              <div className={styles.inputWrapper}>
                <FiUser className={styles.inputIcon} />
                <input className={`input ${styles.inputWithIcon}`} type="text" name="firstName" placeholder="Ej: Juan" value={form.firstName} onChange={handleChange} required />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Apellido</label>
              <div className={styles.inputWrapper}>
                <FiUser className={styles.inputIcon} />
                <input className={`input ${styles.inputWithIcon}`} type="text" name="lastName" placeholder="Ej: García" value={form.lastName} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div className={styles.twoCol}>
            <div className="input-group">
              <label className="input-label">Documento (DNI/CUIL)</label>
              <div className={styles.inputWrapper}>
                <FiCreditCard className={styles.inputIcon} />
                <input 
                  className={`input ${styles.inputWithIcon}`} 
                  type="text" name="document" 
                  placeholder="Solo números" 
                  value={form.document} 
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); // Solo números
                    setForm({...form, document: val});
                  }} 
                  required 
                />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Fecha de Nacimiento</label>
              <div className={styles.inputWrapper}>
                <FiCalendar className={styles.inputIcon} />
                <input className={`input ${styles.inputWithIcon}`} type="date" name="birthDate" value={form.birthDate} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div className={styles.twoCol}>
            <div className="input-group">
              <label className="input-label">Email</label>
              <div className={styles.inputWrapper}>
                <FiMail className={styles.inputIcon} />
                <input className={`input ${styles.inputWithIcon}`} type="email" name="email" placeholder="tu@email.com" value={form.email} onChange={handleChange} required />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Celular</label>
              <div className={styles.inputWrapper}>
                <FiSmartphone className={styles.inputIcon} />
                <input className={`input ${styles.inputWithIcon}`} type="tel" name="phone" placeholder="Ej: 1123456789" value={form.phone} onChange={handleChange} required />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DOMICILIO */}
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            2. Domicilio de Facturación/Envío
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Calle</label>
              <div className={styles.inputWrapper}>
                <FiMapPin className={styles.inputIcon} />
                <input className={`input ${styles.inputWithIcon}`} type="text" name="address.street" placeholder="Ej: Av. Rivadavia" value={form.address.street} onChange={handleChange} required />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Número</label>
              <input className="input" type="text" name="address.number" placeholder="123" value={form.address.number} onChange={handleChange} required />
            </div>
          </div>

          <div className={styles.twoCol} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="input-group">
              <label className="input-label">Piso (Opcel.)</label>
              <input className="input" type="text" name="address.floor" placeholder="2" value={form.address.floor} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label className="input-label">Depto (Opcel.)</label>
              <input className="input" type="text" name="address.apartment" placeholder="B" value={form.address.apartment} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label className="input-label">Cod. Postal</label>
              <input className="input" type="text" name="address.zipCode" placeholder="1406" value={form.address.zipCode} onChange={handleChange} required />
            </div>
          </div>

          <div className={styles.twoCol}>
            <div className="input-group">
              <label className="input-label">Localidad</label>
              <input className="input" type="text" name="address.city" placeholder="Ej: CABA" value={form.address.city} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label className="input-label">Provincia</label>
              <input className="input" type="text" name="address.province" placeholder="Ej: Buenos Aires" value={form.address.province} onChange={handleChange} required />
            </div>
          </div>

          {/* SECCIÓN 3: SEGURIDAD */}
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            3. Seguridad
          </h3>

          <div className={styles.twoCol}>
            <div className="input-group">
              <label className="input-label">Contraseña</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} />
                <input className={`input ${styles.inputWithIcon}`} type={showPass ? 'text' : 'password'} name="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={handleChange} required />
                <button type="button" className={styles.togglePass} onClick={() => setShowPass(!showPass)}>
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Confirmar Contraseña</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} />
                <input className={`input ${styles.inputWithIcon}`} type={showPass ? 'text' : 'password'} name="confirm" placeholder="Repetí la contraseña" value={form.confirm} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: '2rem' }} disabled={loading}>
            {loading ? <span className="spinner" /> : '🚀 Registrarme y Validar Email'}
          </button>
        </form>

        <p className={styles.footer}>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className={styles.link}>Iniciá sesión</Link>
        </p>
      </div>
    </div>
  );
}
