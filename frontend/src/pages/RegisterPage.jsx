import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { getImageUrl } from '../utils/formatters';
import styles from './AuthPage.module.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirm } = form;

    if (!name || !email || !password) {
      toast.error('Completá todos los campos.');
      return;
    }
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password });
      toast.success('¡Cuenta creada! Bienvenido 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Error al registrarse.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <img src="/logo-eden.png" alt="Logo Eden" style={{ width: '100%', height: 'auto' }} />
          </div>
          <h1 className={styles.title}>Creá tu cuenta</h1>
          <p className={styles.subtitle}>Unite a nuestra comunidad y comprá más rápido</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="input-group">
            <label className="input-label" htmlFor="reg-name">Nombre completo</label>
            <div className={styles.inputWrapper}>
              <FiUser className={styles.inputIcon} size={16} />
              <input
                id="reg-name"
                className={`input ${styles.inputWithIcon}`}
                type="text"
                name="name"
                placeholder="Ej: Juan García"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-email">Email</label>
            <div className={styles.inputWrapper}>
              <FiMail className={styles.inputIcon} size={16} />
              <input
                id="reg-email"
                className={`input ${styles.inputWithIcon}`}
                type="email"
                name="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className={styles.twoCol}>
            <div className="input-group">
              <label className="input-label" htmlFor="reg-pass">Contraseña</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} size={16} />
                <input
                  id="reg-pass"
                  className={`input ${styles.inputWithIcon} ${styles.inputWithEnd}`}
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button type="button" className={styles.togglePass}
                  onClick={() => setShowPass((s) => !s)} aria-label="Toggle">
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="reg-confirm">Confirmar contraseña</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} size={16} />
                <input
                  id="reg-confirm"
                  className={`input ${styles.inputWithIcon}`}
                  type={showPass ? 'text' : 'password'}
                  name="confirm"
                  placeholder="Repetí la contraseña"
                  value={form.confirm}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Eliminado badge de plan SaaS */}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading
              ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              : '🚀 Registrarme'}
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
