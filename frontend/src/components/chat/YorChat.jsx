import { useState, useRef, useEffect } from "react";

// ============================================================
//  CONFIGURACIÓN — Lubricentro Edén
// ============================================================
const LUBRICENTRO = {
  nombre: "Lubricentro Edén",
  ubicacion: "Argentina",
  marcas: ["Castrol", "Mobil", "Shell", "YPF", "Total", "Elf"],
  servicios: ["Cambio de aceite y filtros", "Lubricación general", "Revisión de fluidos"],
  tienda_url: "https://lubricentro-eden.com.ar/store",
};

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// ============================================================
//  CATEGORÍAS DE ACEITE
// ============================================================
const CATEGORIAS_ACEITE = {
  sintetico:    { label: "Aceite Sintético",      emoji: "🔬", descripcion: "Mayor protección, ideal para motores modernos y turbo",        url_param: "sintetico",    viscosidades: ["0W-20","5W-30","5W-40"] },
  semisintetico:{ label: "Aceite Semi-sintético",  emoji: "⚙️", descripcion: "Buena relación precio-protección para uso diario y GNC",      url_param: "semisintetico",viscosidades: ["10W-40","15W-40"] },
  mineral:      { label: "Aceite Mineral",         emoji: "🛢️", descripcion: "Para motores clásicos o de alto kilometraje",                 url_param: "mineral",      viscosidades: ["20W-50","15W-40"] },
  diesel:       { label: "Aceite para Diesel",     emoji: "🚛", descripcion: "Formulado para motores a gasoil, mayor resistencia",           url_param: "diesel",       viscosidades: ["10W-40","15W-40","20W-50"] },
  moto:         { label: "Aceite para Moto",       emoji: "🏍️", descripcion: "Especial para motores de moto con embrague en baño de aceite", url_param: "moto",         viscosidades: ["10W-40","20W-50"] },
};

const generarUrlTienda = (cat) => {
  const c = CATEGORIAS_ACEITE[cat];
  if (!c) return `${LUBRICENTRO.tienda_url}?category=aceite`;
  return `${LUBRICENTRO.tienda_url}?category=aceite&subcategory=${c.url_param}`;
};

// ============================================================
//  LLAMADA A GROQ — función reutilizable
// ============================================================
const llamarGroq = async (messages, maxTokens = 600) => {
  if (!GROQ_API_KEY) throw new Error("API_KEY_MISSING");
  
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: maxTokens, temperature: 0.5 }),
  });
  
  if (res.status === 401) throw new Error("API_KEY_INVALID");
  
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
};

// ============================================================
//  PROMPT DE SISTEMA (Conversación General)
// ============================================================
const SYSTEM_PROMPT = `Sos Yor, el asistente técnico de ${LUBRICENTRO.nombre}.
Tu especialidad es asesorar sobre aceites y lubricantes.
Respondés preguntas técnicas: tipos de aceite, viscosidades, intervalos de cambio, señales de aceite viejo, diferencias entre sintético/mineral/semi, etc.
Marcas que manejamos: ${LUBRICENTRO.marcas.join(", ")}.
Servicios: ${LUBRICENTRO.servicios.join(", ")}.
Estilo: amigable, directo, rioplatense (usá voseo: "contame", "tenés", "viste"). Máximo 3-4 oraciones. Emojis con moderación.
IMPORTANTE: Si el usuario menciona un vehículo específico, decile que estás buscando las motorizaciones disponibles para ese modelo.`;

// ============================================================
//  DETECTAR VEHÍCULO (Paso 1)
// ============================================================
const detectarVehiculo = async (mensaje) => {
  const prompt = `Analizá este mensaje y respondé SOLO con JSON válido, sin texto extra:
Mensaje: "${mensaje}"

Si el mensaje menciona un vehículo con al menos marca y modelo (el año es opcional), respondé:
{"es_vehiculo": true, "marca": "...", "modelo": "...", "anio": "..." }
Si el año no se menciona, poné anio: "".
Si NO menciona un vehículo concreto, respondé:
{"es_vehiculo": false}`;

  try {
    const raw = await llamarGroq([{ role: "user", content: prompt }], 150);
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { es_vehiculo: false };
  }
};

// ============================================================
//  CONSULTAR MOTORIZACIONES (Paso 2)
// ============================================================
const consultarMotorizaciones = async (marca, modelo, anio) => {
  const anioTexto = anio ? ` ${anio}` : "";
  const prompt = `Sos un experto técnico automotriz. Para el ${marca} ${modelo}${anioTexto}:

1. Listá TODAS las motorizaciones disponibles para ese modelo${anio ? ` en el año ${anio}` : ""} en Argentina.
2. Para CADA motorización, indicá el aceite recomendado.

Respondé SOLO con este JSON válido, sin texto extra:
{
  "vehiculo": "${marca} ${modelo}${anioTexto}",
  "motores": [
    {
      "nombre": "1.6 16v nafta",
      "combustible": "nafta",
      "categoria_aceite": "sintetico",
      "viscosidad": "5W-30",
      "intervalo_km": 10000,
      "nota": "motor moderno, requiere sintético"
    }
  ],
  "conocido": true
}

Si no conocés el modelo, respondé: {"conocido": false}
Las categorías válidas son: sintetico, semisintetico, mineral, diesel, moto`;

  try {
    const raw = await llamarGroq([{ role: "user", content: prompt }], 800);
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { conocido: false };
  }
};

const SUGGESTIONS = [
  "Tengo un Fiat Argo 2020",
  "Toyota Hilux diesel 2019",
  "¿Cada cuántos km cambio el aceite?",
  "Tengo una moto Honda CB 190",
];

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
    position:"fixed", bottom:"100px", right:"28px",
    width:"380px", height:"580px", background:"#111",
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
    background:"linear-gradient(135deg,#CB1A20,#2a2a2a)",
    border:"1.5px solid #CB1A20",
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:"18px", flexShrink:0,
  },
  headerInfo: { flex:1 },
  headerTitle: { color:"#f0ede8", fontWeight:"600", fontSize:"14px", lineHeight:1.2 },
  headerSub: { color:"#6a6560", fontSize:"11px", marginTop:"2px" },
  onlineWrap: { display:"flex", alignItems:"center", gap:"5px" },
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
    borderRadius: u?"16px 4px 16px 16px":"4px 16px 16px 16px",
    fontSize:"13px", lineHeight:"1.6", color:"#e8e5e0",
    background: u?"linear-gradient(135deg,#2a1012,#1a0a0b)":"#1a1a1a",
    border: u?"1px solid #4a1a1d":"1px solid #222",
  }),
  // Tarjeta de motorizaciones
  motorCard: {
    marginTop:"8px",
    background:"#131313", border:"1px solid #2a2a2a",
    borderRadius:"14px", overflow:"hidden",
    animation:"yorFadeUp 0.3s ease",
  },
  motorCardHeader: {
    background:"linear-gradient(135deg,#2a1012,#1a0a0b)",
    borderBottom:"1px solid #4a1a1d",
    padding:"10px 14px",
    display:"flex", alignItems:"center", gap:"8px",
  },
  motorCardTitle: { color:"#CB1A20", fontSize:"12px", fontWeight:"700" },
  motorList: { display:"flex", flexDirection:"column", gap:"0" },
  motorItem: {
    padding:"10px 14px",
    borderBottom:"1px solid #1e1e1e",
    display:"flex", flexDirection:"column", gap:"5px",
  },
  motorItemLast: {
    padding:"10px 14px",
    display:"flex", flexDirection:"column", gap:"5px",
  },
  motorName: { color:"#e8e5e0", fontSize:"12px", fontWeight:"600" },
  motorMeta: { display:"flex", gap:"6px", flexWrap:"wrap", alignItems:"center" },
  tag: (color) => ({
    background: color==="red"?"rgba(203, 26, 32, 0.12)":color==="blue"?"rgba(50,100,200,0.15)":"rgba(50,150,80,0.12)",
    border: `1px solid ${color==="red"?"#CB1A20":color==="blue"?"#2a4a9a":"#1a6a30"}`,
    color: color==="red"?"#CB1A20":color==="blue"?"#7aaaff":"#5ad085",
    fontSize:"10px", padding:"2px 8px", borderRadius:"20px", fontWeight:"600",
  }),
  motorNota: { color:"#6a6560", fontSize:"11px", fontStyle:"italic" },
  shopBtnPrimary: {
    display:"flex", alignItems:"center", justifyContent:"center", gap:"6px",
    background:"linear-gradient(135deg,#CB1A20,#e61e25)",
    border:"none", borderRadius:"0 0 14px 14px",
    color:"#fff", fontSize:"12px", fontWeight:"700",
    padding:"10px 14px", cursor:"pointer", textDecoration:"none",
    width:"100%",
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
    animation:`yorBounce 1.2s ${i * 0.2}s infinite`,
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
    background: d?"#2a2a2a":"linear-gradient(135deg,#CB1A20,#e61e25)",
    border:"none", cursor: d?"not-allowed":"pointer",
    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
    transition: "all 0.2s",
  }),
};

const injectKF = () => {
  if (document.getElementById("yor-kf")) return;
  const s = document.createElement("style");
  s.id = "yor-kf";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&display=swap');
    @keyframes yorPulse { 0%,100%{box-shadow:0 4px 24px rgba(203, 26, 32,.45)} 50%{box-shadow:0 4px 36px rgba(203, 26, 32,.75)} }
    @keyframes yorBounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }
    @keyframes yorFadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes yorSlideIn { from{opacity:0;transform:translateY(16px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
    #yor-chat-area::-webkit-scrollbar{width:3px}
    #yor-chat-area::-webkit-scrollbar-track{background:transparent}
    #yor-chat-area::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:3px}
  `;
  document.head.appendChild(s);
};

const fmt = (t) => t
  .replace(/\*\*(.*?)\*\*/g,"<strong style='color:#CB1A20'>$1</strong>")
  .replace(/\n/g,"<br/>");

// ── Tarjeta con motorizaciones ─────────────────────────────────────────────
const MotorCard = ({ data }) => {
  if (!data?.conocido || !data.motores?.length) return null;

  const catPrincipal = data.motores[0]?.categoria_aceite;
  const url = generarUrlTienda(catPrincipal);

  return (
    <div style={S.motorCard}>
      <div style={S.motorCardHeader}>
        <span style={{ fontSize:"16px" }}>🚗</span>
        <span style={S.motorCardTitle}>{data.vehiculo.toUpperCase()}</span>
      </div>

      <div style={S.motorList}>
        {data.motores.map((m, i) => {
          const cat = CATEGORIAS_ACEITE[m.categoria_aceite];
          const isLast = i === data.motores.length - 1;
          return (
            <div key={i} style={isLast ? S.motorItemLast : S.motorItem}>
              <div style={S.motorName}>
                {m.combustible === "diesel" ? "🚛" : m.combustible === "moto" ? "🏍️" : "⛽"} {m.nombre}
              </div>
              <div style={S.motorMeta}>
                {cat && <span style={S.tag("red")}>{cat.emoji} {cat.label}</span>}
                <span style={S.tag("blue")}>{m.viscosidad}</span>
                <span style={S.tag("green")}>c/ {m.intervalo_km?.toLocaleString()} km</span>
              </div>
              {m.nota && <div style={S.motorNota}>💡 {m.nota}</div>}
            </div>
          );
        })}
      </div>

      <a href={url} target="_blank" rel="noopener noreferrer" style={S.shopBtnPrimary}
         onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
         onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff">
          <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-9.8-3.2L3.4 4H1V2h3.6l.8 2H21l-3 9H8.2z"/>
        </svg>
        Ver aceites recomendados en la tienda →
      </a>
    </div>
  );
};

// ── Componente principal ───────────────────────────────────────────────────
export default function YorChat() {
  const [open, setOpen]               = useState(false);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [showSugs, setShowSugs]       = useState(true);
  const chatRef = useRef(null);

  useEffect(() => { injectKF(); }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role:"assistant",
        content:"¡Hola! Soy **Yor** 🛢️, tu asesor técnico de Lubricentro Edén. Contame qué vehículo tenés y te ayudo a elegir el aceite ideal.",
        motorData: null,
      }]);
    }
  }, [open]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    // Validación de clave API (Seguridad)
    if (!GROQ_API_KEY || GROQ_API_KEY === 'undefined' || GROQ_API_KEY === '') {
      setMessages(prev => [...prev, { role: 'user', content: msg }, { 
        role: "assistant", 
        content: `⚠️ **Error de configuración**: No se detectó la clave de API (VITE_GROQ_API_KEY). 

Si estás en **GitHub/Render**, asegurate de haber configurado el Secret y elegí **"Clear Cache and Deploy"**.` 
      }]);
      setInput("");
      setShowSugs(false);
      return;
    }

    setInput("");
    setShowSugs(false);

    setMessages(prev => [...prev, { role:"user", content:msg, motorData:null }]);
    setLoading(true);

    try {
      // ── PASO 1: Detectar vehículo ──
      const vehiculo = await detectarVehiculo(msg);

      if (vehiculo.es_vehiculo) {
        // Mensaje intermedio para mejorar UX
        setMessages(prev => [...prev, { role:"assistant", content: `Entendido. Buscando las motorizaciones disponibles para el **${vehiculo.marca} ${vehiculo.modelo}**...`, motorData:null }]);
        
        // ── PASO 2: Consultar motorizaciones ──
        const motorData = await consultarMotorizaciones(
          vehiculo.marca, vehiculo.modelo, vehiculo.anio
        );

        if (motorData.conocido && motorData.motores?.length) {
          const reply = motorData.motores.length === 1
            ? `Para el **${motorData.vehiculo}** encontré esta motorización con su aceite recomendado:`
            : `Para el **${motorData.vehiculo}** encontré **${motorData.motores.length} motorizaciones**. Identificá la tuya para ver el aceite ideal:`;

          setMessages(prev => [...prev, { role:"assistant", content:reply, motorData }]);
        } else {
          // Fallback a conversación general si no hay datos técnicos precisos
          const historial = messages.map(({role,content})=>({role,content}));
          const reply = await llamarGroq([{role:"system",content:SYSTEM_PROMPT}, ...historial, {role:"user", content:msg}]);
          setMessages(prev => [...prev, { role:"assistant", content: reply, motorData:null }]);
        }

      } else {
        // ── Conversación general ──
        const historial = messages.map(({role,content})=>({role,content}));
        const reply = await llamarGroq([{role:"system",content:SYSTEM_PROMPT}, ...historial, {role:"user", content:msg}]);
        setMessages(prev => [...prev, { role:"assistant", content: reply, motorData:null }]);
      }

    } catch (err) {
      const errorMsg = err.message === 'API_KEY_INVALID' 
        ? "❌ La clave de API de Groq parece no ser válida (Error 401)." 
        : "❌ Hubo un error al conectar con Yor. Por favor, intentá de nuevo.";
      setMessages(prev => [...prev, { role:"assistant", content: errorMsg, motorData:null }]);
    }

    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {open && (
        <div style={{...S.panel, animation:"yorSlideIn 0.3s ease"}}>

          {/* Header */}
          <div style={S.header}>
            <div style={S.headerLine}/>
            <div style={S.botAvatar}>⚙️</div>
            <div style={S.headerInfo}>
              <div style={S.headerTitle}>Yor — Asesor Técnico</div>
              <div style={S.headerSub}>{LUBRICENTRO.nombre}</div>
            </div>
            <div style={S.onlineWrap}><div style={S.onlineDot}/></div>
            <button style={S.closeBtn} onClick={()=>setOpen(false)}>✕</button>
          </div>

          {/* Mensajes */}
          <div id="yor-chat-area" ref={chatRef} style={S.chatArea}>
            {messages.map((m,i) => (
              <div key={i} style={{animation:"yorFadeUp 0.25s ease"}}>
                <div style={S.msgRow(m.role==="user")}>
                  <div style={S.msgAvatar}>{m.role==="user"?"👤":"🤖"}</div>
                  <div style={{maxWidth:"85%", display:"flex", flexDirection:"column"}}>
                    <div style={S.bubble(m.role==="user")}
                      dangerouslySetInnerHTML={{__html: fmt(m.content)}}/>
                    {m.role==="assistant" && m.motorData && (
                      <MotorCard data={m.motorData}/>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {showSugs && messages.length===1 && (
              <div style={S.suggestionsWrap}>
                {SUGGESTIONS.map((s,i)=>(
                  <button key={i} style={S.sugBtn}
                    onClick={()=>sendMessage(s)}
                    onMouseEnter={e=>{e.target.style.borderColor="#CB1A20";e.target.style.color="#CB1A20"}}
                    onMouseLeave={e=>{e.target.style.borderColor="#2a2a2a";e.target.style.color="#6a6560"}}
                  >{s}</button>
                ))}
              </div>
            )}

            {/* Typing */}
            {loading && (
              <div style={S.msgRow(false)}>
                <div style={S.msgAvatar}>🤖</div>
                <div style={{...S.bubble(false), padding:"12px 16px"}}>
                  <div style={S.typing}>
                    {[0,1,2].map(i=><div key={i} style={S.typingDot(i)}/>)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={S.inputArea}>
            <textarea style={S.textarea} value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ej: Fiat Argo 2020, Toyota Hilux..."
              rows={1}
            />
            <button style={S.sendBtn(loading||!input.trim())}
              onClick={()=>sendMessage()}
              disabled={loading||!input.trim()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={loading?"#555":"#fff"}>
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>

        </div>
      )}

      {/* Botón flotante */}
      <button
        style={{...S.fab, animation:open?"none":"yorPulse 2.5s infinite"}}
        onClick={()=>setOpen(!open)}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
        title="Hablar con Yor"
      >
        {open
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
        }
      </button>
    </>
  );
}
