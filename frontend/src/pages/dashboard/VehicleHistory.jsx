import { useState } from 'react';
import { taskService } from '../../services/index';
import { formatDate, formatPrice, estimateNextServiceDate } from '../../utils/formatters';
import { 
  FiSearch, FiFileText, FiCamera, FiCheckCircle, FiInfo, 
  FiHash, FiActivity, FiClock, FiPackage, FiCalendar, FiSmartphone 
} from 'react-icons/fi';

export default function VehicleHistory() {
  const [plate, setPlate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!plate.trim() && !startDate && !endDate) return;

    setLoading(true);
    try {
      const data = await taskService.getHistory({ 
        plate: plate.toUpperCase().trim(),
        startDate,
        endDate
      });
      setHistory(data.data.history || []);
      setSearched(true);
    } catch (error) {
      console.error('Error buscando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = async () => {
    setPlate('');
    setStartDate('');
    setEndDate('');
    setLoading(true);
    try {
      const data = await taskService.getHistory({});
      setHistory(data.data.history || []);
      setSearched(true);
    } catch (error) {
      console.error('Error cargando historial completo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text)' }}>
            Historial Clínico de Vehículos
          </h1>
          <p style={{ color: 'var(--color-text-2)' }}>Consulta los servicios realizados y planificá los próximos recordatorios.</p>
        </div>

        {/* Buscador */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 2, minWidth: '200px' }}>
                <FiHash style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                <input
                  type="text"
                  className="input"
                  placeholder="Patente (ej: ABC 123)..."
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  style={{ paddingLeft: '2.5rem', textTransform: 'uppercase' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <input
                  type="date"
                  className="input"
                  title="Desde"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <input
                  type="date"
                  className="input"
                  title="Hasta"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn btn-ghost" onClick={handleViewAll} disabled={loading}>
                Ver todo historial
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0 3rem' }}>
                {loading ? 'Buscando...' : <><FiSearch /> Buscar</>}
              </button>
            </div>
          </form>
        </div>

        {/* Resultados */}
        {!searched && !loading && (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-3)' }}>
            <FiSearch size={64} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p style={{ fontSize: '1.2rem' }}>Busca por patente para ver el historial y programar mantenimientos.</p>
          </div>
        )}

        {searched && history.length === 0 && !loading && (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <FiInfo size={48} style={{ color: 'var(--color-text-3)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Sin registros</h3>
            <p style={{ color: 'var(--color-text-2)' }}>No se encontraron servicios completados para los filtros seleccionados.</p>
          </div>
        )}

        {history.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 600 }}>
              <FiActivity /> Se encontraron {history.length} visitas
            </div>
            {history.map((service) => {
              const nextDate = estimateNextServiceDate(service.date, service.currentKm, service.nextChangeKm);
              
              return (
                <div key={service._id} className="card" style={{ padding: '2rem', borderLeft: '4px solid var(--color-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text)' }}>{service.title || 'Servicio de Taller'}</h3>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px', 
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          background: service._type === 'task' ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)',
                          color: service._type === 'task' ? '#3b82f6' : '#8b5cf6'
                        }}>
                          {service._type === 'task' ? 'Taller' : 'Tienda Web'}
                        </span>
                      </div>
                      <p style={{ color: 'var(--color-text-2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiCheckCircle style={{ color: 'var(--color-success)' }} /> Completado el {formatDate(service.date)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)' }}>
                        {service.currentKm ? service.currentKm.toLocaleString() : '-'} KM
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-3)' }}>Kilometraje de la visita</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    
                    {/* PLAN DE MANTENIMIENTO PREVENTIVO */}
                    <div style={{ 
                      background: 'linear-gradient(135deg, rgba(203,26,32,0.08), rgba(203,26,32,0.02))', 
                      padding: '1.5rem', 
                      borderRadius: '16px', 
                      border: '1px solid rgba(203,26,32,0.15)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1 }}>
                        <FiCalendar size={80} color="var(--color-primary)" />
                      </div>
                      
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--color-primary)', fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <FiCalendar /> Plan de Mantenimiento
                      </h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Próximo Cambio (Objetivo)</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{service.nextChangeKm ? service.nextChangeKm.toLocaleString() : '---'} <small style={{ fontSize: '0.8rem', fontWeight: 500 }}>KM</small></p>
                          </div>
                        </div>

                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>Fecha Estimada de Service</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiClock style={{ color: 'var(--color-primary)' }} />
                            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                              {nextDate ? formatDate(nextDate) : 'Faltan datos de KM'}
                            </p>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-2)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                            * Basado en promedio de 10.000 km/año
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* DETALLES Y FLUIDOS */}
                    <div style={{ background: 'var(--color-bg-2)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--color-text)', fontWeight: 700 }}>
                        <FiFileText /> Fluidos y Filtros
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-3)' }}>Aceite Utilizado:</span>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem', textAlign: 'right' }}>{service.serviceData?.oilBrand || '-'} <br/> <small style={{ fontWeight: 400, opacity: 0.7 }}>{service.serviceData?.oilType || '-'}</small></span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
                          {[
                            { label: 'F. Aceite', active: service.serviceData?.filterOil },
                            { label: 'F. Aire', active: service.serviceData?.filterAir },
                            { label: 'F. Combust.', active: service.serviceData?.filterFuel },
                            { label: 'F. Habitáculo', active: service.serviceData?.filterCabin },
                          ].map(f => (
                            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: f.active ? 1 : 0.3, color: f.active ? 'var(--color-success)' : 'inherit' }}>
                              <FiCheckCircle /> {f.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* INSUMOS (Si aplica) */}
                    {service.items?.length > 0 && (
                      <div style={{ background: 'rgba(34,197,94,0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(34,197,94,0.15)' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#22c55e', fontWeight: 700 }}>
                          <FiPackage /> Repuestos / Insumos
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {service.items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--color-text-2)' }}>{item?.name} <small>x{item?.quantity}</small></span>
                              <span style={{ fontWeight: 600 }}>{formatPrice(item?.price * item?.quantity)}</span>
                            </div>
                          ))}
                          <div style={{ borderTop: '1px solid rgba(34,197,94,0.1)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#22c55e' }}>
                            <span>Total</span>
                            <span>{formatPrice(service.totalValue)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notas y Preparación WhatsApp */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                    <div>
                      <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-3)', textTransform: 'uppercase' }}>Observaciones Técnicas</h4>
                      <p style={{ color: 'var(--color-text)', fontStyle: 'italic', fontSize: '0.95rem', lineHeight: 1.6 }}>
                        "{service.serviceData?.observations || 'Sin observaciones registradas.'}"
                      </p>
                    </div>
                    <div style={{ background: 'var(--color-bg-3)', padding: '1rem', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                        <FiSmartphone /> Recordatorio de WhatsApp
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-2)', marginBottom: '0.5rem' }}>Próximo aviso recomendado para el:</p>
                      <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)' }}>{nextDate ? formatDate(nextDate) : '---'}</p>
                      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', background: 'var(--color-surface)', padding: '0.5rem', borderRadius: '6px', color: 'var(--color-text-3)' }}>
                        "Hola! Te recordamos que tu {service.title || 'vehículo'} está por cumplir los {service.nextChangeKm} KM..."
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
