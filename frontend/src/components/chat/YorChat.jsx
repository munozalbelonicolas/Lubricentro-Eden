import { useState, useRef, useEffect } from "react";

// ============================================================
//  CONFIGURACIÓN — Lubricentro Edén
// ============================================================
const LUBRICENTRO = {
  nombre: "Lubricentro Edén",
  ubicacion: "Argentina",
  marcas: ["Castrol", "Mobil", "Shell", "YPF", "Total", "Elf"],
  servicios: ["Cambio de aceite y filtros", "Lubricación general", "Revisión de fluidos"],
  vehiculos: "autos, camionetas, utilitarios y motos",
  tienda_url: "https://lubricentro-eden.com.ar/store",
};

// Uso de constantes de Vite
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// ============================================================
//  BASE DE DATOS DE ACEITES POR CATEGORÍA
// ============================================================
const CATEGORIAS_ACEITE = {
  sintetico: {
    label: "Aceite Sintético",
    emoji: "🔬",
    descripcion: "Mayor protección, ideal para motores modernos y exigentes.",
    url_param: "sintetico",
    viscosidades: ["0W-20", "5W-30", "5W-40"],
  },
  semisintetico: {
    label: "Aceite Semi-sintético",
    emoji: "⚙️",
    descripcion: "Buena relación precio-protección para uso diario.",
    url_param: "semisintetico",
    viscosidades: ["10W-40", "15W-40"],
  },
  mineral: {
    label: "Aceite Mineral",
    emoji: "🛢️",
    descripcion: "Para motores clásicos o de alto kilometraje.",
    url_param: "mineral",
    viscosidades: ["20W-50", "15W-40"],
  },
  diesel: {
    label: "Aceite para Diesel",
    emoji: "🚛",
    descripcion: "Formulado para motores a gasoil, mayor resistencia.",
    url_param: "diesel",
    viscosidades: ["10W-40", "15W-40", "20W-50"],
  },
  moto: {
    label: "Aceite para Moto",
    emoji: "🏍️",
    descripcion: "Especial para motores de moto con embrague en baño de aceite.",
    url_param: "moto",
    viscosidades: ["10W-40", "20W-50"],
  },
};

const generarUrlTienda = (categoria) => {
  const cat = CATEGORIAS_ACEITE[categoria];
  if (!cat) return LUBRICENTRO.tienda_url + "?category=aceite";
  return `${LUBRICENTRO.tienda_url}?category=aceite&subcategory=${cat.url_param}`;
};

// ============================================================
//  SYSTEM PROMPT — Yor
// ============================================================
const SYSTEM_PROMPT = `Sos Yor, el asistente técnico virtual de ${LUBRICENTRO.nombre}.

Tu especialidad es recomendar aceites y lubricantes según el vehículo del cliente.

CATEGORÍAS DE ACEITE DISPONIBLES EN NUESTRA TIENDA:
- sintetico: Sintéticos (0W-20, 5W-30, 5W-40) — motores nafta modernos (post 2010), turbo, exigentes
- semisintetico: Semi-sintéticos (10W-40, 15W-40) — motores nafta de uso diario, GNC
- mineral: Minerales (20W-50, 15W-40) — motores viejos, alto kilometraje, clásicos
- diesel: Aceites diesel (10W-40, 15W-40, 20W-50) — cualquier motor a gasoil
- moto: Aceites para moto (10W-40, 20W-50) — motos con embrague húmedo

REGLAS PARA RECOMENDAR:
1. Si el cliente menciona su vehículo (marca, modelo, año), recomendá la categoría correcta y explicá brevemente por qué.
2. Si no menciona el año o el tipo de motor, preguntá esos datos antes de recomendar.
3. Siempre terminá tu recomendación con esta línea EXACTA (sin cambiarla):
   [LINK_TIENDA:categoria] — donde "categoria" es una de: sintetico, semisintetico, mineral, diesel, moto
   Ejemplo: [LINK_TIENDA:sintetico]
4. Solo incluí UN link por respuesta.
5. Si la pregunta es general (sin vehículo), respondé sin link.

Estilo: amigable, directo, profesional, rioplatense (usá voseo: "viste", "tenés", "contame"). Máximo 4-5 oraciones. Emojis con moderación.
Marcas que manejamos: ${LUBRICENTRO.marcas.join(", ")}.`;

const SUGGESTIONS = [
  "¿Qué aceite necesita mi auto?",
  "¿Cada cuántos km cambio el aceite?",
  "Tengo una moto, ¿qué aceite busco?",
  "Mi auto tiene GNC, ¿qué recomendas?",
];

// ── Estilos ────────────────────────────────────────────────────────────────
const styles = {
  fab: {
    position: "fixed", bottom: "28px", right: "28px",
    width: "60px", height: "60px", borderRadius: "50%",
    background: "linear-gradient(135deg, #CB1A20, #e61e25)",
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 24px rgba(203, 26, 32, 0.45)",
    zIndex: 9999, transition: "transform 0.2s, box-shadow 0.2s",
  },
  panel: {
    position: "fixed", bottom: "100px", right: "28px",
    width: "370px", height: "570px", background: "#111",
    borderRadius: "20px", border: "1px solid #2a2a2a",
    display: "flex", flexDirection: "column", overflow: "hidden",
    zIndex: 9998,
    boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(203, 26, 32, 0.1)",
    fontFamily: "'Rajdhani', 'DM Sans', sans-serif",
  },
  header: {
    background: "#0d0d0d", padding: "14px 18px",
    display: "flex", alignItems: "center", gap: "12px",
    borderBottom: "1px solid #1e1e1e", position: "relative",
  },
  headerLine: {
    position: "absolute", top: 0, left: 0, right: 0, height: "2px",
    background: "linear-gradient(90deg, transparent, #CB1A20, transparent)",
  },
  botAvatar: {
    width: "38px", height: "38px", borderRadius: "50%",
    background: "linear-gradient(135deg, #CB1A20, #2a2a2a)",
    border: "1.5px solid #CB1A20",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "18px", flexShrink: 0,
  },
  headerInfo: { flex: 1 },
  headerTitle: { color: "#f0ede8", fontWeight: "600", fontSize: "14px", lineHeight: 1.2 },
  headerSub: { color: "#6a6560", fontSize: "11px", marginTop: "2px" },
  statusDot: { display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", color: "#6a6560" },
  dot: { width: "6px", height: "6px", borderRadius: "50%", background: "#2ecc71", boxShadow: "0 0 5px #2ecc71" },
  closeBtn: { background: "none", border: "none", color: "#4a4540", cursor: "pointer", fontSize: "18px", padding: "4px", lineHeight: 1 },
  chatArea: {
    flex: 1, overflowY: "auto", padding: "16px",
    display: "flex", flexDirection: "column", gap: "14px", background: "#111",
  },
  msgRow: (isUser) => ({
    display: "flex", flexDirection: isUser ? "row-reverse" : "row",
    gap: "8px", alignItems: "flex-end",
  }),
  msgAvatar: {
    width: "28px", height: "28px", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "13px", flexShrink: 0, background: "#1e1e1e",
  },
  bubble: (isUser) => ({
    maxWidth: "100%", padding: "10px 14px",
    borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
    fontSize: "13px", lineHeight: "1.6", color: "#e8e5e0",
    background: isUser ? "linear-gradient(135deg, #2a1012, #1a0a0b)" : "#1a1a1a",
    border: isUser ? "1px solid #4a1a1d" : "1px solid #222",
  }),
  shopCard: {
    marginTop: "8px",
    background: "linear-gradient(135deg, #1a0a0b, #0d0d0d)",
    border: "1px solid #CB1A20", borderRadius: "12px",
    padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px",
    animation: "yorFadeUp 0.3s ease",
  },
  shopCardTop: { display: "flex", alignItems: "center", gap: "6px" },
  shopCardTitle: { color: "#CB1A20", fontSize: "12px", fontWeight: "700" },
  shopCardDesc: { color: "#8a8070", fontSize: "11px", lineHeight: 1.5 },
  viscWrap: { display: "flex", gap: "5px", flexWrap: "wrap" },
  viscTag: {
    background: "#2a1012", border: "1px solid #4a1a1d",
    color: "#f0ede8", fontSize: "10px", padding: "2px 8px",
    borderRadius: "20px", fontWeight: "600",
  },
  shopBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
    background: "linear-gradient(135deg, #CB1A20, #e61e25)",
    border: "none", borderRadius: "8px", color: "#fff",
    fontSize: "12px", fontWeight: "700", padding: "8px 12px",
    cursor: "pointer", textDecoration: "none", marginTop: "2px",
    transition: "transform 0.2s",
  },
  suggestionsWrap: { display: "flex", flexWrap: "wrap", gap: "6px", paddingLeft: "36px" },
  sugBtn: {
    background: "transparent", border: "1px solid #2a2a2a",
    color: "#6a6560", padding: "5px 10px", borderRadius: "20px",
    fontSize: "11px", cursor: "pointer", fontFamily: "inherit",
    transition: "all 0.2s",
  },
  typing: { display: "flex", gap: "4px", alignItems: "center", padding: "2px 0" },
  typingDot: (i) => ({
    width: "5px", height: "5px", borderRadius: "50%", background: "#CB1A20",
    animation: `yorBounce 1.2s ${i * 0.2}s infinite`,
  }),
  inputArea: {
    display: "flex", gap: "8px", padding: "12px 14px",
    background: "#0d0d0d", borderTop: "1px solid #1e1e1e", alignItems: "flex-end",
  },
  textarea: {
    flex: 1, background: "#1a1a1a", border: "1px solid #2a2a2a",
    borderRadius: "12px", color: "#e8e5e0", fontFamily: "inherit",
    fontSize: "13px", padding: "10px 14px", resize: "none",
    outline: "none", minHeight: "40px", maxHeight: "100px", lineHeight: "1.5",
  },
  sendBtn: (disabled) => ({
    width: "40px", height: "40px", borderRadius: "10px",
    background: disabled ? "#2a2a2a" : "linear-gradient(135deg, #CB1A20, #e61e25)",
    border: "none", cursor: disabled ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    transition: "all 0.2s",
  }),
};

const injectKeyframes = () => {
  if (document.getElementById("yor-keyframes")) return;
  const style = document.createElement("style");
  style.id = "yor-keyframes";
  style.textContent = `
    @keyframes yorPulse {
      0%, 100% { box-shadow: 0 4px 24px rgba(203, 26, 32, 0.45); }
      50% { box-shadow: 0 4px 36px rgba(203, 26, 32, 0.75); }
    }
    @keyframes yorBounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40% { transform: translateY(-5px); opacity: 1; }
    }
    @keyframes yorFadeUp {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes yorSlideIn {
      from { opacity: 0; transform: translateY(16px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    #yor-chat-area::-webkit-scrollbar { width: 3px; }
    #yor-chat-area::-webkit-scrollbar-track { background: transparent; }
    #yor-chat-area::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
  `;
  document.head.appendChild(style);
};

// Separa el texto del tag [LINK_TIENDA:xxx]
const parsearRespuesta = (text) => {
  const match = text.match(/\[LINK_TIENDA:(\w+)\]/);
  if (!match) return { texto: text, categoria: null };
  return {
    texto: text.replace(/\[LINK_TIENDA:\w+\]/, "").trim(),
    categoria: match[1],
  };
};

// Tarjeta con link a la tienda
const ShopCard = ({ categoria }) => {
  const cat = CATEGORIAS_ACEITE[categoria];
  if (!cat) return null;
  return (
    <div style={styles.shopCard}>
      <div style={styles.shopCardTop}>
        <span style={{ fontSize: "16px" }}>{cat.emoji}</span>
        <span style={styles.shopCardTitle}>{cat.label}</span>
      </div>
      <div style={styles.shopCardDesc}>{cat.descripcion}</div>
      <div style={styles.viscWrap}>
        {cat.viscosidades.map(v => <span key={v} style={styles.viscTag}>{v}</span>)}
      </div>
      <a href={generarUrlTienda(categoria)} target="_blank" rel="noopener noreferrer" style={styles.shopBtn}
         onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
         onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff">
          <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-9.8-3.2L3.4 4H1V2h3.6l.8 2H21l-3 9H8.2z"/>
        </svg>
        Ver productos en la tienda →
      </a>
    </div>
  );
};

// ── Componente principal ───────────────────────────────────────────────────
export default function YorChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const chatRef = useRef(null);

  useEffect(() => { injectKeyframes(); }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "¡Hola! Soy **Yor** 🛢️, tu asesor técnico de Lubricentro Edén. Contame para qué vehículo buscás aceite y te digo cuál te conviene y dónde comprarlo.",
        categoria: null,
      }]);
    }
  }, [open]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const formatContent = (text) =>
    text
      .replace(/\*\*(.*?)\*\*/g, "<strong style='color:#CB1A20'>$1</strong>")
      .replace(/\n/g, "<br/>");

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    if (!GROQ_API_KEY || GROQ_API_KEY === 'undefined' || GROQ_API_KEY === '') {
      setMessages(prev => [...prev, { role: 'user', content: msg }, { 
        role: "assistant", 
        content: `⚠️ **Error de configuración**: No se detectó la clave de API (VITE_GROQ_API_KEY). 

Si estás en **Render/GitHub**, por favor asegurate de que el secreto esté configurado y redeployá con cache limpio.` 
      }]);
      setInput("");
      setShowSuggestions(false);
      return;
    }

    setInput("");
    setShowSuggestions(false);

    const newMessages = [...messages, { role: "user", content: msg, categoria: null }];
    setMessages(newMessages);
    setLoading(true);

    const historialApi = newMessages.map(({ role, content }) => ({ role, content }));

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...historialApi],
          max_tokens: 600,
          temperature: 0.6,
        }),
      });

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "No pude procesar tu consulta. Intentá de nuevo.";
      const { texto, categoria } = parsearRespuesta(raw);

      setMessages([...newMessages, { role: "assistant", content: texto, categoria }]);
    } catch {
      setMessages([...newMessages, {
        role: "assistant",
        content: "❌ Hubo un error de conexión. Revisá tu internet e intentá de nuevo.",
        categoria: null,
      }]);
    }

    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {open && (
        <div style={{ ...styles.panel, animation: "yorSlideIn 0.3s ease" }}>

          <div style={styles.header}>
            <div style={styles.headerLine} />
            <div style={styles.botAvatar}>⚙️</div>
            <div style={styles.headerInfo}>
              <div style={styles.headerTitle}>Yor — Asesor Técnico</div>
              <div style={styles.headerSub}>{LUBRICENTRO.nombre}</div>
            </div>
            <div style={styles.statusDot}><div style={styles.dot} /></div>
            <button style={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
          </div>

          <div id="yor-chat-area" ref={chatRef} style={styles.chatArea}>
            {messages.map((m, i) => (
              <div key={i} style={{ animation: "yorFadeUp 0.25s ease" }}>
                <div style={styles.msgRow(m.role === "user")}>
                  <div style={styles.msgAvatar}>{m.role === "user" ? "👤" : "🤖"}</div>
                  <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: "0" }}>
                    <div
                      style={styles.bubble(m.role === "user")}
                      dangerouslySetInnerHTML={{ __html: formatContent(m.content) }}
                    />
                    {m.role === "assistant" && m.categoria && (
                      <ShopCard categoria={m.categoria} />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {showSuggestions && messages.length === 1 && (
              <div style={styles.suggestionsWrap}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} style={styles.sugBtn}
                    onClick={() => sendMessage(s)}
                    onMouseEnter={e => { e.target.style.borderColor = "#CB1A20"; e.target.style.color = "#CB1A20"; }}
                    onMouseLeave={e => { e.target.style.borderColor = "#2a2a2a"; e.target.style.color = "#6a6560"; }}
                  >{s}</button>
                ))}
              </div>
            )}

            {loading && (
              <div style={styles.msgRow(false)}>
                <div style={styles.msgAvatar}>🤖</div>
                <div style={{ ...styles.bubble(false), padding: "12px 16px" }}>
                  <div style={styles.typing}>
                    {[0, 1, 2].map(i => <div key={i} style={styles.typingDot(i)} />)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={styles.inputArea}>
            <textarea
              style={styles.textarea}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ej: Tengo un Fiat Argo 2020..."
              rows={1}
            />
            <button
              style={styles.sendBtn(loading || !input.trim())}
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={loading ? "#555" : "#0d0d0d"}>
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>

        </div>
      )}

      <button
        style={{ ...styles.fab, animation: open ? "none" : "yorPulse 2.5s infinite" }}
        onClick={() => setOpen(!open)}
        title="Hablar con Yor"
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        {open
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="#0d0d0d"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="#0d0d0d"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" /></svg>
        }
      </button>
    </>
  );
}
