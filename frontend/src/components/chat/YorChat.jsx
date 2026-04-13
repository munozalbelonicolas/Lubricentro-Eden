import { useState, useRef, useEffect } from "react";

// ============================================================
//  CONFIGURACIÓN — Lubricentro Edén
// ============================================================
const LUBRICENTRO = {
  nombre: "Lubricentro Edén",
  tienda_url: "https://lubricentro-eden.com.ar/store",
};

// URL de nuestra propia API (Backend)
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://lubricentro-eden.onrender.com/api";

// Categorías para links de tienda
const CATEGORIAS = {
  sintetico:     { label: "Sintético",      emoji: "🔬", url_param: "sintetico" },
  semisintetico: { label: "Semi-sintético", emoji: "⚙️", url_param: "semisintetico" },
  mineral:       { label: "Mineral",        emoji: "🛢️", url_param: "mineral" },
  diesel:        { label: "Diesel",         emoji: "🚛", url_param: "diesel" },
  moto:          { label: "Moto",           emoji: "🏍️", url_param: "moto" },
};

const urlTienda = (cat) => {
  const c = CATEGORIAS[cat];
  return `${LUBRICENTRO.tienda_url}?category=aceite${c ? `&subcategory=${c.url_param}` : ""}`;
};

// ============================================================
//  ESTILOS (Rojo Edén Theme)
// ============================================================
const S = {
  fab: {
    position:"fixed", bottom:"28px", right:"28px",
    width:"60px", height:"60px", borderRadius:"50%",
    background:"linear-gradient(135deg,#CB1A20,#e61e25)",
    border:"none", cursor:"pointer",
    display:"flex", alignItems:"center", justifyContent:"center",
    boxShadow:"0 4px 24px rgba(203, 26, 32, 0.45)",
    zIndex:9999, transition:"transform 0.2s",
  },
  panel: {
    position:"fixed", bottom:"100px", right:"20px",
    width:"calc(100vw - 40px)", maxWidth:"380px", height:"calc(100vh - 120px)", maxHeight:"590px",
    background:"#111",
    borderRadius:"20px", border:"1px solid #2a2a2a",
    display:"flex", flexDirection:"column", overflow:"hidden",
    zIndex:9998,
    boxShadow:"0 24px 60px rgba(0,0,0,0.7),0 0 0 1px rgba(203, 26, 32, 0.1)",
    fontFamily:"'Rajdhani', 'DM Sans', sans-serif",
  },
  header: {
    background:"#0d0d0d", padding:"14px 18px",
    display:"flex", alignItems:"center", gap:"12px",
    borderBottom:"1px solid #1e1e1e", position:"relative",
  },
  headerLine: {
    position:"absolute", top:0, left:0, right:0, height:"2px",
    background:"linear-gradient(90deg,transparent,#CB1A20,transparent)",
  },
  botAvatar: {
    width:"38px", height:"38px", borderRadius:"50%",
    background:"#000",
    border:"1.5px solid #CB1A20",
    overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center",
    flexShrink:0,
  },
  botLogo: {
    width:"100%", height:"100%", objectFit:"contain", padding:"4px",
  },
  headerInfo: { flex:1 },
  headerTitle: { color:"#f0ede8", fontWeight:"600", fontSize:"14px", lineHeight:1.2 },
  headerSub: { color:"#6a6560", fontSize:"11px", marginTop:"2px" },
  onlineDot: { width:"6px", height:"6px", borderRadius:"50%", background:"#2ecc71", boxShadow:"0 0 5px #2ecc71" },
  closeBtn: { background:"none", border:"none", color:"#4a4540", cursor:"pointer", fontSize:"18px", padding:"4px" },
  chatArea: {
    flex:1, overflowY:"auto", padding:"16px",
    display:"flex", flexDirection:"column", gap:"14px", background:"#111",
  },
  msgRow: (u) => ({ display:"flex", flexDirection:u?"row-reverse":"row", gap:"8px", alignItems:"flex-end" }),
  msgAvatar: {
    width:"28px", height:"28px", borderRadius:"50%",
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:"13px", flexShrink:0, background:"#1e1e1e",
  },
  bubble: (u) => ({
    maxWidth:"100%", padding:"10px 14px",
    borderRadius:u?"16px 4px 16px 16px":"4px 16px 16px 16px",
    fontSize:"13px", lineHeight:"1.65", color:"#e8e5e0",
    background:u?"linear-gradient(135deg,#2a1012,#1a0a0b)":"#1a1a1a",
    border:u?"1px solid #4a1a1d":"1px solid #222",
  }),

  motorPickCard: {
    marginTop:"8px", background:"#151515",
    border:"1px solid #2a2a2a", borderRadius:"14px", overflow:"hidden",
    animation: "yorFadeUp 0.3s ease",
  },
  motorPickHeader: {
    background:"linear-gradient(135deg,#2a1012,#1a0a0b)",
    borderBottom:"1px solid #4a1a1d",
    padding:"9px 14px", fontSize:"11px",
    color:"#CB1A20", fontWeight:"700",
    display:"flex", alignItems:"center", gap:"6px",
  },
  motorBtnWrap: { display:"flex", flexDirection:"column", gap:"0" },
  motorBtn: {
    background:"transparent", border:"none", borderBottom:"1px solid #1e1e1e",
    color:"#c8c5c0", fontSize:"12px", fontWeight:"600",
    padding:"11px 14px", cursor:"pointer", textAlign:"left",
    display:"flex", alignItems:"center", gap:"8px",
    transition:"background 0.15s, color 0.15s",
    fontFamily:"inherit",
  },
  motorBtnLast: {
    background:"transparent", border:"none",
    color:"#c8c5c0", fontSize:"12px", fontWeight:"600",
    padding:"11px 14px", cursor:"pointer", textAlign:"left",
    display:"flex", alignItems:"center", gap:"8px",
    transition:"background 0.15s, color 0.15s",
    fontFamily:"inherit",
  },

  recoCard: {
    marginTop:"8px", background:"#131313",
    border:"1px solid #CB1A20", borderRadius:"14px", overflow:"hidden",
    animation: "yorFadeUp 0.3s ease",
  },
  recoHeader: {
    background:"linear-gradient(135deg,#2a1012,#1a0a0b)",
    borderBottom:"1px solid #4a1a1d",
    padding:"10px 14px",
    display:"flex", alignItems:"center", gap:"8px",
  },
  recoHeaderTitle: { color:"#CB1A20", fontSize:"12px", fontWeight:"700" },
  recoBody: { padding:"12px 14px", display:"flex", flexDirection:"column", gap:"10px" },
  recoRow: { display:"flex", justifyContent:"space-between", alignItems:"center" },
  recoLabel: { color:"#6a6560", fontSize:"11px" },
  recoValue: { color:"#e8e5e0", fontSize:"13px", fontWeight:"600", textAlign:"right" },
  recoHighlight: { color:"#CB1A20", fontSize:"14px", fontWeight:"700", textAlign:"right" },
  recoMarca: { color:"#7aaaff", fontSize:"13px", fontWeight:"600", textAlign:"right" },
  recoSpec: { color:"#8a8070", fontSize:"10px", textAlign:"right" },
  recoNota: {
    background:"rgba(203, 26, 32, 0.05)", border:"1px solid rgba(203, 26, 32, 0.15)",
    borderRadius:"8px", padding:"8px 10px",
    color:"#a06910", fontSize:"11px", lineHeight:1.5,
  },
  recoBtn: {
    display:"flex", alignItems:"center", justifyContent:"center", gap:"6px",
    background:"linear-gradient(135deg,#CB1A20,#e61e25)",
    border:"none", borderRadius:"0 0 14px 14px",
    color:"#fff", fontSize:"12px", fontWeight:"700",
    padding:"11px 14px", cursor:"pointer", textDecoration:"none", width:"100%",
    transition: "transform 0.2s",
  },

  suggestionsWrap: { display:"flex", flexWrap:"wrap", gap:"6px", paddingLeft:"36px" },
  sugBtn: {
    background:"transparent", border:"1px solid #2a2a2a",
    color:"#6a6560", padding:"5px 10px", borderRadius:"20px",
    fontSize:"11px", cursor:"pointer", fontFamily:"inherit",
    transition: "all 0.2s",
  },
  typing: { display:"flex", gap:"4px", alignItems:"center", padding:"2px 0" },
  typingDot: (i) => ({
    width:"5px", height:"5px", borderRadius:"50%", background:"#CB1A20",
    animation:`yorBounce 1.2s ${i*0.2}s infinite`,
  }),
  inputArea: {
    display:"flex", gap:"8px", padding:"12px 14px",
    background:"#0d0d0d", borderTop:"1px solid #1e1e1e", alignItems:"flex-end",
  },
  textarea: {
    flex:1, background:"#1a1a1a", border:"1px solid #2a2a2a",
    borderRadius:"12px", color:"#e8e5e0", fontFamily:"inherit",
    fontSize:"13px", padding:"10px 14px", resize:"none",
    outline:"none", minHeight:"40px", maxHeight:"100px", lineHeight:"1.5",
  },
  sendBtn: (d) => ({
    width:"40px", height:"40px", borderRadius:"10px",
    background:d?"#2a2a2a":"linear-gradient(135deg,#CB1A20,#e61e25)",
    border:"none", cursor:d?"not-allowed":"pointer",
    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
    transition: "all 0.2s",
  }),
  divider: { height:"1px", background:"#1e1e1e", margin:"0 14px" },
};

const injectKF = () => {
  if (document.getElementById("yor-kf")) return;
  const s = document.createElement("style");
  s.id = "yor-kf";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes yorPulse { 0%,100%{box-shadow:0 4px 24px rgba(203, 26, 32,.45)} 50%{box-shadow:0 4px 36px rgba(203, 26, 32,.75)} }
    @keyframes yorBounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }
    @keyframes yorFadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes yorSlideIn { from{opacity:0;transform:translateY(16px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
    #yor-chat-area::-webkit-scrollbar{width:3px}
    #yor-chat-area::-webkit-scrollbar-track{background:transparent}
    #yor-chat-area::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:3px}
    .yor-motor-btn:hover{background:#1a1a1a !important;color:#CB1A20 !important}
  `;
  document.head.appendChild(s);
};

const fmt = (t) => t
  .replace(/\*\*(.*?)\*\*/g,"<strong style='color:#CB1A20'>$1</strong>")
  .replace(/\n/g,"<br/>");

// ── Componentes de UI ─────────────────────────────────────────────────────
const MotorPickCard = ({ vehiculo, motores, onSelect }) => (
  <div style={S.motorPickCard}>
    <div style={S.motorPickHeader}>🚗 {vehiculo.toUpperCase()} — ¿Cuál es tu motor?</div>
    <div style={S.motorBtnWrap}>
      {motores.map((m, i) => (
        <button key={i} className="yor-motor-btn" onClick={() => onSelect(m)}
                style={i === motores.length - 1 ? S.motorBtnLast : S.motorBtn}>
          <span style={{ color:"#CB1A20", fontSize:"10px" }}>▶</span> {m}
        </button>
      ))}
    </div>
  </div>
);

const RecoCard = ({ reco }) => {
  if (!reco) return null;
  const cat = CATEGORIAS[reco.tipo];
  return (
    <div style={S.recoCard}>
      <div style={S.recoHeader}>
        <span style={{ fontSize:"16px" }}>{cat?.emoji || "🛢️"}</span>
        <span style={S.recoHeaderTitle}>{reco.motor.toUpperCase()} — Recomendación técnica</span>
      </div>
      <div style={S.recoBody}>
        <div style={S.recoRow}><span style={S.recoLabel}>Viscosidad</span><span style={S.recoHighlight}>{reco.viscosidad}</span></div>
        <div style={S.divider}/><div style={S.recoRow}><span style={S.recoLabel}>Tipo base</span><span style={S.recoValue}>{cat?.label || reco.tipo}</span></div>
        <div style={S.divider}/><div style={S.recoRow}><span style={S.recoLabel}>Marca de fábrica</span><div style={{ textAlign:"right" }}><div style={S.recoMarca}>{reco.marca_fabrica}</div>{reco.especificacion && <div style={S.recoSpec}>{reco.especificacion}</div>}</div></div>
        <div style={S.divider}/><div style={S.recoRow}><span style={S.recoLabel}>Intervalo</span><span style={S.recoValue}>{reco.intervalo_km?.toLocaleString()} km{reco.intervalo_meses ? ` o ${reco.intervalo_meses}m` : ""}</span></div>
        {reco.nota && <div style={S.recoNota}>💡 {reco.nota}</div>}
      </div>
      <a href={urlTienda(reco.tipo)} target="_blank" rel="noopener noreferrer" style={S.recoBtn}>Comprar en la tienda →</a>
    </div>
  );
};

// ── Slot Picker (Calendario de turnos) ────────────────────────────────────
const SlotPickerCard = ({ slots, onSelect }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const dates = Object.keys(slots || {});
  if (dates.length === 0) return (
    <div style={S.motorPickCard}>
      <div style={{padding:'14px',color:'#6a6560',fontSize:'12px',textAlign:'center'}}>
        No hay turnos disponibles en los próximos días.
      </div>
    </div>
  );

  const active = selectedDate || dates[0];
  const activeSlots = slots[active]?.available || [];

  return (
    <div style={{...S.motorPickCard, maxWidth:'100%'}}>
      <div style={S.motorPickHeader}>📅 SELECCIONÁ DÍA Y HORARIO</div>
      {/* Date tabs */}
      <div style={{display:'flex', overflowX:'auto', gap:'0', borderBottom:'1px solid #2a2a2a'}}>
        {dates.map(d => (
          <button key={d} onClick={() => setSelectedDate(d)} style={{
            flex:'none', padding:'8px 12px', border:'none', cursor:'pointer',
            background: d === active ? '#2a1012' : 'transparent',
            color: d === active ? '#CB1A20' : '#6a6560',
            borderBottom: d === active ? '2px solid #CB1A20' : '2px solid transparent',
            fontSize:'11px', fontWeight:700, fontFamily:'inherit', whiteSpace:'nowrap',
            transition:'all 0.15s',
          }}>{slots[d]?.label}</button>
        ))}
      </div>
      {/* Time slots grid */}
      <div style={{padding:'10px', display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'6px'}}>
        {activeSlots.length === 0 ? (
          <div style={{gridColumn:'1/-1', textAlign:'center', color:'#6a6560', fontSize:'11px', padding:'12px'}}>
            Sin horarios disponibles
          </div>
        ) : activeSlots.map(slot => (
          <button key={slot} onClick={() => onSelect(active, slot)} className="yor-motor-btn" style={{
            padding:'7px 4px', borderRadius:'8px', border:'1px solid #2a2a2a',
            background:'#1a1a1a', color:'#e8e5e0', fontSize:'11px', fontWeight:600,
            cursor:'pointer', textAlign:'center', fontFamily:'inherit',
            transition:'all 0.15s',
          }}>{slot}</button>
        ))}
      </div>
    </div>
  );
};

// ============================================================
//  COMPONENTE PRINCIPAL
// Note: SlotPickerCard uses useState, imported at top
// ============================================================
export default function YorChat() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [sessionId, setSessionId] = useState(localStorage.getItem("yor_session_id") || null);

  const chatRef = useRef(null);

  useEffect(() => { injectKF(); }, []);

  // Cargar historial al abrir si hay sesión válida
  useEffect(() => {
    if (open && messages.length === 0) {
      if (sessionId && sessionId !== "null" && sessionId !== "undefined") {
        fetch(`${API_BASE_URL}/chat/session/${sessionId}`)
          .then(res => res.json())
          .then(data => {
            if (data.messages) setMessages(data.messages);
            else pushWelcome();
          })
          .catch(() => pushWelcome());
      } else {
        pushWelcome();
      }
    }
  }, [open]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const pushWelcome = () => {
    setMessages([{
      role:"assistant", content:"¡Hola! Soy **Yor** 🛢️, tu asesor técnico de Lubricentro Edén. Contame el vehículo y el año para asesorarte con su aceite ideal.",
      extra:null,
    }]);
  };

  const pushMsg = (role, content, extra = null) =>
    setMessages(prev => [...prev, { role, content, extra }]);

  // ── Acciones de API ─────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput("");
    pushMsg("user", msg);
    setLoading(true);

    try {
      // Solo enviamos sessionId si es un valor real
      const sId = (sessionId && sessionId !== "null" && sessionId !== "undefined") ? sessionId : undefined;

      const res = await fetch(`${API_BASE_URL}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId: sId }),
      });
      const data = await res.json();

      if (data.error) {
        // Si el servidor dice que la sesión es inválida, la limpiamos y reintentamos sin sesión
        if (data.error.includes("sessionId")) {
          localStorage.removeItem("yor_session_id");
          setSessionId(null);
          // Opcional: podrías re-ejecutar la llamada aquí, por ahora informamos
          throw new Error("Sesión expirada. Por favor, preguntá de nuevo.");
        }
        throw new Error(data.error);
      }

      // Guardar sesión si es nueva
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem("yor_session_id", data.sessionId);
      }

      if (data.type === "motor_pick") {
        pushMsg("assistant", data.message, { type: "motor_pick", vehiculo: data.vehiculo, motores: data.motores });
      } else if (data.type === "slot_picker") {
        pushMsg("assistant", data.message, { type: "slot_picker", slots: data.slots });
      } else {
        pushMsg("assistant", data.message);
      }
    } catch (err) {
      pushMsg("assistant", "❌ " + (err.message || "Error de conexión."));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMotor = async (motor) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/chat/select-motor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, motor }),
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      pushMsg("user", motor);
      pushMsg("assistant", data.message, { type: "reco", reco: data.reco });
    } catch (err) {
      pushMsg("assistant", "❌ Error al consultar motor.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {open && (
        <div style={{...S.panel, animation:"yorSlideIn 0.3s ease"}}>
          <div style={S.header}>
            <div style={S.headerLine}/><div style={S.botAvatar}><img src="/logos/Logo-Eden.png" alt="Yor" style={S.botLogo}/></div>
            <div style={S.headerInfo}><div style={S.headerTitle}>Yor — Asesor Técnico</div><div style={S.headerSub}>Lubricentro Edén</div></div>
            <div style={S.onlineDot}/><button style={S.closeBtn} onClick={()=>setOpen(false)}>✕</button>
          </div>

          <div id="yor-chat-area" ref={chatRef} style={S.chatArea}>
            {messages.map((m, i) => (
              <div key={i} style={{animation:"yorFadeUp 0.25s ease"}}>
                <div style={S.msgRow(m.role==="user")}>
                  <div style={S.msgAvatar}>{m.role==="user"?"👤":"🤖"}</div>
                  <div style={{maxWidth:"85%", display:"flex", flexDirection:"column"}}>
                    <div style={S.bubble(m.role==="user")} dangerouslySetInnerHTML={{__html:fmt(m.content)}}/>
                    {m.extra?.type==="motor_pick" && <MotorPickCard vehiculo={m.extra.vehiculo} motores={m.extra.motores} onSelect={handleSelectMotor}/>}
                    {m.extra?.type==="reco" && <RecoCard reco={m.extra.reco}/>}
                    {m.extra?.type==="slot_picker" && <SlotPickerCard slots={m.extra.slots} onSelect={(date, slot) => sendMessage(`${date} ${slot}`)}/>}
                  </div>
                </div>
              </div>
            ))}
            {loading && <div style={S.msgRow(false)}><div style={S.msgAvatar}>🤖</div><div style={{...S.bubble(false), padding:"12px 16px"}}><div style={S.typing}>{[0,1,2].map(i=><div key={i} style={S.typingDot(i)}/>)}</div></div></div>}
          </div>

          <div style={S.inputArea}>
            <textarea style={S.textarea} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} placeholder="Ej: VW Gol Trend 2015..." rows={1}/>
            <button style={S.sendBtn(loading||!input.trim())} onClick={()=>sendMessage()} disabled={loading||!input.trim()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={loading?"#555":"#fff"}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      )}

      <button style={{...S.fab, animation:open?"none":"yorPulse 2.5s infinite"}} onClick={()=>setOpen(!open)} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        {open ? <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>}
      </button>
    </>
  );
}
