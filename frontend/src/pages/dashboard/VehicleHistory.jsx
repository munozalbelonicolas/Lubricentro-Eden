import { useState } from 'react';
import { taskService } from '../../services/index';
import { formatDate, formatPrice } from '../../utils/formatters';
import { FiSearch, FiFileText, FiCamera, FiCheckCircle, FiInfo, FiHash, FiActivity } from 'react-icons/fi';
import styles from './DashboardPage.module.css'; // Reutilizamos estilos base
import localStyles from './WorkshopAdmin.module.css'; // Reutilizamos algunos estilos de taller

export default function VehicleHistory() {
  const [plate, setPlate] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!plate.trim()) return;

    setLoading(true);
    try {
      const data = await taskService.getHistory(plate.toUpperCase().trim());
      setHistory(data.data.history || []);
      setSearched(true);
    } catch (error) {
      console.error('Error buscando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-1)' }}>
            Historial Clínico de Vehículos
          </h1>
          <p style={{ color: 'var(--color-text-2)' }}>Consulta los servicios realizados por patente.</p>
        </div>

        {/* Buscador */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FiHash style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
              <input
                type="text"
                className="input"
                placeholder="Ingrese patente (ej: AB123CD)..."
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                style={{ paddingLeft: '2.5rem', fontSize: '1.1rem', textTransform: 'uppercase' }}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0 2rem' }}>
              {loading ? 'Buscando...' : <><FiSearch /> Buscar</>}
            </button>
          </form>
        </div>

        {/* Resultados */}
        {!searched && !loading && (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-3)' }}>
            <FiSearch size={64} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p style={{ fontSize: '1.2rem' }}>Ingresa una patente para ver el historial guardado en la agenda.</p>
          </div>
        )}

        {searched && history.length === 0 && !loading && (
          <div className="card" style={{ textAlign: 'center', padding: '4rem', background: '#fff' }}>
            <FiInfo size={48} style={{ color: 'var(--color-text-3)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Sin registros para {plate.toUpperCase()}</h3>
            <p style={{ color: 'var(--color-text-2)' }}>No se encontraron servicios completados para esta patente en el sistema.</p>
          </div>
        )}

        {history.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 600 }}>
              <FiActivity /> Se encontraron {history.length} visitas
            </div>
            {history.map((service) => (
              <div key={service._id} className="card" style={{ padding: '2rem', borderLeft: '4px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{service.title}</h3>
                    <p style={{ color: 'var(--color-text-2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FiClock /> Realizado el {formatDate(service.date)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      {service.currentKm ? service.currentKm.toLocaleString() : '-'} KM
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-3)' }}>Kilometraje al service</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                  {/* Ficha Técnica */}
                  <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-text-1)' }}>
                      <FiFileText /> Ficha de Fluidos
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-text-2)' }}>Aceite:</span>
                        <span style={{ fontWeight: 600 }}>{service.serviceData?.oilBrand || '-'} / {service.serviceData?.oilType || '-'}</span>
                      </p>
                      <hr style={{ border: 0, borderTop: '1px solid #e2e8f0' }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: service.serviceData?.filterOil ? 1 : 0.4 }}>
                          <FiCheckCircle style={{ color: service.serviceData?.filterOil ? 'var(--color-success)' : 'inherit' }} /> F. Aceite
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: service.serviceData?.filterAir ? 1 : 0.4 }}>
                          <FiCheckCircle style={{ color: service.serviceData?.filterAir ? 'var(--color-success)' : 'inherit' }} /> F. Aire
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: service.serviceData?.filterFuel ? 1 : 0.4 }}>
                          <FiCheckCircle style={{ color: service.serviceData?.filterFuel ? 'var(--color-success)' : 'inherit' }} /> F. Combust.
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: service.serviceData?.filterCabin ? 1 : 0.4 }}>
                          <FiCheckCircle style={{ color: service.serviceData?.filterCabin ? 'var(--color-success)' : 'inherit' }} /> F. Habitac.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notas y Fotos */}
                  <div>
                    <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Observaciones del Servicio</h4>
                    <p style={{ color: 'var(--color-text-2)', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                      "{service.serviceData?.observations || 'Sin observaciones registradas.'}"
                    </p>
                    
                    {service.serviceData?.photos?.length > 0 && (
                      <div>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '1rem' }}>
                          <FiCamera /> Fotos de Respaldo
                        </h4>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {service.serviceData.photos.map((photo, i) => (
                            <img key={i} src={photo} alt="Service" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
