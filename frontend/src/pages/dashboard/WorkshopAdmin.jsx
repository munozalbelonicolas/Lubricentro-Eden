import { useState, useEffect, useMemo } from 'react';
import { orderService, taskService } from '../../services/index';
import { orderStatusLabel } from '../../utils/formatters';
import toast from 'react-hot-toast';
import {
  FiRefreshCw, FiCalendar, FiClock, FiTool,
  FiChevronLeft, FiChevronRight, FiUser, FiCheckCircle,
  FiAlertCircle, FiList, FiPlus, FiX, FiTrash2, FiPrinter
} from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ─── Constantes ─────────────────────────────────────────── */
const TIME_SLOTS = ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00'];
const SLOT_LABEL = {
  '08:00-10:00': 'Turno 1 · Mañana temprano',
  '10:00-12:00': 'Turno 2 · Mañana',
  '14:00-16:00': 'Turno 3 · Tarde temprano',
  '16:00-18:00': 'Turno 4 · Tarde',
};
const DONE_STATUSES = ['delivered', 'confirmed', 'done'];
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
  done:       { bg: '#d1fae5', color: '#065f46', text: 'Completado' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b', text: 'Cancelado'  },
};

/* ═══════════════════════════════════════════════════════════ */
export default function WorkshopAdmin() {
  const [orders,     setOrders]     = useState([]);
  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [anchor,     setAnchor]     = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(toLocalDate(new Date()));
  const [tab,        setTab]        = useState('day'); // 'day' | 'week'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState(null);

  const weekDays = useMemo(() => getWeekDays(anchor), [anchor]);
  const todayKey = toLocalDate(new Date());

  /* Cargar Órdenes y Tareas */
  const load = async () => {
    setLoading(true);
    try {
      const [ordersRes, tasksRes] = await Promise.all([
        orderService.getAll({ limit: 500 }),
        taskService.getAll()
      ]);
      
      const ws = (ordersRes.data.orders || []).filter((o) => o.deliveryType === 'workshop');
      setOrders(ws);
      setTasks(tasksRes.data.tasks || []);
    } catch (err) { 
      console.error(err);
      toast.error('Error al cargar la agenda'); 
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (id, status, type) => {
    // Si se marca como completado y es una tarea, abrimos el modal de servicio técnico
    if (status === 'done' && type === 'task') {
      const task = tasks.find(t => t._id === id);
      if (task) {
        setTaskToComplete(task);
        setIsServiceModalOpen(true);
        return;
      }
    }

    try {
      if (type === 'order') {
        await orderService.updateStatus(id, status);
      } else {
        await taskService.update(id, { status });
      }
      toast.success('Estado actualizado.');
      load();
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('¿Seguro que querés eliminar esta tarea?')) return;
    try {
      await taskService.delete(id);
      toast.success('Tarea eliminada');
      load();
    } catch (err) { toast.error(err.message); }
  };

  /* Eventos unificados del día (Órdenes + Tareas) */
  const dayEvents = useMemo(() => {
    const o = orders
      .filter((order) => order.workshopAppointment?.date?.split('T')[0] === selectedDay)
      .map(ev => ({ ...ev, _type: 'order' }));
    
    const t = tasks
      .filter((task) => task.date === selectedDay)
      .map(ev => ({ ...ev, _type: 'task' }));

    return [...o, ...t];
  }, [orders, tasks, selectedDay]);

  const pendingToday = dayEvents.filter((e) => e.status !== 'delivered' && e.status !== 'done' && e.status !== 'cancelled');
  const doneToday    = dayEvents.filter((e) => e.status === 'delivered' || e.status === 'done');

  const countByDay = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const d = o.workshopAppointment?.date?.split('T')[0];
      if (d) map[d] = (map[d] || 0) + 1;
    });
    tasks.forEach((t) => {
      const d = t.date;
      if (d) map[d] = (map[d] || 0) + 1;
    });
    return map;
  }, [orders, tasks]);

  /* Semana */
  const prevWeek = () => { const d = new Date(anchor); d.setDate(d.getDate()-7); setAnchor(d); };
  const nextWeek = () => { const d = new Date(anchor); d.setDate(d.getDate()+7); setAnchor(d); };
  const goToday  = () => { setAnchor(new Date()); setSelectedDay(todayKey); };

  /* 📄 Generación de PDF */
  const generateTaskPDF = (task) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(203, 26, 32); // Rojo Eden
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('LUBRICENTRO EDÉN', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprobante de Servicio Técnico', 105, 30, { align: 'center' });

    // Info del Cliente/Vehículo
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Fecha: ${task.date}`, 14, 55);
    doc.text(`Patente: ${task.plate || 'N/A'}`, 14, 65);
    
    autoTable(doc, {
      startY: 75,
      head: [['Concepto', 'Detalle']],
      body: [
        ['Vehículo/Tarea', task.title],
        ['Kilometraje Actual', task.currentKm ? `${task.currentKm.toLocaleString()} KM` : 'No registrado'],
        ['Descripción', task.description || 'Sin descripción adicional'],
        ['Prioridad', task.priority === 'high' ? 'ALTA' : task.priority === 'medium' ? 'Media' : 'Baja'],
      ],
      theme: 'striped',
      headStyles: { fillStyle: [203, 26, 32] }
    });

    // Destacado Próximo Cambio
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFillColor(243, 244, 246);
    doc.rect(14, finalY, 182, 30, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(203, 26, 32);
    doc.text('PRÓXIMO CAMBIO RECOMENDADO', 105, finalY + 12, { align: 'center' });
    
    doc.setFontSize(24);
    doc.text(task.nextChangeKm ? `${task.nextChangeKm.toLocaleString()} KM` : 'Consultar', 105, finalY + 24, { align: 'center' });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Gracias por confiar en Lubricentro Edén.', 105, 280, { align: 'center' });
    doc.text('Santa Fe, Argentina', 105, 285, { align: 'center' });

    doc.save(`Servicio_${task.plate || 'Eden'}_${task.date}.pdf`);
  };

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
            <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
              <FiPlus size={16}/> Agendar Tarea
            </button>
            <button className="btn btn-ghost btn-sm" onClick={goToday}>📅 Hoy</button>
            <button className="btn btn-ghost btn-sm" onClick={load}><FiRefreshCw size={14}/> Actualizar</button>
          </div>
        </div>

        {/* ── Resumen del día seleccionado ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))', gap:'0.75rem', marginBottom:'1.5rem' }}>
          {[
            { label:'Turnos totales', value: dayEvents.length,    color:'#3b82f6', icon:<FiCalendar size={20}/> },
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
            dayEvents={dayEvents}
            loading={loading}
            todayKey={todayKey}
            onStatusChange={handleStatusChange}
            onDeleteTask={handleDeleteTask}
            onPrint={generateTaskPDF}
          />
        ) : (
          <WeekView
            weekDays={weekDays}
            orders={orders}
            tasks={tasks}
            todayKey={todayKey}
            onSelect={(k) => { setSelectedDay(k); setTab('day'); }}
          />
        )}

        {/* ── Modal Tarea ── */}
        {isModalOpen && (
          <TaskModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            selectedDay={selectedDay}
            onSuccess={load}
          />
        )}

        {/* ── Modal Servicio Técnico (Historial) ── */}
        {isServiceModalOpen && (
          <ServiceModal
            isOpen={isServiceModalOpen}
            onClose={() => {
              setIsServiceModalOpen(false);
              setTaskToComplete(null);
            }}
            task={taskToComplete}
            onSuccess={load}
          />
        )}

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Vista del día
═══════════════════════════════════════════════════════════ */
function DayView({ selectedDay, dayEvents, loading, todayKey, onStatusChange, onDeleteTask, onPrint }) {
  const isToday = selectedDay === todayKey;

  if (loading) return <div className="flex-center" style={{ padding:'3rem' }}><div className="spinner"/></div>;

  if (dayEvents.length === 0) return (
    <div className="card" style={{ textAlign:'center', padding:'3.5rem', color:'var(--color-text-3)' }}>
      <FiClock size={48} style={{ opacity:0.2, marginBottom:'1rem' }}/>
      <p style={{ fontWeight:600, marginBottom:'0.5rem' }}>Sin actividad para este día</p>
      <p style={{ fontSize:'0.85rem' }}>No hay turnos ni tareas agendadas.</p>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize:'1rem', fontWeight:700, marginBottom:'1.25rem', textTransform:'capitalize', display:'flex', alignItems:'center', gap:'0.5rem' }}>
        <FiList size={16} style={{ color:'var(--color-primary)' }}/>
        {isToday ? '🔴 HOY — ' : ''}{formatLongDate(selectedDay)}
        <span style={{ marginLeft:'0.25rem', fontWeight:400, color:'var(--color-text-3)', fontSize:'0.88rem' }}>
          · {dayEvents.length} {dayEvents.length===1?'evento':'eventos'}
        </span>
      </h2>

      {TIME_SLOTS.map((slot) => {
        const slotEvents = dayEvents.filter((e) => (e.workshopAppointment?.timeSlot === slot) || (e.timeSlot === slot));
        if (slotEvents.length === 0) return null;
        return (
          <div key={slot} style={{ marginBottom:'2rem' }}>
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
                  {slot} hs · {slotEvents.length} {slotEvents.length===1?'actividad':'actividades'}
                </p>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {slotEvents.map((ev) => (
                <EventCard 
                  key={ev._id} 
                  event={ev} 
                  onStatusChange={onStatusChange} 
                  onDeleteTask={onDeleteTask} 
                  onPrint={onPrint}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Tarjeta de Evento (Pedido o Tarea) ────────────────── */
function EventCard({ event, onStatusChange, onDeleteTask, onPrint }) {
  const isOrder = event._type === 'order';
  const status = event.status || 'pending';
  const chip   = STATUS_CHIP[status] || { bg:'#e2e8f0', color:'#475569', text: status };
  const isDone = DONE_STATUSES.includes(status);

  return (
    <div className="card" style={{
      padding:'1.25rem 1.4rem',
      borderLeft: isOrder ? '4px solid #f59e0b' : '4px solid #3b82f6',
      opacity: status === 'cancelled' ? 0.55 : 1,
    }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'1rem', alignItems:'flex-start' }}>

        <div>
          {/* Badge de tipo */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.6rem' }}>
            <span style={{ 
              fontSize:'0.65rem', fontWeight:800, textTransform:'uppercase', padding:'0.15rem 0.4rem', borderRadius:'4px',
              background: isOrder ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
              color: isOrder ? '#f59e0b' : '#3b82f6'
            }}>
              {isOrder ? 'Pedido Online' : 'Tarea Manual'}
            </span>
            <span style={{
              background: chip.bg, color: chip.color,
              padding:'0.15rem 0.6rem', borderRadius:'999px', fontSize:'0.72rem', fontWeight:700,
            }}>{chip.text}</span>
          </div>

          <p style={{ fontWeight:800, fontSize:'1.1rem', marginBottom:'0.5rem' }}>
            {isOrder ? (event.workshopAppointment?.vehicle || 'Cambio de Aceite') : event.title}
          </p>

          {isOrder ? (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', color:'var(--color-text-2)', fontSize:'0.9rem', marginBottom:'0.75rem' }}>
                <FiUser size={14}/> {event.userId?.name || 'Cliente'} <span style={{ opacity:0.5 }}>#{event.orderNumber}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
                {event.items.map((item, idx) => (
                  <div key={idx} style={{ fontSize:'0.82rem', color:'var(--color-text-2)' }}>
                    • {item.name} <span style={{ opacity:0.6 }}>×{item.quantity}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
              <p style={{ fontSize:'0.9rem', color:'var(--color-text-2)' }}>{event.description}</p>
              {(event.plate || event.currentKm) && (
                <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.25rem' }}>
                  {event.plate && <span style={{ fontSize:'0.78rem', background:'var(--color-surface-2)', padding:'0.1rem 0.4rem', borderRadius:'4px' }}>📌 {event.plate}</span>}
                  {event.currentKm && <span style={{ fontSize:'0.78rem', background:'var(--color-surface-2)', padding:'0.1rem 0.4rem', borderRadius:'4px' }}>🛣️ {event.currentKm.toLocaleString()} KM</span>}
                </div>
              )}
            </div>
          )}

          {event.notes && <p style={{ fontSize:'0.8rem', fontStyle:'italic', marginTop:'0.5rem', opacity:0.7 }}>💬 {event.notes}</p>}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', alignItems:'flex-end' }}>
          <select
            className="select"
            style={{ fontSize:'0.8rem', padding:'0.25rem 0.5rem', minWidth:130 }}
            value={status}
            onChange={(e) => onStatusChange(event._id, e.target.value, event._type)}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{orderStatusLabel[s]?.label || s}</option>
            ))}
            {!isOrder && <option value="done">Completado</option>}
          </select>
          
          <div style={{ display:'flex', gap:'0.4rem' }}>
            {!isOrder && (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => onPrint(event)} title="Imprimir Comprobante">
                  <FiPrinter size={14} color="var(--color-primary)"/>
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => onDeleteTask(event._id)} title="Eliminar tarea">
                  <FiTrash2 size={14} color="#ef4444"/>
                </button>
              </>
            )}
            {!isDone && status !== 'cancelled' && (
              <button
                className="btn btn-sm"
                style={{ background:'#22c55e', color:'#fff', padding:'0.3rem 0.7rem', fontSize:'0.75rem' }}
                onClick={() => onStatusChange(event._id, isOrder ? 'delivered' : 'done', event._type)}
              >
                <FiCheckCircle size={13}/> {isOrder ? 'Entregar' : 'Hecho'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Vista de la semana (resumen por día)
═══════════════════════════════════════════════════════════ */
function WeekView({ weekDays, orders, tasks, todayKey, onSelect }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {weekDays.map((day) => {
        const key      = toLocalDate(day);
        const isToday  = key === todayKey;
        const dayOrders= orders.filter((o) => o.workshopAppointment?.date?.split('T')[0] === key);
        const dayTasks = tasks.filter((t) => t.date === key);
        const total = dayOrders.length + dayTasks.length;
        
        return (
          <div
            key={key}
            className="card"
            style={{
              padding:'1.25rem 1.4rem', cursor: total ? 'pointer' : 'default',
              borderLeft: isToday ? '4px solid var(--color-primary)' : '4px solid transparent',
              opacity: total === 0 ? 0.5 : 1,
              transition:'all 0.15s',
            }}
            onClick={() => total && onSelect(key)}
          >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <p style={{ fontWeight:700, fontSize:'0.95rem', textTransform:'capitalize' }}>
                  {isToday && <span style={{ color:'var(--color-primary)', marginRight:'0.4rem' }}>● HOY —</span>}
                  {DAY_FULL[day.getDay()]} {day.getDate()} de {MONTHS[day.getMonth()]}
                </p>
                {total === 0 ? (
                  <p style={{ fontSize:'0.8rem', color:'var(--color-text-3)' }}>Sin actividad</p>
                ) : (
                  <p style={{ fontSize:'0.82rem', color:'var(--color-text-2)', marginTop:'0.2rem' }}>
                    {total} {total===1?'evento':'eventos'}
                    {dayOrders.length > 0 && <span style={{ marginLeft:'0.5rem', opacity:0.7 }}>· {dayOrders.length} pedido{dayOrders.length>1?'s':''}</span>}
                    {dayTasks.length > 0 && <span style={{ marginLeft:'0.5rem', opacity:0.7 }}>· {dayTasks.length} tarea{dayTasks.length>1?'s':''}</span>}
                  </p>
                )}
              </div>
              <div style={{ display:'flex', gap:'0.35rem', flexWrap:'wrap', justifyContent:'flex-end' }}>
                {dayOrders.slice(0,2).map((o, i) => (
                  <span key={'o'+i} style={{ background:'rgba(245,158,11,0.12)', color:'#f59e0b', borderRadius:'8px', padding:'0.2rem 0.55rem', fontSize:'0.78rem', fontWeight:600 }}>
                    🚗 {o.workshopAppointment?.vehicle || 'Pedido'}
                  </span>
                ))}
                {dayTasks.slice(0,2).map((t, i) => (
                  <span key={'t'+i} style={{ background:'rgba(59,130,246,0.12)', color:'#3b82f6', borderRadius:'8px', padding:'0.2rem 0.55rem', fontSize:'0.78rem', fontWeight:600 }}>
                    📋 {t.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Modal de Nueva Tarea Manual
═══════════════════════════════════════════════════════════ */
function TaskModal({ isOpen, onClose, selectedDay, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    plate: '',
    currentKm: '',
    nextChangeKm: '',
    date: selectedDay,
    timeSlot: '08:00-10:00',
    priority: 'medium',
    status: 'pending'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await taskService.create(form);
      toast.success('Tarea agendada con éxito');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al agendar tarea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:'450px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <h2 style={{ fontSize:'1.25rem', fontWeight:800 }}>Agendar Tarea Manual</h2>
          <button onClick={onClose} style={{ color:'var(--color-text-3)' }}><FiX size={24}/></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <div className="input-group">
            <label className="input-label">Título o Vehículo</label>
            <input 
              required className="input" placeholder="Ej: VW Gol - Cambio de Aceite"
              value={form.title} onChange={e => setForm({...form, title: e.target.value})}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Descripción / Notas</label>
            <textarea 
              className="input textarea" placeholder="Detalles del trabajo..."
              value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Identificación del Vehículo</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' }}>
              <input 
                className="input" placeholder="Patente"
                value={form.plate} onChange={e => setForm({...form, plate: e.target.value})}
              />
              <input 
                type="number" className="input" placeholder="KM Actual"
                value={form.currentKm} onChange={e => setForm({...form, currentKm: e.target.value})}
              />
              <input 
                type="number" className="input" placeholder="Próximo KM"
                value={form.nextChangeKm} onChange={e => setForm({...form, nextChangeKm: e.target.value})}
              />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div className="input-group">
              <label className="input-label">Fecha</label>
              <input 
                type="date" required className="input"
                value={form.date} onChange={e => setForm({...form, date: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Turno</label>
              <select 
                className="select" value={form.timeSlot}
                onChange={e => setForm({...form, timeSlot: e.target.value})}
              >
                {Object.entries(SLOT_LABEL).map(([val, label]) => (
                  <option key={val} value={val}>{val} hs</option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Prioridad</label>
            <select 
              className="select" value={form.priority}
              onChange={e => setForm({...form, priority: e.target.value})}
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>

          <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.5rem' }}>
            <button type="button" className="btn btn-ghost btn-full" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Agendando...' : 'Confirmar Agenda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Modal de Servicio Técnico (Historial)
   Aquí se capturan los datos finales del trabajo realizado.
═══════════════════════════════════════════════════════════ */
function ServiceModal({ isOpen, onClose, task, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    status: 'done',
    currentKm: task?.currentKm || '',
    nextChangeKm: task?.nextChangeKm || '',
    serviceData: {
      oilBrand: task?.serviceData?.oilBrand || '',
      oilType:  task?.serviceData?.oilType || '',
      filterOil:  task?.serviceData?.filterOil || false,
      filterAir:  task?.serviceData?.filterAir || false,
      filterFuel: task?.serviceData?.filterFuel || false,
      filterCabin: task?.serviceData?.filterCabin || false,
      observations: task?.serviceData?.observations || '',
      photos: task?.serviceData?.photos || []
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await taskService.update(task._id, form);
      toast.success('Servicio completado e historial guardado.');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al guardar servicio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:'550px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <div>
            <h2 style={{ fontSize:'1.25rem', fontWeight:800 }}>Ficha Técnica de Servicio</h2>
            <p style={{ fontSize:'0.85rem', color:'var(--color-text-3)' }}>Patente: {task?.plate || 'S/P'}</p>
          </div>
          <button onClick={onClose} style={{ color:'var(--color-text-3)' }}><FiX size={24}/></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
          
          {/* Kilometraje */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="input-group">
              <label className="input-label">KM Actual</label>
              <input 
                type="number" className="input" required
                value={form.currentKm} onChange={e => setForm({...form, currentKm: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Próximo Cambio (KM)</label>
              <input 
                type="number" className="input"
                value={form.nextChangeKm} onChange={e => setForm({...form, nextChangeKm: e.target.value})}
              />
            </div>
          </div>

          {/* Fluidos */}
          <div style={{ background:'var(--color-surface-2)', padding:'1rem', borderRadius:'8px' }}>
            <h3 style={{ fontSize:'0.9rem', fontWeight:700, marginBottom:'0.75rem', color:'var(--color-primary)' }}>Lubricante utilizado</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div className="input-group">
                <label className="input-label">Marca Aceite</label>
                <input 
                  className="input" placeholder="Ej: Shell, Mobil..."
                  value={form.serviceData.oilBrand} 
                  onChange={e => setForm({...form, serviceData: {...form.serviceData, oilBrand: e.target.value}})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Tipo / Viscosidad</label>
                <input 
                  className="input" placeholder="Ej: 10W40, 5W30..."
                  value={form.serviceData.oilType} 
                  onChange={e => setForm({...form, serviceData: {...form.serviceData, oilType: e.target.value}})}
                />
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div>
            <h3 style={{ fontSize:'0.9rem', fontWeight:700, marginBottom:'0.75rem' }}>Filtros reemplazados</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer' }}>
                <input type="checkbox" checked={form.serviceData.filterOil} onChange={e => setForm({...form, serviceData: {...form.serviceData, filterOil: e.target.checked}})} />
                Filtro de Aceite
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer' }}>
                <input type="checkbox" checked={form.serviceData.filterAir} onChange={e => setForm({...form, serviceData: {...form.serviceData, filterAir: e.target.checked}})} />
                Filtro de Aire
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer' }}>
                <input type="checkbox" checked={form.serviceData.filterFuel} onChange={e => setForm({...form, serviceData: {...form.serviceData, filterFuel: e.target.checked}})} />
                Filtro Combustible
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer' }}>
                <input type="checkbox" checked={form.serviceData.filterCabin} onChange={e => setForm({...form, serviceData: {...form.serviceData, filterCabin: e.target.checked}})} />
                Filtro Habitáculo
              </label>
            </div>
          </div>

          {/* Observaciones */}
          <div className="input-group">
            <label className="input-label">Observaciones y Detalles Técnicos</label>
            <textarea 
              className="input textarea" placeholder="Escribe notas relevantes para el próximo service..."
              value={form.serviceData.observations} 
              onChange={e => setForm({...form, serviceData: {...form.serviceData, observations: e.target.value}})}
              style={{ minHeight:'80px' }}
            />
          </div>

          <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.5rem' }}>
            <button type="button" className="btn btn-ghost btn-full" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ background:'var(--color-success)' }}>
              {loading ? 'Guardando...' : 'Finalizar y Guardar Historial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
