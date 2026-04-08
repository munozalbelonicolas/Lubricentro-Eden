import { useState, useRef, useEffect } from "react";

// ============================================================
//  CONFIGURACIÓN — Lubricentro Eden
// ============================================================
const LUBRICENTRO = {
  nombre: "Lubricentro Eden",
  ubicacion: "Buenos Aires, Argentina",
  marcas: ["Castrol", "Mobil", "Shell", "YPF", "Total", "Elf"],
  servicios: ["Cambio de aceite y filtros", "Lubricación general", "Revisión de fluidos", "Venta de aditivos"],
  vehiculos: "autos, camionetas, utilitarios y motos",
};

// Uso de constantes de Vite
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const SYSTEM_PROMPT = `Sos Beepy, el asistente técnico virtual de ${LUBRICENTRO.nombre}, ubicado en ${LUBRICENTRO.ubicacion}.

Tu especialidad es asesorar sobre aceites y lubricantes. Respondés preguntas técnicas sobre:
- Tipos de aceite (sintético, semi-sintético, mineral)
- Viscosidades (5W-30, 10W-40, 0W-20, etc.)
- Intervalos de cambio según uso y tipo de motor
- Aceites para distintos motores (nafta, diesel, GNC, híbrido)
- Lubricantes para caja, diferencial, dirección hidráulica
- Señales de que el aceite necesita cambio

Marcas que manejamos: ${LUBRICENTRO.marcas.join(", ")}.
Atendemos: ${LUBRICENTRO.vehiculos}.
Servicios: ${LUBRICENTRO.servicios.join(", ")}.

Estilo: amigable, directo, profesional. Español rioplatense (usá voseo: "viste", "tenés", "comprá"). Máximo 3-4 oraciones salvo que pidan mucho detalle. Usá emojis con moderación.`;

const SUGGESTIONS = [
  "¿Qué aceite necesita mi auto?",
  "¿Cada cuántos km se cambia el aceite?",
  "¿Qué diferencia hay entre sintético y mineral?",
  "¿Qué significa 5W-30?",
];

// ── Estilos en objeto para no depender de CSS externo ──────────────────────

const styles = {
  // Botón flotante
  fab: {
    position: "fixed",
    bottom: "28px",
    right: "28px",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #CB1A20, #e61e25)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 24px rgba(203, 26, 32, 0.45)",
    zIndex: 9999,
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  fabPulse: {
    animation: "beepyPulse 2.5s infinite",
  },
  // Panel del chat
  panel: {
    position: "fixed",
    bottom: "100px",
    right: "28px",
    width: "370px",
    height: "540px",
    background: "#111",
    borderRadius: "20px",
    border: "1px solid #2a2a2a",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 9998,
    boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(203, 26, 32, 0.1)",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  // Header
  header: {
    background: "#0d0d0d",
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderBottom: "1px solid #1e1e1e",
    position: "relative",
  },
  headerLine: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: "2px",
    background: "linear-gradient(90deg, transparent, #CB1A20, transparent)",
  },
  avatar: {
    width: "38px", height: "38px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #CB1A20, #2a2a2a)",
    border: "1.5px solid #CB1A20",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "18px", flexShrink: 0,
  },
  headerInfo: { flex: 1 },
  headerTitle: {
    color: "#f0ede8",
    fontWeight: "600",
    fontSize: "14px",
    letterSpacing: "0.3px",
    lineHeight: 1.2,
  },
  headerSub: {
    color: "#6a6560",
    fontSize: "11px",
    marginTop: "2px",
  },
  statusDot: {
    display: "flex", alignItems: "center", gap: "5px",
    fontSize: "10px", color: "#6a6560",
  },
  dot: {
    width: "6px", height: "6px",
    borderRadius: "50%",
    background: "#2ecc71",
    boxShadow: "0 0 5px #2ecc71",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#4a4540",
    cursor: "pointer",
    fontSize: "18px",
    padding: "4px",
    lineHeight: 1,
    transition: "color 0.2s",
  },
  // Mensajes
  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    background: "#111",
  },
  msgRow: (isUser) => ({
    display: "flex",
    flexDirection: isUser ? "row-reverse" : "row",
    gap: "8px",
    alignItems: "flex-end",
  }),
  msgAvatar: {
    width: "28px", height: "28px",
    borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "13px", flexShrink: 0,
    background: "#1e1e1e",
  },
  bubble: (isUser) => ({
    maxWidth: "80%",
    padding: "10px 14px",
    borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
    fontSize: "13px",
    lineHeight: "1.6",
    color: "#e8e5e0",
    background: isUser
      ? "linear-gradient(135deg, #2a1012, #1a0a0b)"
      : "#1a1a1a",
    border: isUser ? "1px solid #4a1a1d" : "1px solid #222",
  }),
  // Sugerencias
  suggestionsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    paddingLeft: "36px",
  },
  sugBtn: {
    background: "transparent",
    border: "1px solid #2a2a2a",
    color: "#6a6560",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.2s",
  },
  // Typing
  typing: {
    display: "flex", gap: "4px", alignItems: "center", padding: "2px 0",
  },
  typingDot: (i) => ({
    width: "5px", height: "5px",
    borderRadius: "50%",
    background: "#CB1A20",
    animation: `beepyBounce 1.2s ${i * 0.2}s infinite`,
  }),
  // Input
  inputArea: {
    display: "flex",
    gap: "8px",
    padding: "12px 14px",
    background: "#0d0d0d",
    borderTop: "1px solid #1e1e1e",
    alignItems: "flex-end",
  },
  textarea: {
    flex: 1,
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "12px",
    color: "#e8e5e0",
    fontFamily: "inherit",
    fontSize: "13px",
    padding: "10px 14px",
    resize: "none",
    outline: "none",
    minHeight: "40px",
    maxHeight: "100px",
    lineHeight: "1.5",
  },
  sendBtn: (disabled) => ({
    width: "40px", height: "40px",
    borderRadius: "10px",
    background: disabled ? "#2a2a2a" : "linear-gradient(135deg, #CB1A20, #e61e25)",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.2s",
  }),
};

// Inyectamos keyframes una sola vez
const injectKeyframes = () => {
  if (document.getElementById("beepy-keyframes")) return;
  const style = document.createElement("style");
  style.id = "beepy-keyframes";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
    @keyframes beepyPulse {
      0%, 100% { box-shadow: 0 4px 24px rgba(203, 26,  red, 0.45); }
      50% { box-shadow: 0 4px 36px rgba(203, 26, 32, 0.75); }
    }
    @keyframes beepyBounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40% { transform: translateY(-5px); opacity: 1; }
    }
    @keyframes beepyFadeUp {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes beepySlideIn {
      from { opacity: 0; transform: translateY(16px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    #beepy-chat-area::-webkit-scrollbar { width: 3px; }
    #beepy-chat-area::-webkit-scrollbar-track { background: transparent; }
    #beepy-chat-area::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
  `;
  document.head.appendChild(style);
};

// ── Componente principal ───────────────────────────────────────────────────

export default function BeepyChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const chatRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { injectKeyframes(); }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "¡Hola! Soy **Beepy** 🛢️, tu asesor técnico de Lubricentro Eden. ¿En qué te puedo asesorar hoy?",
      }]);
    }
  }, [open]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
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

Si estás en **Render**, por favor usá la opción **"Clear Cache and Deploy"** en la pestaña de Deploys para asegurar que se inyecte la clave.` 
      }]);
      setInput("");
      setShowSuggestions(false);
      return;
    }

    setInput("");
    setShowSuggestions(false);

    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...newMessages,
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "No pude procesar tu consulta. Intentá de nuevo.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, {
        role: "assistant",
        content: "❌ Hubo un error de conexión. Revisá tu internet e intentá de nuevo.",
      }]);
    }

    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Panel del chat */}
      {open && (
        <div style={{ ...styles.panel, animation: "beepySlideIn 0.3s ease" }}>

          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLine} />
            <div style={styles.avatar}>⚙️</div>
            <div style={styles.headerInfo}>
              <div style={styles.headerTitle}>Beepy — Asesor Técnico</div>
              <div style={styles.headerSub}>{LUBRICENTRO.nombre}</div>
            </div>
            <div style={styles.statusDot}>
              <div style={styles.dot} />
            </div>
            <button style={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Mensajes */}
          <div id="beepy-chat-area" ref={chatRef} style={styles.chatArea}>
            {messages.map((m, i) => (
              <div key={i} style={{ animation: "beepyFadeUp 0.25s ease" }}>
                <div style={styles.msgRow(m.role === "user")}>
                  <div style={styles.msgAvatar}>
                    {m.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div
                    style={styles.bubble(m.role === "user")}
                    dangerouslySetInnerHTML={{ __html: formatContent(m.content) }}
                  />
                </div>
              </div>
            ))}

            {/* Sugerencias iniciales */}
            {showSuggestions && messages.length === 1 && (
              <div style={styles.suggestionsWrap}>
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    style={styles.sugBtn}
                    onClick={() => sendMessage(s)}
                    onMouseEnter={e => {
                      e.target.style.borderColor = "#CB1A20";
                      e.target.style.color = "#CB1A20";
                    }}
                    onMouseLeave={e => {
                      e.target.style.borderColor = "#2a2a2a";
                      e.target.style.color = "#6a6560";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
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

          {/* Input */}
          <div style={styles.inputArea}>
            <textarea
              ref={textareaRef}
              style={styles.textarea}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Preguntá sobre aceites, viscosidades..."
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

      {/* Botón flotante */}
      <button
        style={{ ...styles.fab, ...(open ? {} : styles.fabPulse) }}
        onClick={() => setOpen(!open)}
        title="Hablar con Beepy"
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
