import { useState, useEffect, useRef } from 'react';
import { useTenant } from '../../hooks/useTenant';
import { tenantService } from '../../services/index';
import toast from 'react-hot-toast';
import { FiSave, FiUpload, FiGlobe, FiPhone, FiMapPin, FiMail, FiInstagram, FiFacebook } from 'react-icons/fi';
import styles from './TenantConfig.module.css';

export default function TenantConfig() {
  const { tenant, refreshTenant } = useTenant();
  const [form, setForm]     = useState({
    name: '', address: '', phone: '', email: '', description: '',
    businessHours: '', instagram: '', facebook: '', whatsapp: '',
    primaryColor: '#FF6B00', secondaryColor: '#0D0D0D',
  });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (tenant) {
      const cfg = tenant.config || {};
      setForm({
        name:          tenant.name || '',
        address:       cfg.address || '',
        phone:         cfg.phone || '',
        email:         cfg.email || '',
        description:   cfg.description || '',
        businessHours: cfg.businessHours || '',
        instagram:     cfg.socialLinks?.instagram || '',
        facebook:      cfg.socialLinks?.facebook || '',
        whatsapp:      cfg.socialLinks?.whatsapp || '',
        primaryColor:  cfg.primaryColor || '#FF6B00',
        secondaryColor:cfg.secondaryColor || '#0D0D0D',
      });
    }
  }, [tenant]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await tenantService.update({
        name: form.name,
        config: {
          address:       form.address,
          phone:         form.phone,
          email:         form.email,
          description:   form.description,
          businessHours: form.businessHours,
          primaryColor:  form.primaryColor,
          secondaryColor:form.secondaryColor,
          socialLinks: {
            instagram: form.instagram,
            facebook:  form.facebook,
            whatsapp:  form.whatsapp,
          },
        },
      });
      await refreshTenant();
      toast.success('Configuración guardada correctamente.');
    } catch (err) {
      toast.error(err.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('logo', file);
    try {
      await tenantService.uploadLogo(fd);
      await refreshTenant();
      toast.success('Logo actualizado.');
    } catch (err) {
      toast.error(err.message || 'Error al subir logo.');
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 className="section-title" style={{ marginBottom: '2rem' }}>Configuración de la Tienda</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Logo */}
          <div className="card">
            <p className={styles.sectionTitle}>Logo</p>
            <div className={styles.logoSection}>
              <div className={styles.logoPreview}>
                {tenant?.config?.logo ? (
                  <img src={tenant.config.logo} alt="Logo" />
                ) : (
                  <span style={{ fontSize: '2rem' }}>🔧</span>
                )}
              </div>
              <div>
                <button type="button" className="btn btn-outline" onClick={() => fileRef.current?.click()}>
                  <FiUpload size={15} /> Cambiar logo
                </button>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-3)', marginTop: '0.4rem' }}>
                  PNG, JPG o WebP. Máx 5MB.
                </p>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
              </div>
            </div>
          </div>

          {/* Info básica */}
          <div className="card">
            <p className={styles.sectionTitle}><FiGlobe size={16} /> Información General</p>
            <div className={styles.grid}>
              <div className="input-group" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Nombre del lubricentro *</label>
                <input className="input" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="input-group" style={{ gridColumn: '1/-1' }}>
                <label className="input-label">Descripción</label>
                <textarea className="input textarea" name="description" value={form.description}
                  onChange={handleChange} rows={3} placeholder="Describí tu lubricentro..." />
              </div>
              <div className="input-group">
                <label className="input-label"><FiMapPin size={13} /> Dirección</label>
                <input className="input" name="address" value={form.address} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label className="input-label"><FiPhone size={13} /> Teléfono</label>
                <input className="input" name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label className="input-label"><FiMail size={13} /> Email de contacto</label>
                <input className="input" type="email" name="email" value={form.email} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Horario de atención</label>
                <input className="input" name="businessHours" value={form.businessHours}
                  onChange={handleChange} placeholder="Lun-Vie 8-18hs, Sáb 8-13hs" />
              </div>
            </div>
          </div>

          {/* Colores */}
          <div className="card">
            <p className={styles.sectionTitle}>Colores de la Tienda</p>
            <div className={styles.colorRow}>
              <div className="input-group">
                <label className="input-label">Color primario</label>
                <div className={styles.colorPicker}>
                  <input type="color" value={form.primaryColor}
                    onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))} />
                  <input className="input" value={form.primaryColor}
                    onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Color secundario</label>
                <div className={styles.colorPicker}>
                  <input type="color" value={form.secondaryColor}
                    onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))} />
                  <input className="input" value={form.secondaryColor}
                    onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Redes sociales */}
          <div className="card">
            <p className={styles.sectionTitle}>Redes Sociales</p>
            <div className={styles.grid}>
              <div className="input-group">
                <label className="input-label"><FiInstagram size={13} /> Instagram</label>
                <input className="input" name="instagram" value={form.instagram}
                  onChange={handleChange} placeholder="https://instagram.com/tu-cuenta" />
              </div>
              <div className="input-group">
                <label className="input-label"><FiFacebook size={13} /> Facebook</label>
                <input className="input" name="facebook" value={form.facebook}
                  onChange={handleChange} placeholder="https://facebook.com/tu-pagina" />
              </div>
              <div className="input-group">
                <label className="input-label">💬 WhatsApp</label>
                <input className="input" name="whatsapp" value={form.whatsapp}
                  onChange={handleChange} placeholder="https://wa.me/549..." />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving
                ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                : <><FiSave size={16} /> Guardar Cambios</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
