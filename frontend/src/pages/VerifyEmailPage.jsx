import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import styles from './AuthPage.module.css';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('Verificando tu cuenta...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('El link de verificación es inválido.');
      return;
    }

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setStatus('success');
        setMessage('¡Tu cuenta ha sido verificada con éxito!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Error al verificar la cuenta.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className={styles.page}>
      <div className={styles.card} style={{ textAlign: 'center' }}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <img src="/logos/Logo-Eden.png" alt="Logo Eden" style={{ height: 60 }} />
          </div>
          <h1 className={styles.title}>Verificación de Email</h1>
        </div>

        <div style={{ margin: '2rem 0' }}>
          {status === 'loading' && (
            <div style={{ color: 'var(--color-primary)' }}>
              <FiLoader className="spinner" size={48} />
              <p style={{ marginTop: '1rem' }}>{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div style={{ color: 'var(--color-success)' }}>
              <FiCheckCircle size={64} />
              <p style={{ marginTop: '1rem', color: 'var(--color-text)', fontWeight: 500 }}>{message}</p>
              <div style={{ marginTop: '2rem' }}>
                <Link to="/login" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                  Ir a Iniciar Sesión
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div style={{ color: 'var(--color-error)' }}>
              <FiXCircle size={64} />
              <p style={{ marginTop: '1rem', color: 'var(--color-text)', fontWeight: 500 }}>{message}</p>
              <div style={{ marginTop: '2rem' }}>
                <Link to="/register" className={styles.link}>
                  Volver a intentar el registro
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
