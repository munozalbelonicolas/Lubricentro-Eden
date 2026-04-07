import { useState, useEffect, useMemo } from 'react';
import { orderService } from '../../services/index';
import { orderStatusLabel } from '../../utils/formatters';
import toast from 'react-hot-toast';
import {
  FiRefreshCw, FiCalendar, FiClock, FiTool,
  FiChevronLeft, FiChevronRight, FiUser, FiCheckCircle,
  FiAlertCircle, FiList,
} from 'react-icons/fi';

/* ─── Constantes ─────────────────────────────────────────── */
const TIME_SLOTS = ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00'];
const SLOT_LABEL = {
  '08:00-10:00': 'Turno 1 · Mañana temprano',
  '10:00-12:00': 'Turno 2 · Mañana',
  '14:00-16:00': 'Turno 3 · Tarde temprano',
  '16:00-18:00': 'Turno 4 · Tarde',
};
const DONE_STATUSES = ['delivered', 'confirmed'];
const ORDER_STATUSES = ['pending','confirmed','processing','delivered','cancelled'];

const toLocalDate = (d) => {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const getWeekDays = (anchor) => {
  const d    = new Date(anchor);
  const day  = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon  = new Date(d);
  mon.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const n = new Date(mon);
    n.setDate(mon.getDate() + i);
    return n;
  });
};

const DAY_FULL  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DAY_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS    = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

const formatLongDate = (dateStr) => {
  const d = new Date(dateStr + 'T12:00:00');
  return `${DAY_FULL[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/* ─── STATUS chip ────────────────────────────────────────── */
const STATUS_CHIP = {
  pending:    { bg: '#fef3c7', color: '#92400e', text: 'Pendiente' },
  confirmed:  { bg: '#d1fae5', color: '#065f46', text: 'Confirmado' },
  processing: { bg: '#dbeafe', color: '#1e40af', text: 'En proceso' },
  delivered:  { bg: '#d1fae5', color: '#065f46', text: 'Completado' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b', text: 'Cancelado'  },
};

/* ═══════════════════════════════════════════════════════════ */
export default function WorkshopAdmin() {
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [anchor,     setAnchor]     = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(toLocalDate(new Date()));
  const [tab,        setTab]        = useState('day'); // 'day' | 'week'

  const weekDays = useMemo(() => getWeekDays(anchor), [anchor]);
  const todayKey = toLocalDate(new Date());

  /* Cargar TODAS las órdenes de tipo workshop */
  const load = async () => {
    setLoading(true);
    try {
      const data = await orderService.getAll({ limit: 500 });
      const ws   = (data.data.orders || []).filter((o) => o.deliveryType === 'workshop');
      setOrders(ws);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (orderId, status) => {
    try {
      await orderService.updateStatus(orderId, status);
      toast.success('Estado actualizado.');
      load();
    } catch (err) { toast.error(err.message); }
  };

  /* Órdenes del día seleccionado */
  const dayOrders = useMemo(() =>
    orders.filter((o) => o.workshopAppointment?.date?.split('T')[0] === selectedDay)
  , [orders, selectedDay]);

  /* Pendientes del día (sin completar / sin cancelar) */
  const pendingToday = dayOrders.filter((o) => !['delivered','cancelled'].includes(o.status));
  const doneToday    = dayOrders.filter((o) =>  DONE_STATUSES.includes(o.status));

  /* Conteo por día para el mini-calendario */
  const countByDay = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const d = o.workshopAppointment?.date?.split('T')[0];
      if (d) map[d] = (map[d] || 0) + 1;
    });
    return map;
  }, [orders]);

  /* Semana */
  const prevWeek = () => { const d = new Date(anchor); d.setDate(d.getDate()-7); setAnchor(d); };
  const nextWeek = () => { const d = new Date(anchor); d.setDate(d.getDate()+7); setAnchor(d); };
  const goToday  = () => { setAnchor(new Date()); setSelectedDay(todayKey); };

  /* ─── Render ─────────────────────────────────────────── */
  return (
    <div className="page">
      <div className="container">

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.5rem', gap:'1rem', flexWrap:'wrap' }}>
          <div>
            <h1 style={{ fontSize:'1.6rem', fontWeight:800, marginBottom:'0.25rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <FiTool style={{ color:'#f59e0b' }} /> Agenda del Taller
            </h1>
            <p style={{ color:'var(--color-text-2)', fontSize:'0.9rem' }}>
              Turnos de cambio de aceite agendados por los clientes
            </p>
          </div>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={goToday}>📅 Hoy</button>
            <button className="btn btn-ghost btn-sm" onClick={load}><FiRefreshCw size={14}/> Actualizar</button>
          </div>
        </div>

        {/* ── Resumen del día seleccionado ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))', gap:'0.75rem', marginBottom:'1.5rem' }}>
          {[
            { label:'Turnos totales', value: dayOrders.length,    color:'#3b82f6', icon:<FiCalendar size={20}/> },
            { label:'Pendientes',     value: pendingToday.length,  color:'#f59e0b', icon:<FiAlertCircle size={20}/> },
            { label:'Completados',    value: doneToday.length,     color:'#22c55e', icon:<FiCheckCircle size={20}/> },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="card" style={{ display:'flex', alignItems:'center', gap:'0.85rem', padding:'0.9rem 1.1rem' }}>
              <div style={{ background:`${color}22`, color, borderRadius:'10px', padding:'0.5rem', display:'flex' }}>
                {icon}
              </div>
              <div>
                <p style={{ fontSize:'1.5rem', fontWeight:800, lineHeight:1 }}>{value}</p>
                <p style={{ fontSize:'0.75rem', color:'var(--color-text-3)', marginTop:'0.1rem' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem' }}>
          {[{ id:'day', label:'Vista del día', icon:<FiClock size={14}/> },
            { id:'week', label:'Semana', icon:<FiCalendar size={14}/> }].map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                padding:'0.45rem 1rem', borderRadius:'999px', border:'none', cursor:'pointer',
                display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.85rem', fontWeight:600,
                background: tab===id ? 'var(--color-primary)' : 'var(--color-surface-2, rgba(255,255,255,0.07))',
                color: tab===id ? '#fff' : 'var(--color-text-2)',
                transition:'all 0.15s',
              }}
            >{icon} {label}</button>
          ))}
        </div>

        {/* ── Mini-calendario (semana) ── */}
        <div className="card" style={{ padding:'1rem 1.25rem', marginBottom:'1.25rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={prevWeek}><FiChevronLeft/></button>
            <span style={{ fontWeight:700, fontSize:'0.95rem' }}>
              {weekDays[0] && `${weekDays[0].getDate()} ${MONTHS[weekDays[0].getMonth()]}`}
              &nbsp;–&nbsp;
              {weekDays[6] && `${weekDays[6].getDate()} ${MONTHS[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={nextWeek}><FiChevronRight/></button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'0.35rem' }}>
            {weekDays.map((day) => {
              const key     = toLocalDate(day);
              const isToday = key === todayKey;
              const isActive= key === selectedDay;
              const count   = countByDay[key] || 0;
              return (
                <button key={key} onClick={() => { setSelectedDay(key); setTab('day'); }} style={{
                  borderRadius:'12px', padding:'0.55rem 0.2rem', cursor:'pointer', textAlign:'center',
                  border: isActive ? '2px solid var(--color-primary)' : isToday ? '2px solid rgba(99,102,241,0.4)' : '2px solid transparent',
                  background: isActive ? 'var(--color-primary)' : isToday ? 'rgba(99,102,241,0.1)' : 'var(--color-surface-2,rgba(255,255,255,0.05))',
                  color: isActive ? '#fff' : 'var(--color-text)',
                  position:'relative', transition:'all 0.15s',
                }}>
                  <div style={{ fontSize:'0.65rem', opacity:0.7, marginBottom:'0.15rem' }}>{DAY_SHORT[day.getDay()]}</div>
                  <div style={{ fontSize:'1rem', fontWeight:700 }}>{day.getDate()}</div>
                  {count > 0 && (
                    <div style={{
                      position:'absolute', top:3, right:3,
                      background: isActive ? 'rgba(255,255,255,0.4)' : '#f59e0b',
                      color: isActive ? '#fff' : '#000',
                      borderRadius:'50%', width:15, height:15,
                      fontSize:'0.58rem', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700,
                    }}>{count}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Contenido ── */}
        {tab === 'day' ? (
          <DayView
            selectedDay={selectedDay}
            dayOrders={dayOrders}
            loading={loading}
            todayKey={todayKey}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <WeekView
            weekDays={weekDays}
            orders={orders}
            todayKey={todayKey}
            onSelect={(k) => { setSelectedDay(k); setTab('day'); }}
            onStatusChange={handleStatusChange}
          />
        )}

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Vista del día
═══════════════════════════════════════════════════════════ */
function DayView({ selectedDay, dayOrders, loading, todayKey, onStatusChange }) {
  const isToday = selectedDay === todayKey;

  if (loading) return <div className="flex-center" style={{ padding:'3rem' }}><div className="spinner"/></div>;

  if (dayOrders.length === 0) return (
    <div className="card" style={{ textAlign:'center', padding:'3.5rem', color:'var(--color-text-3)' }}>
      <FiClock size={48} style={{ opacity:0.2, marginBottom:'1rem' }}/>
      <p style={{ fontWeight:600, marginBottom:'0.5rem' }}>Sin turnos para este día</p>
      <p style={{ fontSize:'0.85rem' }}>No hay cambios de aceite agendados.</p>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize:'1rem', fontWeight:700, marginBottom:'1.25rem', textTransform:'capitalize', display:'flex', alignItems:'center', gap:'0.5rem' }}>
        <FiList size={16} style={{ color:'var(--color-primary)' }}/>
        {isToday ? '🔴 HOY — ' : ''}{formatLongDate(selectedDay)}
        <span style={{ marginLeft:'0.25rem', fontWeight:400, color:'var(--color-text-3)', fontSize:'0.88rem' }}>
          · {dayOrders.length} {dayOrders.length===1?'turno':'turnos'}
        </span>
      </h2>

      {TIME_SLOTS.map((slot) => {
        const slotOrders = dayOrders.filter((o) => o.workshopAppointment?.timeSlot === slot);
        if (slotOrders.length === 0) return null;
        return (
          <div key={slot} style={{ marginBottom:'2rem' }}>
            {/* Cabecera del turno */}
            <div style={{
              display:'flex', alignItems:'center', gap:'0.6rem',
              background:'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
              border:'1px solid rgba(245,158,11,0.3)',
              borderRadius:'12px', padding:'0.7rem 1rem', marginBottom:'0.75rem',
            }}>
              <FiClock style={{ color:'#f59e0b', flexShrink:0 }}/>
              <div>
                <p style={{ fontWeight:800, color:'#f59e0b', fontSize:'0.95rem' }}>{SLOT_LABEL[slot]}</p>
                <p style={{ fontSize:'0.75rem', color:'var(--color-text-3)', marginTop:'0.1rem' }}>
                  {slot} hs · {slotOrders.length} {slotOrders.length===1?'vehículo':'vehículos'}
                </p>
              </div>
              <div style={{ marginLeft:'auto', background:'#f59e0b', color:'#000', borderRadius:'999px', padding:'0.2rem 0.65rem', fontSize:'0.75rem', fontWeight:800 }}>
                {slotOrders.length}
              </div>
            </div>

            {/* Tarjetas de turno */}
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {slotOrders.map((order) => (
                <AppointmentCard key={order._id} order={order} onStatusChange={onStatusChange} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Tarjeta de turno individual ──────────────────────── */
function AppointmentCard({ order, onStatusChange }) {
  const chip   = STATUS_CHIP[order.status] || { bg:'#e2e8f0', color:'#475569', text: order.status };
  const isDone = DONE_STATUSES.includes(order.status);

  return (
    <div className="card" style={{
      padding:'1.25rem 1.4rem',
      borderLeft: isDone ? '4px solid #22c55e' : '4px solid #f59e0b',
      opacity: order.status === 'cancelled' ? 0.55 : 1,
    }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'1rem', alignItems:'flex-start' }}>

        {/* Info principal */}
        <div>
          {/* Cliente + orden */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.6rem', flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', fontWeight:700, fontSize:'1rem' }}>
              <FiUser size={15} style={{ color:'var(--color-text-3)' }}/>
              {order.userId?.name || 'Cliente'}
            </div>
            <span style={{ fontSize:'0.75rem', color:'var(--color-text-3)' }}>#{order.orderNumber}</span>
            <span style={{
              background: chip.bg, color: chip.color,
              padding:'0.15rem 0.6rem', borderRadius:'999px', fontSize:'0.72rem', fontWeight:700,
            }}>{chip.text}</span>
          </div>

          {/* Vehículo */}
          {order.workshopAppointment?.vehicle ? (
            <div style={{
              display:'inline-flex', alignItems:'center', gap:'0.4rem',
              background:'rgba(99,102,241,0.1)', color:'var(--color-primary)',
              borderRadius:'8px', padding:'0.35rem 0.75rem', marginBottom:'0.75rem',
              fontWeight:700, fontSize:'0.9rem',
            }}>
              🚗 {order.workshopAppointment.vehicle}
            </div>
          ) : (
            <p style={{ fontSize:'0.8rem', color:'var(--color-text-3)', marginBottom:'0.75rem', fontStyle:'italic' }}>
              🚗 Vehículo no especificado
            </p>
          )}

          {/* Productos a usar */}
          <div style={{ marginBottom:'0.5rem' }}>
            <p style={{ fontSize:'0.75rem', color:'var(--color-text-3)', fontWeight:600, marginBottom:'0.35rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>
              🛢 Insumos del cliente
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
              {order.items.map((item, idx) => (
                <div key={idx} style={{
                  display:'flex', alignItems:'center', gap:'0.5rem',
                  background:'var(--color-surface-2, rgba(255,255,255,0.04))',
                  borderRadius:'6px', padding:'0.3rem 0.6rem',
                  fontSize:'0.84rem',
                }}>
                  <span style={{ fontWeight:600 }}>{item.name}</span>
                  <span style={{ color:'var(--color-text-3)', fontSize:'0.78rem' }}>×{item.quantity}</span>
                  {item.name?.toLowerCase().includes('aceite') && <span style={{ fontSize:'0.7rem', background:'#fef3c7', color:'#92400e', borderRadius:'4px', padding:'0.05rem 0.35rem' }}>aceite</span>}
                  {item.name?.toLowerCase().includes('filtro') && <span style={{ fontSize:'0.7rem', background:'#dbeafe', color:'#1e40af', borderRadius:'4px', padding:'0.05rem 0.35rem' }}>filtro</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Email / contacto */}
          {order.userId?.email && (
            <p style={{ fontSize:'0.78rem', color:'var(--color-text-3)' }}>
              📧 {order.userId.email}
            </p>
          )}
          {order.notes && (
            <p style={{ fontSize:'0.8rem', color:'var(--color-text-2)', marginTop:'0.4rem', fontStyle:'italic' }}>
              💬 &quot;{order.notes}&quot;
            </p>
          )}
        </div>

        {/* Acciones */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', alignItems:'flex-end' }}>
          <select
            className="select"
            style={{ fontSize:'0.8rem', padding:'0.35rem 0.6rem', minWidth:140 }}
            value={order.status}
            onChange={(e) => onStatusChange(order._id, e.target.value)}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{orderStatusLabel[s]?.label || s}</option>
            ))}
          </select>
          {/* Botón rápido: marcar como completado */}
          {!isDone && order.status !== 'cancelled' && (
            <button
              className="btn btn-sm"
              style={{ background:'#22c55e', color:'#fff', border:'none', fontSize:'0.78rem', padding:'0.35rem 0.8rem' }}
              onClick={() => onStatusChange(order._id, 'delivered')}
            >
              <FiCheckCircle size={13}/> Completar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Vista de la semana (resumen por día)
═══════════════════════════════════════════════════════════ */
function WeekView({ weekDays, orders, todayKey, onSelect, onStatusChange }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {weekDays.map((day) => {
        const key      = toLocalDate(day);
        const isToday  = key === todayKey;
        const dayOrders= orders.filter((o) => o.workshopAppointment?.date?.split('T')[0] === key);
        const pending  = dayOrders.filter((o) => !['delivered','cancelled'].includes(o.status));

        return (
          <div
            key={key}
            className="card"
            style={{
              padding:'1rem 1.25rem', cursor: dayOrders.length ? 'pointer' : 'default',
              borderLeft: isToday ? '4px solid var(--color-primary)' : '4px solid transparent',
              opacity: dayOrders.length === 0 ? 0.5 : 1,
              transition:'all 0.15s',
            }}
            onClick={() => dayOrders.length && onSelect(key)}
          >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <p style={{ fontWeight:700, fontSize:'0.95rem', textTransform:'capitalize' }}>
                  {isToday && <span style={{ color:'var(--color-primary)', marginRight:'0.4rem' }}>● HOY —</span>}
                  {DAY_FULL[day.getDay()]} {day.getDate()} de {MONTHS[day.getMonth()]}
                </p>
                {dayOrders.length === 0 && (
                  <p style={{ fontSize:'0.8rem', color:'var(--color-text-3)' }}>Sin turnos</p>
                )}
                {dayOrders.length > 0 && (
                  <p style={{ fontSize:'0.82rem', color:'var(--color-text-2)', marginTop:'0.2rem' }}>
                    {dayOrders.length} {dayOrders.length===1?'turno':'turnos'}
                    {pending.length > 0 && <span style={{ color:'#f59e0b', marginLeft:'0.5rem' }}>· {pending.length} pendiente{pending.length>1?'s':''}</span>}
                  </p>
                )}
              </div>
              {dayOrders.length > 0 && (
                <div style={{ display:'flex', gap:'0.35rem', flexWrap:'wrap', justifyContent:'flex-end' }}>
                  {/* Chips de vehículos */}
                  {dayOrders.slice(0,3).map((o, i) => (
                    <span key={i} style={{
                      background:'rgba(245,158,11,0.12)', color:'#f59e0b',
                      borderRadius:'8px', padding:'0.2rem 0.55rem', fontSize:'0.78rem', fontWeight:600,
                    }}>
                      🚗 {o.workshopAppointment?.vehicle || 'Vehículo ' + (i+1)}
                    </span>
                  ))}
                  {dayOrders.length > 3 && (
                    <span style={{ fontSize:'0.78rem', color:'var(--color-text-3)' }}>+{dayOrders.length-3} más</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
