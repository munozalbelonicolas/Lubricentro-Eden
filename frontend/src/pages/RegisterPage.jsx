import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import { GoogleLogin } from '@react-oauth/google';
import SEOHead from '../components/seo/SEOHead';
import toast from 'react-hot-toast';
import { 
  FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiMapPin, 
  FiSmartphone, FiCreditCard, FiCalendar 
} from 'react-icons/fi';
import { getImageUrl } from '../utils/formatters';
import styles from './AuthPage.module.css';

export default function RegisterPage() {
  const { register, loginWithGoogle, registerWithGoogle } = useAuth();
  const { tenant }   = useTenant();
  const navigate     = useNavigate();
  const location     = useLocation();
  
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  
  // Step 1: Normal, Step 2: Completando datos para Google Auth
  const [step, setStep] = useState(1);
  const [googleCredential, setGoogleCredential] = useState(null);

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

  useEffect(() => {
    if (location.state?.googleData) {
      const gData = location.state.googleData;
      setForm(f => ({
        ...f,
        firstName: gData.firstName,
        lastName: gData.lastName,
        email: gData.email
      }));
      setGoogleCredential(gData.credential);
      setStep(2);
    }
  }, [location]);

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

  const handleDocumentChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setForm({...form, document: val});
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (step === 1) {
        if (form.password !== form.confirm) {
          toast.error('Las contraseñas no coinciden.');
          setLoading(false);
          return;
        }
        const { confirm, ...submitData } = form;
        await register(submitData);
        toast.success('¡Registro casi listo! Verificá tu email para activar la cuenta.');
        navigate('/login');
      } else if (step === 2) {
        const submitData = {
          credential: googleCredential,
          document: form.document,
          birthDate: form.birthDate,
          phone: form.phone,
          address: form.address
        };
        await registerWithGoogle(submitData);
        toast.success('¡Cuenta creada correctamente con Google!');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.message || 'Error al registrarse.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    try {
      setLoading(true);
      const res = await loginWithGoogle(response.credential);
      if (res?.unregistered) {
        setForm(f => ({
          ...f,
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          email: res.data.email
        }));
        setGoogleCredential(res.data.credential);
        setStep(2);
        toast.success('Casi listo! Completá los datos faltantes.');
      } else {
        toast.success('¡Bienvenido! Tu cuenta ya existía.');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.message || 'Error con Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <SEOHead title="Crear Cuenta" noindex />
      <div className={`${styles.card} ${styles.cardWide}`} style={{ maxWidth: '800px' }}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <img 
              src={tenant?.config?.logo ? getImageUrl(tenant.config.logo) : '/logos/Logo-Eden.png'} 
              alt={tenant?.name || 'Logo Eden'} 
            />
          </div>
          {step === 1 ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
              <h1 className={styles.title}>Creá tu cuenta</h1>
              <p className={styles.subtitle}>Completá tus datos para una experiencia personalizada</p>
              
              <div style={{ marginTop: '1rem', width: '100%' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => { toast.error('Error en autenticación de Google.') }}
                  text="signup_with"
                  shape="rectangular"
                  theme="filled_blue"
                  size="large"
                  width="100%"
                />
              </div>
              <div style={{ width: '100%', borderBottom: '1px solid var(--color-border)', height: '1px', position: 'relative', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-surface)', padding: '0 10px', fontSize: '0.8rem', color: 'var(--color-text-3)' }}>O completá el registro manual</span>
              </div>
            </div>
          ) : (
            <>
              <h1 className={styles.title} style={{ color: 'var(--color-primary)' }}>¡Hola {form.firstName}!</h1>
              <p className={styles.subtitle}>Completá el registro con Google aportando tus datos vehiculares/facturación</p>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          
          {step === 1 && (
            <>
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
            </>
          )}

          <div className={styles.twoCol} style={{ marginTop: step === 2 ? '1rem' : '0' }}>
            <div className="input-group">
              <label className="input-label">Documento (DNI/CUIL)</label>
              <div className={styles.inputWrapper}>
                <FiCreditCard className={styles.inputIcon} />
                <input 
                  className={`input ${styles.inputWithIcon}`} 
                  type="text" name="document" 
                  placeholder="Solo números" 
                  value={form.document} 
                  onChange={handleDocumentChange} 
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
            {step === 1 && (
              <div className="input-group">
                <label className="input-label">Email</label>
                <div className={styles.inputWrapper}>
                  <FiMail className={styles.inputIcon} />
                  <input className={`input ${styles.inputWithIcon}`} type="email" name="email" placeholder="tu@email.com" value={form.email} onChange={handleChange} required />
                </div>
              </div>
            )}
            <div className="input-group" style={{ gridColumn: step === 2 ? '1 / -1' : 'auto' }}>
              <label className="input-label">Celular</label>
              <div className={styles.inputWrapper}>
                <FiSmartphone className={styles.inputIcon} />
                <input className={`input ${styles.inputWithIcon}`} type="tel" name="phone" placeholder="Ej: 1123456789" value={form.phone} onChange={handleChange} required />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DOMICILIO */}
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            {step === 1 ? '2.' : '1.'} Domicilio de Facturación/Envío
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

          {step === 1 && (
            <>
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
            </>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: '2rem' }} disabled={loading}>
            {loading ? <span className="spinner" /> : (step === 1 ? '🚀 Registrarme y Validar Email' : '🚀 Completar Registro con Google')}
          </button>
        </form>
        


        {step === 1 ? (
          <p className={styles.footer}>
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className={styles.link}>Iniciá sesión</Link>
          </p>
        ) : (
          <p className={styles.footer}>
            <button onClick={() => setStep(1)} style={{ background:'none', border:'none', color:'var(--color-primary)', cursor:'pointer', textDecoration:'underline' }}>
              Volver al registro normal
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
