import { useState, useEffect, useRef } from "react";
import { expandirPrompt } from './services/aiService';
import translate from "translate";

// --- CONFIGURACIÓN DE TRADUCCIÓN ---
translate.engine = "google"; 
translate.from = "es";

// --- GRUPOS PARA TABS ---
const TABS_CONFIG = {
  POSITIVO: [
    { id: "principal", label: "👤 Principal", keys: ["sujeto", "pose", "accion"] },
    { id: "entorno", label: "🌍 Entorno", keys: ["ambiente", "iluminacion", "atmosfera", "fondo"] },
    { id: "artistico", label: "🎨 Artístico", keys: ["estilo", "detalles", "paleta"] },
    { id: "tecnico", label: "⚙️ Técnico", keys: ["calidad", "angulo", "formato", "mascara", "dtf"] }
  ],
  NEGATIVO: [
    { id: "calidad_neg", label: "🚫 Calidad", keys: ["n_calidad", "n_composicion", "n_texto"] },
    { id: "cuerpo_neg", label: "🦴 Cuerpo", keys: ["n_anatomia", "n_rostro", "n_estilo"] }
  ]
};

// --- ICONOS ---
const EditIcon = ({ size = 12, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);

const LockIcon = ({ size = 12, color = "#666" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const HMR_LABELS = {
  sujeto: "Sujeto", pose: "Pose", accion: "Acción", ambiente: "Ambiente",
  estilo: "Estilo", iluminacion: "Iluminación", atmosfera: "Atmósfera",
  detalles: "Detalles", angulo: "Ángulo", calidad: "Calidad",
  formato: "Formato", paleta: "Paleta", fondo: "Fondo", mascara: "Máscara",
  dtf: "DTF"
};

const NEGATIVE_LABELS = {
  n_calidad: "Calidad", n_anatomia: "Anatomía", n_rostro: "Rostro",
  n_estilo: "Estilo NO", n_composicion: "Composición", n_texto: "Texto/Marcas"
};

const MULTI_SELECT_CATS = ["dtf", "fondo", "mascara", "n_calidad", "n_anatomia", "n_rostro", "n_estilo", "n_composicion", "n_texto"];

const GET_COLOR = (key) => {
  if (key === "dtf") return "#f97316"; 
  if (NEGATIVE_LABELS[key]) return "#ef4444"; 
  return "#7c3aed"; 
};

const STORAGE_KEY = "prompt_generator_saves";

// ── MÓDULO DE TEXTO ───────────────────────────────────────────────────
const FONT_STYLES  = ["Negrita", "Cursiva", "Subrayada", "Versalitas", "Mayúsculas"];
const FILL_TYPES   = ["Sólido", "Degradado", "Metálico", "Transparente"];
const TEXT_EFFECTS = ["Sombra", "Resplandor", "Relieve", "Distorsión", "3D", "Contorno doble"];
const TEXT_ALIGN   = ["Izquierda", "Centro", "Derecha", "Justificado"];
const TEXT_ORDER   = ["Delante del sujeto", "Detrás del sujeto"];

const emptyText = () => ({
  id: Date.now() + Math.random(),
  contenido: "",
  fuente: "",
  estilos: [],
  colorRelleno: "",
  tipoRelleno: "Sólido",
  colorContorno: "",
  anchoContorno: "",
  efectos: [],
  alineacion: "Centro",
  orden: "Delante del sujeto",
  ordenCustom: "",
  ideogram: false,
});

const buildTextPrompt = (t) => {
  if (!t.contenido.trim()) return null;
  const parts = [];
  parts.push(`text: "${t.contenido.trim()}"`);
  if (t.fuente)       parts.push(`font: ${t.fuente}${t.estilos.length ? " " + t.estilos.map(s => s.toLowerCase()).join(" ") : ""}`);
  else if (t.estilos.length) parts.push(`font style: ${t.estilos.map(s => s.toLowerCase()).join(", ")}`);
  if (t.colorRelleno) parts.push(`fill: ${t.colorRelleno} ${t.tipoRelleno.toLowerCase()}`);
  else if (t.tipoRelleno !== "Sólido") parts.push(`fill: ${t.tipoRelleno.toLowerCase()}`);
  if (t.colorContorno) parts.push(`stroke: ${t.colorContorno}${t.anchoContorno ? " " + t.anchoContorno : ""}`);
  if (t.efectos.length) parts.push(t.efectos.map(e => e.toLowerCase()).join(", ") + " effect");
  parts.push(`${t.alineacion.toLowerCase()} aligned`);
  const ord = t.ordenCustom.trim() || t.orden;
  parts.push(ord.toLowerCase());
  if (t.ideogram) parts.push("legible typography, crisp text rendering");
  return parts.join(", ");
};

const TextoModule = ({ textos, setTextos, textoTab, setTextoTab, showTextos, setShowTextos }) => {
  const t = textos[textoTab] || textos[0];

  const update = (field, val) =>
    setTextos(prev => prev.map((tx, i) => i === textoTab ? { ...tx, [field]: val } : tx));

  const toggleMulti = (field, val) =>
    setTextos(prev => prev.map((tx, i) => {
      if (i !== textoTab) return tx;
      const arr = tx[field];
      return { ...tx, [field]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    }));

  const addText = () => { setTextos(prev => [...prev, emptyText()]); setTextoTab(textos.length); };
  const removeText = (idx) => {
    if (textos.length === 1) { setTextos([emptyText()]); setTextoTab(0); return; }
    setTextos(prev => prev.filter((_, i) => i !== idx));
    setTextoTab(Math.max(0, textoTab - (idx <= textoTab ? 1 : 0)));
  };

  const chipStyle = (active, color = "#8888dd") => ({
    padding: "5px 11px", borderRadius: "999px", fontSize: "11.5px", cursor: "pointer", whiteSpace: "nowrap",
    border: `1.5px solid ${active ? color : "#2a2a2a"}`,
    background: active ? color + "22" : "#181818",
    color: active ? color : "#555",
    fontWeight: active ? "600" : "400", transition: "all 0.15s",
  });

  const inputStyle = (hasVal) => ({
    flex: 1, background: hasVal ? "#141420" : "#181818",
    border: `1.5px solid ${hasVal ? "#5555aa" : "#252525"}`,
    borderRadius: "8px", padding: "7px 11px",
    color: hasVal ? "#c8c8ff" : "#555",
    fontSize: "12px", outline: "none", transition: "all 0.18s",
  });

  const labelStyle = { color: "#888", fontWeight: "600", fontSize: "11px", letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: "6px", display: "block" };

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Header toggle */}
      <button
        onClick={() => setShowTextos(v => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: showTextos ? "#0e0e1a" : "#111", border: `1.5px solid ${showTextos ? "#3a3a6a" : "#1e1e2a"}`, borderRadius: showTextos ? "11px 11px 0 0" : "11px", cursor: "pointer", transition: "all 0.2s" }}
        onMouseOver={(e) => { if (!showTextos) e.currentTarget.style.borderColor = "#4a4a8a"; }}
        onMouseOut={(e) => { if (!showTextos) e.currentTarget.style.borderColor = "#1e1e2a"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px" }}>🔤</span>
          <span style={{ color: "#8888dd", fontWeight: "700", fontSize: "12.5px", letterSpacing: "0.4px" }}>MÓDULO DE TEXTO</span>
          <span style={{ color: "#3a3a5a", fontSize: "10.5px" }}>— integrá tipografía al diseño</span>
          {textos.some(tx => tx.contenido.trim()) && (
            <span style={{ background: "#8888dd33", border: "1px solid #8888dd55", borderRadius: "999px", padding: "1px 8px", fontSize: "11px", color: "#8888dd" }}>
              {textos.filter(tx => tx.contenido.trim()).length} texto{textos.filter(tx => tx.contenido.trim()).length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span style={{ color: "#444", fontSize: "12px" }}>{showTextos ? "▲" : "▼"}</span>
      </button>

      {showTextos && (
        <div style={{ background: "#0e0e14", border: "1.5px solid #3a3a6a", borderTop: "none", borderRadius: "0 0 11px 11px", padding: "14px" }}>
          {/* TABS */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
            {textos.map((tx, i) => (
              <div key={tx.id} style={{ display: "flex", alignItems: "center" }}>
                <button onClick={() => setTextoTab(i)}
                  style={{ padding: "5px 13px", borderRadius: textos.length > 1 ? "999px 0 0 999px" : "999px", border: `1.5px solid ${textoTab === i ? "#8888dd" : "#2a2a4a"}`, borderRight: textos.length > 1 ? "none" : undefined, background: textoTab === i ? "#8888dd22" : "#111", color: textoTab === i ? "#8888dd" : "#444", fontWeight: textoTab === i ? "700" : "400", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  {tx.contenido.trim() ? `"${tx.contenido.slice(0, 12)}${tx.contenido.length > 12 ? "…" : ""}"` : `Texto ${i + 1}`}
                </button>
                {textos.length > 1 && (
                  <button onClick={() => removeText(i)}
                    style={{ padding: "5px 7px", borderRadius: "0 999px 999px 0", border: `1.5px solid ${textoTab === i ? "#8888dd" : "#2a2a4a"}`, background: textoTab === i ? "#8888dd22" : "#111", color: "#554466", fontSize: "10px", cursor: "pointer" }}
                    onMouseOver={(e) => { e.currentTarget.style.color = "#cc4444"; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = "#554466"; }}
                  >✕</button>
                )}
              </div>
            ))}
            {textos.length < 5 && (
              <button onClick={addText}
                style={{ padding: "5px 11px", borderRadius: "999px", border: "1.5px dashed #2a2a4a", background: "none", color: "#444", fontSize: "12px", cursor: "pointer", transition: "all 0.15s" }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = "#8888dd"; e.currentTarget.style.color = "#8888dd"; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = "#2a2a4a"; e.currentTarget.style.color = "#444"; }}
              >+ Agregar</button>
            )}
          </div>

          {/* CONTENIDO */}
          <div style={{ marginBottom: "14px" }}>
            <span style={labelStyle}>Contenido del texto</span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input value={t.contenido} onChange={(e) => update("contenido", e.target.value)}
                placeholder='Ej: MODO DIABLO, Est. 2024...'
                style={{ ...inputStyle(!!t.contenido), flex: 1 }}
                onFocus={(e) => { e.target.style.borderColor = "#8888ddaa"; e.target.style.color = "#e0e0e0"; }}
                onBlur={(e) => { e.target.style.borderColor = t.contenido ? "#5555aa" : "#252525"; e.target.style.color = t.contenido ? "#c8c8ff" : "#555"; }}
              />
              <button onClick={() => update("ideogram", !t.ideogram)} title="Optimizar para Ideogram"
                style={{ padding: "7px 11px", borderRadius: "8px", border: `1.5px solid ${t.ideogram ? "#0ea5e9" : "#252525"}`, background: t.ideogram ? "#0ea5e922" : "#181818", color: t.ideogram ? "#0ea5e9" : "#444", fontSize: "11px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}
              >Ⓘ Ideogram</button>
            </div>
          </div>

          {/* TIPOGRAFÍA */}
          <div style={{ marginBottom: "14px" }}>
            <span style={labelStyle}>Tipografía</span>
            <input value={t.fuente} onChange={(e) => update("fuente", e.target.value)}
              placeholder='Ej: Impact, Bebas Neue, Arial Black...'
              style={{ ...inputStyle(!!t.fuente), width: "100%", marginBottom: "8px" }}
              onFocus={(e) => { e.target.style.borderColor = "#8888ddaa"; e.target.style.color = "#e0e0e0"; }}
              onBlur={(e) => { e.target.style.borderColor = t.fuente ? "#5555aa" : "#252525"; e.target.style.color = t.fuente ? "#c8c8ff" : "#555"; }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {FONT_STYLES.map(s => (
                <button key={s} onClick={() => toggleMulti("estilos", s)} style={chipStyle(t.estilos.includes(s))}
                  onMouseOver={(e) => { if (!t.estilos.includes(s)) { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#aaa"; }}}
                  onMouseOut={(e) => { if (!t.estilos.includes(s)) { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#555"; }}}
                >{s}</button>
              ))}
            </div>
          </div>

          {/* COLOR */}
          <div style={{ marginBottom: "14px" }}>
            <span style={labelStyle}>Color y relleno</span>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
              <input value={t.colorRelleno} onChange={(e) => update("colorRelleno", e.target.value)}
                placeholder='Relleno: ej: dorado, #FFD700...'
                style={{ ...inputStyle(!!t.colorRelleno), minWidth: "120px" }}
                onFocus={(e) => { e.target.style.borderColor = "#8888ddaa"; e.target.style.color = "#e0e0e0"; }}
                onBlur={(e) => { e.target.style.borderColor = t.colorRelleno ? "#5555aa" : "#252525"; e.target.style.color = t.colorRelleno ? "#c8c8ff" : "#555"; }}
              />
              <input value={t.colorContorno} onChange={(e) => update("colorContorno", e.target.value)}
                placeholder='Contorno: ej: negro, rojo...'
                style={{ ...inputStyle(!!t.colorContorno), minWidth: "120px" }}
                onFocus={(e) => { e.target.style.borderColor = "#8888ddaa"; e.target.style.color = "#e0e0e0"; }}
                onBlur={(e) => { e.target.style.borderColor = t.colorContorno ? "#5555aa" : "#252525"; e.target.style.color = t.colorContorno ? "#c8c8ff" : "#555"; }}
              />
              <input value={t.anchoContorno} onChange={(e) => update("anchoContorno", e.target.value)}
                placeholder='Ancho: ej: 3px, grueso...'
                style={{ ...inputStyle(!!t.anchoContorno), minWidth: "100px" }}
                onFocus={(e) => { e.target.style.borderColor = "#8888ddaa"; e.target.style.color = "#e0e0e0"; }}
                onBlur={(e) => { e.target.style.borderColor = t.anchoContorno ? "#5555aa" : "#252525"; e.target.style.color = t.anchoContorno ? "#c8c8ff" : "#555"; }}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {FILL_TYPES.map(f => (
                <button key={f} onClick={() => update("tipoRelleno", f)} style={chipStyle(t.tipoRelleno === f, "#F5C518")}
                  onMouseOver={(e) => { if (t.tipoRelleno !== f) { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#aaa"; }}}
                  onMouseOut={(e) => { if (t.tipoRelleno !== f) { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#555"; }}}
                >{f}</button>
              ))}
            </div>
          </div>

          {/* EFECTOS */}
          <div style={{ marginBottom: "14px" }}>
            <span style={labelStyle}>Efectos</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {TEXT_EFFECTS.map(ef => (
                <button key={ef} onClick={() => toggleMulti("efectos", ef)} style={chipStyle(t.efectos.includes(ef), "#e040fb")}
                  onMouseOver={(e) => { if (!t.efectos.includes(ef)) { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#aaa"; }}}
                  onMouseOut={(e) => { if (!t.efectos.includes(ef)) { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#555"; }}}
                >{ef}</button>
              ))}
            </div>
          </div>

          {/* POSICIÓN */}
          <div style={{ marginBottom: "10px" }}>
            <span style={labelStyle}>Posición y orden</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
              {TEXT_ALIGN.map(a => (
                <button key={a} onClick={() => update("alineacion", a)} style={chipStyle(t.alineacion === a, "#4caf50")}
                  onMouseOver={(e) => { if (t.alineacion !== a) { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#aaa"; }}}
                  onMouseOut={(e) => { if (t.alineacion !== a) { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#555"; }}}
                >{a}</button>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
              {TEXT_ORDER.map(o => (
                <button key={o} onClick={() => update("orden", o)} style={chipStyle(t.orden === o, "#29b6f6")}
                  onMouseOver={(e) => { if (t.orden !== o) { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#aaa"; }}}
                  onMouseOut={(e) => { if (t.orden !== o) { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#555"; }}}
                >{o}</button>
              ))}
            </div>
            <input value={t.ordenCustom} onChange={(e) => update("ordenCustom", e.target.value)}
              placeholder='O especificá: ej: sobre las llamas, detrás del sol...'
              style={{ ...inputStyle(!!t.ordenCustom), width: "100%" }}
              onFocus={(e) => { e.target.style.borderColor = "#8888ddaa"; e.target.style.color = "#e0e0e0"; }}
              onBlur={(e) => { e.target.style.borderColor = t.ordenCustom ? "#5555aa" : "#252525"; e.target.style.color = t.ordenCustom ? "#c8c8ff" : "#555"; }}
            />
          </div>

          {/* PREVIEW */}
          {t.contenido.trim() && (
            <div style={{ marginTop: "10px", padding: "9px 12px", background: "#111", borderRadius: "8px", border: "1px solid #2a2a4a" }}>
              <p style={{ color: "#3a3a6a", fontSize: "10px", marginBottom: "3px", fontWeight: "600" }}>PREVIEW EN PROMPT:</p>
              <p style={{ color: "#7777bb", fontSize: "11.5px", lineHeight: "1.5", fontStyle: "italic" }}>{buildTextPrompt(t)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── MÓDULO IMAGEN → CONCEPTO (Ollama / moondream) ─────────────────────
const OLLAMA_URL    = "http://localhost:11434";
const VISION_MODEL  = "moondream";

// moondream no sigue formato JSON confiablemente — le hacemos preguntas
// simples una por una y parseamos texto libre.
const VISION_PROMPTS = [
  { key: "sujeto",      q: "What is the main subject or character in this image? Answer in one short phrase, no punctuation." },
  { key: "estilo",      q: "What is the art style of this image? (vector, flat, realistic, cartoon, grunge, etc). One short phrase." },
  { key: "ambiente",    q: "Describe the background or setting. One short phrase." },
  { key: "atmosfera",   q: "What is the mood or atmosphere? One short phrase." },
  { key: "iluminacion", q: "Describe the lighting. One short phrase." },
  { key: "detalles",    q: "Any notable textures or patterns? One short phrase." },
  { key: "angulo",      q: "What is the camera angle or point of view? One short phrase." },
];

// Llama a Ollama una pregunta a la vez y acumula resultados
const analizarConOllama = async (imgBase64, onProgress) => {
  const resultado = {};
  for (const { key, q } of VISION_PROMPTS) {
    onProgress(key);
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: VISION_MODEL,
        prompt: q,
        images: [imgBase64],
        stream: false,
        options: { temperature: 0.1, num_predict: 50 },
      }),
    });
    if (!res.ok) throw new Error(`Ollama respondió ${res.status}`);
    const data = await res.json();
    const val = (data?.response || "").trim()
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/\n.*/s, "")
      .trim();
    if (val && val.length > 2) resultado[key] = val;
  }
  return resultado;
};


const ImagenConceptoModule = ({ hmrCards, setHmrCards }) => {
  const [showPanel, setShowPanel]     = useState(false);
  const [imgPreview, setImgPreview]   = useState(null);
  const [imgBase64, setImgBase64]     = useState(null);   // base64 puro sin prefijo
  const [analizando, setAnalizando]   = useState(false);
  const [resultado, setResultado]     = useState(null);   // { sujeto, estilo, ... }
  const [aplicado, setAplicado]       = useState(false);
  const [error, setError]             = useState("");
  const [ollamaOk, setOllamaOk]       = useState(null);  // null=sin chequear, true/false
  const [progreso, setProgreso]       = useState("");    // categoría actual siendo analizada

  // Chequea que Ollama esté corriendo al abrir el panel
  const checkOllama = async () => {
    try {
      const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const modelos = (data.models || []).map(m => m.name);
      const tieneModelo = modelos.some(m => m.startsWith(VISION_MODEL));
      if (!tieneModelo) {
        setOllamaOk(false);
        setError(`Ollama está corriendo pero no encontré el modelo "${VISION_MODEL}". Ejecutá: ollama pull ${VISION_MODEL}`);
      } else {
        setOllamaOk(true);
        setError("");
      }
    } catch {
      setOllamaOk(false);
      setError("No se pudo conectar con Ollama en localhost:11434. ¿Está corriendo?");
    }
  };

  const handlePanelToggle = () => {
    setShowPanel(v => {
      if (!v && ollamaOk === null) checkOllama();
      return !v;
    });
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setResultado(null);
    setAplicado(false);
    setError("");

    // Preview
    const previewReader = new FileReader();
    previewReader.onload = (e) => setImgPreview(e.target.result);
    previewReader.readAsDataURL(file);

    // Base64 puro (sin el prefijo data:image/...;base64,)
    const b64Reader = new FileReader();
    b64Reader.onload = (e) => {
      const full = e.target.result;
      setImgBase64(full.split(",")[1]);
    };
    b64Reader.readAsDataURL(file);
  };

  const analizarImagen = async () => {
    if (!imgBase64 || analizando) return;
    setAnalizando(true);
    setResultado(null);
    setError("");
    setProgreso("");

    try {
      const parsed = await analizarConOllama(imgBase64, (cat) => setProgreso(cat));
      if (Object.keys(parsed).length === 0) throw new Error("moondream no devolvió resultados. Probá con otra imagen.");
      setResultado(parsed);
      setProgreso("");
    } catch (e) {
      setError(e.message || "Error al analizar la imagen");
      setProgreso("");
    } finally {
      setAnalizando(false);
    }
  };

  const aplicarACards = () => {
    if (!resultado) return;
    setHmrCards(prev => {
      const next = { ...prev };
      Object.entries(resultado).forEach(([cat, valor]) => {
        if (next[cat]) {
          next[cat] = { ...next[cat], manual: valor, showManual: true, active: true, locked: true };
        }
      });
      return next;
    });
    setAplicado(true);
    setTimeout(() => setAplicado(false), 3000);
  };

  const limpiar = () => {
    setImgPreview(null);
    setImgBase64(null);
    setResultado(null);
    setAplicado(false);
    setError("");
  };

  const cardCount = resultado ? Object.keys(resultado).length : 0;

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Header toggle */}
      <button
        onClick={handlePanelToggle}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: showPanel ? "#0e0a18" : "#111", border: `1.5px solid ${showPanel ? "#3a2050" : "#1e1e2a"}`, borderRadius: showPanel ? "11px 11px 0 0" : "11px", cursor: "pointer", transition: "all 0.2s" }}
        onMouseOver={(e) => { if (!showPanel) e.currentTarget.style.borderColor = "#6a3a9a"; }}
        onMouseOut={(e) => { if (!showPanel) e.currentTarget.style.borderColor = "#1e1e2a"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px" }}>🖼</span>
          <span style={{ color: "#a78bfa", fontWeight: "700", fontSize: "12.5px", letterSpacing: "0.4px" }}>IMAGEN → CONCEPTO</span>
          <span style={{ color: "#3a2a4a", fontSize: "10.5px" }}>— moondream analiza y llena las tarjetas</span>
          {ollamaOk === true && <span style={{ background: "#14301a", border: "1px solid #2a6a2a", borderRadius: "999px", padding: "1px 8px", fontSize: "10px", color: "#4caf50" }}>● Ollama OK</span>}
          {ollamaOk === false && <span style={{ background: "#301414", border: "1px solid #6a2a2a", borderRadius: "999px", padding: "1px 8px", fontSize: "10px", color: "#ef4444" }}>● Ollama offline</span>}
        </div>
        <span style={{ color: "#444", fontSize: "12px" }}>{showPanel ? "▲" : "▼"}</span>
      </button>

      {showPanel && (
        <div style={{ background: "#0a0810", border: "1.5px solid #3a2050", borderTop: "none", borderRadius: "0 0 11px 11px", padding: "16px" }}>

          {/* Error de conexión */}
          {error && !analizando && (
            <div style={{ marginBottom: "12px", padding: "10px 13px", background: "#1a0e10", border: "1.5px solid #5a2020", borderRadius: "9px" }}>
              <p style={{ color: "#ef4444", fontSize: "11.5px", lineHeight: "1.5" }}>⚠ {error}</p>
              {ollamaOk === false && (
                <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <p style={{ color: "#5a3a3a", fontSize: "10.5px" }}>Para instalar moondream ejecutá en tu terminal:</p>
                  <code style={{ background: "#111", border: "1px solid #3a2020", borderRadius: "5px", padding: "5px 10px", color: "#c084fc", fontSize: "11px", display: "block" }}>
                    ollama pull moondream
                  </code>
                  <button
                    onClick={checkOllama}
                    style={{ alignSelf: "flex-start", marginTop: "6px", padding: "5px 12px", background: "none", border: "1px solid #3a2050", borderRadius: "7px", color: "#a78bfa", fontSize: "11px", cursor: "pointer" }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = "#a78bfa"; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = "#3a2050"; }}
                  >↺ Reintentar conexión</button>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            {/* Drop zone / preview */}
            <label
              style={{ flexShrink: 0, width: "110px", height: "100px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "5px", background: "#111", border: `1.5px dashed ${analizando ? "#6a3a9a" : "#3a2050"}`, borderRadius: "10px", cursor: analizando ? "not-allowed" : "pointer", transition: "all 0.2s", overflow: "hidden" }}
              onMouseOver={(e) => { if (!analizando) e.currentTarget.style.borderColor = "#a78bfa88"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = analizando ? "#6a3a9a" : "#3a2050"; }}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#a78bfa"; }}
              onDrop={(e) => { e.preventDefault(); if (!analizando) handleFile(e.dataTransfer.files?.[0]); }}
            >
              <input type="file" accept="image/*" style={{ display: "none" }} disabled={analizando}
                onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
              />
              {imgPreview
                ? <img src={imgPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: analizando ? 0.5 : 1, transition: "opacity 0.2s" }} />
                : <>
                    <span style={{ fontSize: "22px", opacity: 0.35 }}>🖼</span>
                    <p style={{ color: "#3a2a5a", fontSize: "10px", textAlign: "center", lineHeight: "1.4" }}>Soltá o<br/>subí imagen</p>
                    <p style={{ color: "#252535", fontSize: "9px" }}>JPG · PNG · WEBP</p>
                  </>
              }
            </label>

            {/* Panel derecho */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>

              {/* Estado: sin imagen */}
              {!imgPreview && !analizando && (
                <p style={{ color: "#3a2a5a", fontSize: "11px", lineHeight: "1.6" }}>
                  Subí una imagen de referencia. <span style={{ color: "#5a4a7a" }}>moondream</span> la analizará localmente con Ollama y llenará automáticamente las tarjetas de Sujeto, Estilo, Ambiente, Iluminación y más.
                </p>
              )}

              {/* Estado: imagen cargada, sin analizar */}
              {imgPreview && !analizando && !resultado && (
                <>
                  <p style={{ color: "#5a4a7a", fontSize: "11px" }}>Imagen lista. Hacé clic en Analizar para que moondream describa sus características.</p>
                  <button
                    onClick={analizarImagen}
                    disabled={ollamaOk === false}
                    style={{ padding: "10px 16px", background: ollamaOk === false ? "#1a1a2e" : "linear-gradient(135deg, #3b0764, #6d28d9)", border: `1.5px solid ${ollamaOk === false ? "#252545" : "#7c3aed55"}`, borderRadius: "9px", color: ollamaOk === false ? "#333355" : "#e9d5ff", fontWeight: "700", fontSize: "12.5px", cursor: ollamaOk === false ? "not-allowed" : "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px" }}
                    onMouseOver={(e) => { if (ollamaOk !== false) e.currentTarget.style.filter = "brightness(1.15)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.filter = "none"; }}
                  >
                    <span style={{ fontSize: "15px" }}>🔍</span> Analizar con moondream
                  </button>
                </>
              )}

              {/* Estado: analizando */}
              {analizando && (
                <div style={{ padding: "12px", background: "#110e1a", border: "1px solid #3a2050", borderRadius: "9px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: "18px" }}>⟳</span>
                    <div>
                      <p style={{ color: "#a78bfa", fontWeight: "600", fontSize: "12.5px" }}>moondream analizando...</p>
                      <p style={{ color: "#3a2a5a", fontSize: "10.5px", marginTop: "2px" }}>7 preguntas · puede tardar 30–60 seg</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    {VISION_PROMPTS.map(({ key }) => {
                      const done = resultado && resultado[key];
                      const active = progreso === key;
                      return (
                        <span key={key} style={{ padding: "3px 9px", borderRadius: "999px", fontSize: "10px", border: `1px solid ${done ? "#2a6a2a" : active ? "#6a3a9a" : "#2a1a3a"}`, background: done ? "#0e2a0e" : active ? "#2a1040" : "none", color: done ? "#4caf50" : active ? "#a78bfa" : "#3a2050", transition: "all 0.3s" }}>
                          {done ? "✓ " : active ? "⟳ " : ""}{HMR_LABELS[key] || key}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Estado: resultado listo */}
              {resultado && !analizando && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <p style={{ color: "#6a5a8a", fontSize: "10.5px", fontWeight: "600" }}>DETECTADO POR MOONDREAM:</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    {Object.entries(resultado).map(([cat, val]) => (
                      <div key={cat} style={{ background: "#1a1228", border: "1px solid #3a2060", borderRadius: "6px", padding: "4px 9px", fontSize: "10.5px", maxWidth: "100%" }}>
                        <span style={{ color: "#a78bfa", fontWeight: "600" }}>{HMR_LABELS[cat] || cat}: </span>
                        <span style={{ color: "#7777aa" }}>{val.length > 40 ? val.slice(0, 40) + "…" : val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Éxito al aplicar */}
          {aplicado && (
            <div style={{ marginTop: "12px", padding: "10px 13px", background: "#0e1a0e", border: "1.5px solid #2a4a2a", borderRadius: "9px" }}>
              <p style={{ color: "#4caf50", fontWeight: "700", fontSize: "13px" }}>✓ ¡{cardCount} tarjeta{cardCount !== 1 ? "s" : ""} actualizada{cardCount !== 1 ? "s" : ""}!</p>
              <p style={{ color: "#2a5a2a", fontSize: "11px", marginTop: "3px" }}>Los valores se cargaron en modo manual con lock activado. Podés editarlos en cada tarjeta.</p>
            </div>
          )}

          {/* Acciones */}
          {(imgPreview || resultado) && (
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              {resultado && !aplicado && (
                <button
                  onClick={aplicarACards}
                  style={{ flex: 1, padding: "9px 14px", background: "linear-gradient(135deg, #3b0764, #6d28d9)", border: "1.5px solid #7c3aed55", borderRadius: "9px", color: "#e9d5ff", fontWeight: "700", fontSize: "12px", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseOver={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; }}
                  onMouseOut={(e) => { e.currentTarget.style.filter = "none"; }}
                >
                  ✦ Aplicar {cardCount} tarjetas
                </button>
              )}
              {resultado && !analizando && (
                <button
                  onClick={analizarImagen}
                  style={{ padding: "9px 13px", background: "none", border: "1px solid #3a2050", borderRadius: "9px", color: "#6a4a8a", fontSize: "11px", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = "#a78bfa88"; e.currentTarget.style.color = "#a78bfa"; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = "#3a2050"; e.currentTarget.style.color = "#6a4a8a"; }}
                >↺ Re-analizar</button>
              )}
              <button
                onClick={limpiar}
                style={{ padding: "9px 13px", background: "none", border: "1px solid #2a2a3a", borderRadius: "9px", color: "#444", fontSize: "11px", cursor: "pointer", transition: "all 0.15s" }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#888"; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = "#2a2a3a"; e.currentTarget.style.color = "#444"; }}
              >✕ Limpiar</button>
            </div>
          )}

          <p style={{ color: "#1e1828", fontSize: "10px", marginTop: "12px", lineHeight: "1.6" }}>
            Modelo: <span style={{ color: "#3a2a5a" }}>moondream</span> vía Ollama en localhost:11434 · 
            Los valores se generan en inglés, listos para tu workflow de ComfyUI.
          </p>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const App = () => {
  const [bank, setBank] = useState(null);
  const [hmrCards, setHmrCards] = useState({});
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [activeTabPos, setActiveTabPos] = useState(TABS_CONFIG.POSITIVO[0].id);
  const [activeTabNeg, setActiveTabNeg] = useState(TABS_CONFIG.NEGATIVO[0].id);
  const [loadingAI, setLoadingAI] = useState(false);
  const [sendingComfy, setSendingComfy] = useState(false);

  // Estado para el Módulo de Texto
  const [textos, setTextos] = useState([emptyText()]);
  const [textoTab, setTextoTab] = useState(0);
  const [showTextos, setShowTextos] = useState(false);

  // Estado para el Modal de Pesos
  const [selection, setSelection] = useState({ text: "", start: 0, end: 0, target: "", x: 0, y: 0, visible: false });
  const [weightInput, setWeightInput] = useState("1.1");

  // Estados para el Menú Limpiar
  const [showClearMenu, setShowClearMenu] = useState(false);
  const dropdownRef = useRef(null);

  // Estado para el dropdown Historial
  const [showHistoryMenu, setShowHistoryMenu] = useState(false);
  const historyDropdownRef = useRef(null);

  // Estado para el dropdown Inspira
  const [showInspiraMenu, setShowInspiraMenu] = useState(false);
  const inspiraDropdownRef = useRef(null);

  // Links de inspiración (editables en runtime)
  const INSPIRA_STORAGE_KEY = "prompt_generator_inspira_links";
  const [inspiraLinks, setInspiraLinks] = useState(() => {
    try {
      const stored = localStorage.getItem("prompt_generator_inspira_links");
      return stored ? JSON.parse(stored) : [
        { id: 1, label: "Qinegen", url: "https://perchance.org/qinegen", emoji: "🎲" },
        { id: 2, label: "Pinterest", url: "https://pinterest.com", emoji: "📌" }
      ];
    } catch { return [
      { id: 1, label: "Qinegen", url: "https://perchance.org/qinegen", emoji: "🎲" },
      { id: 2, label: "Pinterest", url: "https://pinterest.com", emoji: "📌" }
    ]; }
  });
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkEmoji, setNewLinkEmoji] = useState("🔗");

  // --- ESTADOS HISTORIAL ---
  // Inicialización lazy: lee localStorage una sola vez al montar, sin useEffect de carga
  const [saves, setSaves] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [editingNameId, setEditingNameId] = useState(null);
  const [editingNameValue, setEditingNameValue] = useState("");

  // --- ESTADOS BIBLIOTECA ---
  const BIBLIOTECA_KEY = "prompt_biblioteca_saves";
  const [showBiblioteca, setShowBiblioteca] = useState(false);
  const [bibliotecaItems, setBibliotecaItems] = useState(() => {
    try { const s = localStorage.getItem(BIBLIOTECA_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [editingBibItem, setEditingBibItem] = useState(null); // null | item object
  const [bibForm, setBibForm] = useState({ titulo: "", promptPositivo: "", promptNegativo: "", notas: "", observaciones: "", linkFuente: "", linkImagen: "" });
  const [loadingBibIA, setLoadingBibIA] = useState({ pos: false, neg: false });

  // --- ESTADOS BUSCADOR ---
  const [showBuscador, setShowBuscador] = useState(false);
  const [buscadorQuery, setBuscadorQuery] = useState("");
  const buscadorRef = useRef(null);
  const buscadorInputRef = useRef(null);

  // Persistir guardados cada vez que cambian
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
    } catch (e) {
      console.error("Error al guardar historial:", e);
    }
  }, [saves]);

  useEffect(() => {
    try { localStorage.setItem(BIBLIOTECA_KEY, JSON.stringify(bibliotecaItems)); } catch (e) {}
  }, [bibliotecaItems]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buscadorRef.current && !buscadorRef.current.contains(event.target)) {
        setShowBuscador(false); setBuscadorQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- LÓGICA BIBLIOTECA ---
  const handleAbrirNuevaBib = () => {
    setBibForm({ titulo: "", promptPositivo: "", promptNegativo: "", notas: "", observaciones: "", linkFuente: "", linkImagen: "" });
    setEditingBibItem(null);
    setShowBiblioteca(true);
  };
  const handleEditarBib = (item) => {
    setBibForm({ titulo: item.titulo || "", promptPositivo: item.promptPositivo || "", promptNegativo: item.promptNegativo || "", notas: item.notas || "", observaciones: item.observaciones || "", linkFuente: item.linkFuente || "", linkImagen: item.linkImagen || "" });
    setEditingBibItem(item);
    setShowBiblioteca(true);
  };
  const handleGuardarBib = () => {
    if (!bibForm.promptPositivo.trim() && !bibForm.titulo.trim()) { alert("Ingresá al menos un título o prompt positivo."); return; }
    if (editingBibItem) {
      setBibliotecaItems(prev => prev.map(i => i.id === editingBibItem.id ? { ...i, ...bibForm, updatedAt: new Date().toISOString() } : i));
    } else {
      setBibliotecaItems(prev => [{ id: Date.now(), ...bibForm, createdAt: new Date().toISOString() }, ...prev]);
    }
    setShowBiblioteca(false); setEditingBibItem(null);
  };
  const handleEliminarBib = (id) => {
    if (!window.confirm("¿Eliminar este item de la biblioteca?")) return;
    setBibliotecaItems(prev => prev.filter(i => i.id !== id));
  };
  const handleExpandirBibIA = async (campo) => {
    const val = campo === "pos" ? bibForm.promptPositivo : bibForm.promptNegativo;
    if (!val.trim() || loadingBibIA[campo]) return;
    setLoadingBibIA(prev => ({ ...prev, [campo]: true }));
    try {
      const traducido = await translate(val, "en");
      if (campo === "pos") {
        const expandido = await expandirPrompt(traducido);
        setBibForm(f => ({ ...f, promptPositivo: expandido }));
      } else {
        setBibForm(f => ({ ...f, promptNegativo: traducido }));
      }
    } catch (e) {
      console.error("Error IA Biblioteca:", e);
    } finally {
      setLoadingBibIA(prev => ({ ...prev, [campo]: false }));
    }
  };
  const handleExportBib = () => {
    if (bibliotecaItems.length === 0) { alert("No hay items en la biblioteca."); return; }
    const json = JSON.stringify(bibliotecaItems, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `biblioteca_prompts_${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  // --- LÓGICA BUSCADOR ---
  const getBuscadorResults = () => {
    if (!buscadorQuery.trim()) return [];
    const q = buscadorQuery.toLowerCase();
    const fromBib = bibliotecaItems.filter(i =>
      (i.titulo || "").toLowerCase().includes(q) ||
      (i.promptPositivo || "").toLowerCase().includes(q) ||
      (i.promptNegativo || "").toLowerCase().includes(q) ||
      (i.notas || "").toLowerCase().includes(q)
    ).map(i => ({ ...i, _source: "biblioteca" }));
    const fromHmr = saves.filter(s =>
      (s.name || "").toLowerCase().includes(q) ||
      (s.prompt || "").toLowerCase().includes(q) ||
      (s.negativePrompt || "").toLowerCase().includes(q)
    ).map(s => ({ ...s, _source: "hrmpanel" }));
    return [...fromBib, ...fromHmr];
  };
  const buscadorResults = getBuscadorResults();

  useEffect(() => {
    fetch("./hmr-bank.json")
      .then(res => res.json())
      .then(data => {
        const fullData = {
          ...data,
          dtf: data.dtf || ["masterpiece", "sticker design", "vector style", "white background"],
          n_calidad: ["baja calidad", "borroso", "pixelado"],
          n_anatomia: ["mala anatomía", "dedos extra"],
          n_rostro: ["feo", "rostro deformado"],
          n_estilo: ["caricatura", "anime"],
          n_composicion: ["recortado", "fuera de cuadro"],
          n_texto: ["texto", "marca de agua"]
        };
        setBank(fullData);
        const initialState = {};
        const allKeys = [...Object.keys(HMR_LABELS), ...Object.keys(NEGATIVE_LABELS)];
        allKeys.forEach(key => {
          initialState[key] = {
            selected: MULTI_SELECT_CATS.includes(key) ? [] : (fullData[key]?.[0] || ""),
            active: true, manual: "", showManual: false, locked: false
          };
        });
        setHmrCards(initialState);
      })
      .catch(err => console.error("Error al cargar JSON", err));
  }, []);

  // Cerrar dropdown al cliquear fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowClearMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(event.target)) {
        setShowHistoryMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!bank) return;
    const buildString = (keys) => keys
      .filter(key => hmrCards[key]?.active)
      .map(key => {
        const card = hmrCards[key];
        if (card.showManual && card.manual.trim() !== "") return card.manual.trim();
        return Array.isArray(card.selected) ? card.selected.join(", ") : card.selected;
      })
      .filter(Boolean)
      .join(", ");

    const basePrompt = buildString(Object.keys(HMR_LABELS));
    const textParts = textos.map(buildTextPrompt).filter(Boolean).join(", ");
    setPrompt([basePrompt, textParts].filter(Boolean).join(", "));
    setNegativePrompt(buildString(Object.keys(NEGATIVE_LABELS)));
  }, [hmrCards, bank, textos]);

  // --- LÓGICA DE LIMPIEZA / ACTIVACIÓN ---
  const toggleGroupActive = (type) => {
    if (type === 'POSITIVO') {
      const keysPos = Object.keys(HMR_LABELS);
      setHmrCards(prev => {
        const newState = { ...prev };
        const anyActive = keysPos.some(key => prev[key]?.active);
        keysPos.forEach(key => {
          newState[key] = { ...prev[key], active: !anyActive };
        });
        return newState;
      });
    } else {
      const keysNeg = Object.keys(NEGATIVE_LABELS);
      setHmrCards(prev => {
        const newState = { ...prev };
        keysNeg.forEach(key => {
          newState[key] = { ...prev[key], selected: [] };
        });
        return newState;
      });
    }
    setShowClearMenu(false);
  };

  const handleTextSelection = (e, target) => {
    const text = e.target.value;
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;

    if (start !== end) {
      setSelection({
        text: text.substring(start, end),
        start,
        end,
        target,
        x: e.clientX,
        y: e.clientY - 60,
        visible: true
      });
    } else {
      setSelection(prev => ({ ...prev, visible: false }));
    }
  };

  const aplicarPeso = () => {
    const weightedText = `(${selection.text}:${weightInput})`;
    if (selection.target === "prompt") {
      const nuevoPrompt = prompt.substring(0, selection.start) + weightedText + prompt.substring(selection.end);
      setPrompt(nuevoPrompt);
    } else {
      const nuevoNeg = negativePrompt.substring(0, selection.start) + weightedText + negativePrompt.substring(selection.end);
      setNegativePrompt(nuevoNeg);
    }
    setSelection(prev => ({ ...prev, visible: false }));
  };

  const handleGenerarIA = async () => {
    if ((!prompt.trim() && !negativePrompt.trim()) || loadingAI) return;
    setLoadingAI(true);
    try {
      if (prompt.trim()) {
        const tPos = await translate(prompt, "en");
        const ePos = await expandirPrompt(tPos);
        setPrompt(ePos);
      }
      if (negativePrompt.trim()) {
        const tNeg = await translate(negativePrompt, "en");
        setNegativePrompt(tNeg);
      }
    } catch (error) {
      console.error("Error en proceso de IA:", error);
    } finally {
      setLoadingAI(false);
    }
  };

  const enviarAComfy = async (p, n) => {
    setSendingComfy(true);
    try {
      const res = await fetch('/ollama_workflow2.json');
      const workflow = await res.json();
      if (workflow["2"]) workflow["2"].inputs.text = p;
      if (workflow["3"]) workflow["3"].inputs.text = n;
      await fetch('http://127.0.0.1:8188/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow }),
      });
      alert("🚀 ¡Enviado a ComfyUI!");
    } catch (error) {
      alert("Error ComfyUI. ¿Está abierto?");
    } finally {
      setSendingComfy(false);
    }
  };

  const copiarAlPortapapeles = (t) => {
    navigator.clipboard.writeText(t).then(() => alert("📋 ¡Copiado!"));
  };

  const handleMultiSelect = (key, value) => {
    if (hmrCards[key].locked) return;
    setHmrCards(prev => {
      const current = prev[key].selected;
      const next = current.includes(value) ? current.filter(i => i !== value) : [...current, value];
      return { ...prev, [key]: { ...prev[key], selected: next } };
    });
  };

  // --- LÓGICA DE INSPIRA ---
  const handleAddLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
    const url = newLinkUrl.startsWith("http") ? newLinkUrl.trim() : "https://" + newLinkUrl.trim();
    setInspiraLinks(prev => [...prev, { id: Date.now(), label: newLinkLabel.trim(), url, emoji: newLinkEmoji.trim() || "🔗" }]);
    setNewLinkLabel(""); setNewLinkUrl(""); setNewLinkEmoji("🔗");
    setShowAddLink(false);
  };

  const handleRemoveLink = (id) => {
    setInspiraLinks(prev => prev.filter(l => l.id !== id));
  };

  // --- LÓGICA DE GUARDADO ---
  const handleGuardar = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
    const timeStr = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    const newSave = {
      id: Date.now(),
      name: `Guardado ${dateStr} ${timeStr}`,
      prompt,
      negativePrompt,
      hmrCards: JSON.parse(JSON.stringify(hmrCards)),
      createdAt: now.toISOString()
    };
    setSaves(prev => [newSave, ...prev]);
    setShowHistory(true);
  };

  const handleDeleteSave = (id) => {
    setSaves(prev => prev.filter(s => s.id !== id));
  };

  const handleCargarSave = (save) => {
    // Deep copy limpia para no mutar el objeto guardado en localStorage
    const restored = JSON.parse(JSON.stringify(save.hmrCards));
    // Garantizar que todas las keys existen (compatibilidad con saves viejos)
    const allKeys = [...Object.keys(HMR_LABELS), ...Object.keys(NEGATIVE_LABELS)];
    allKeys.forEach(key => {
      if (!restored[key]) {
        restored[key] = {
          selected: MULTI_SELECT_CATS.includes(key) ? [] : "",
          active: true, manual: "", showManual: false, locked: false
        };
      }
    });
    setHmrCards(restored);
    // El useEffect reconstruye prompt y negativePrompt automáticamente desde las cards
  };

  const handleRenameStart = (save) => {
    setEditingNameId(save.id);
    setEditingNameValue(save.name);
  };

  const handleRenameConfirm = (id) => {
    setSaves(prev => prev.map(s => s.id === id ? { ...s, name: editingNameValue.trim() || s.name } : s));
    setEditingNameId(null);
    setEditingNameValue("");
  };

  const handleExportAllSaves = () => {
    if (saves.length === 0) { alert("No hay guardados para exportar."); return; }
    const json = JSON.stringify(saves, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historial_completo_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSave = (save) => {
    const json = JSON.stringify(save, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${save.name.replace(/[^a-z0-9]/gi, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSave = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.hmrCards) {
          alert("❌ Archivo JSON inválido.");
          return;
        }
        const imported = {
          ...parsed,
          id: Date.now(),
          name: parsed.name ? `${parsed.name} (importado)` : "Guardado importado",
          createdAt: new Date().toISOString()
        };
        setSaves(prev => [imported, ...prev]);
        setShowHistory(true);
      } catch {
        alert("❌ No se pudo leer el archivo JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (!bank) return <div style={{ color: "#888", padding: "20px" }}>Cargando...</div>;

  return (
    <div style={{ backgroundColor: "#050505", minHeight: "100vh", color: "#e0e0e0", fontFamily: "sans-serif" }}>
      
      {/* TOOLTIP MODAL DE PESOS */}
      {selection.visible && (
        <div style={{ position: "fixed", top: selection.y, left: selection.x, zIndex: 9999, backgroundColor: "#1a1a1a", border: "1px solid #7c3aed", borderRadius: "8px", padding: "8px", display: "flex", gap: "8px", boxShadow: "0 4px 15px rgba(0,0,0,0.5)" }}>
          <input 
            type="number" 
            step="0.1" 
            value={weightInput} 
            onChange={(e) => setWeightInput(e.target.value)}
            style={{ width: "55px", backgroundColor: "#000", border: "1px solid #333", color: "#fff", borderRadius: "4px", fontSize: "12px", padding: "4px" }}
          />
          <button onClick={aplicarPeso} style={{ backgroundColor: "#7c3aed", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 8px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" }}>APLICAR PESO</button>
          <button onClick={() => setSelection(prev => ({ ...prev, visible: false }))} style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* NAVBAR */}
      <nav style={{ position: "sticky", top: 0, zIndex: 1000, backgroundColor: "#0f0f0f", borderBottom: "1px solid #333", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: "bold", fontSize: "14px", color: "#7c3aed" }}>PROMPT GENERATOR</span>
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>

          {/* BUSCADOR MINI-GOOGLE */}
          <div style={{ position: "relative" }} ref={buscadorRef}>
            <button
              onClick={() => { setShowBuscador(v => !v); setBuscadorQuery(""); setTimeout(() => buscadorInputRef.current?.focus(), 80); }}
              style={{ backgroundColor: showBuscador ? "#0a1a2a" : "#222", color: showBuscador ? "#38bdf8" : "#aaa", border: `1px solid ${showBuscador ? "#38bdf8" : "#444"}`, padding: "8px 15px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
            >
              🔍 BUSCAR
            </button>
            {showBuscador && (
              <div style={{ position: "absolute", top: "115%", right: 0, width: "440px", backgroundColor: "#0d0d0d", border: "1px solid #1e3a4a", borderRadius: "10px", boxShadow: "0 15px 40px rgba(0,0,0,0.9)", zIndex: 1002, overflow: "hidden" }}>
                <div style={{ padding: "10px 12px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#38bdf8", fontSize: "14px" }}>🔍</span>
                  <input
                    ref={buscadorInputRef}
                    type="text"
                    placeholder="Buscar en Biblioteca y HRMPanel..."
                    value={buscadorQuery}
                    onChange={e => setBuscadorQuery(e.target.value)}
                    style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e0e0e0", fontSize: "12px" }}
                  />
                  {buscadorQuery && <button onClick={() => setBuscadorQuery("")} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "13px" }}>✕</button>}
                </div>
                {buscadorQuery.trim() === "" && (
                  <div style={{ padding: "14px 16px", color: "#333", fontSize: "11px", textAlign: "center" }}>Escribí para buscar en tus prompts guardados</div>
                )}
                {buscadorQuery.trim() !== "" && buscadorResults.length === 0 && (
                  <div style={{ padding: "14px 16px", color: "#444", fontSize: "11px", textAlign: "center" }}>Sin resultados para "{buscadorQuery}"</div>
                )}
                {buscadorResults.length > 0 && (
                  <div style={{ maxHeight: "420px", overflowY: "auto" }}>
                    {buscadorResults.map(item => (
                      <div key={item.id} style={{ borderBottom: "1px solid #111", padding: "10px 14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                            {item._source === "hrmpanel" ? (
                              <span style={{ background: "#facc1522", border: "1px solid #facc1555", borderRadius: "4px", padding: "1px 6px", fontSize: "9px", color: "#facc15", fontWeight: "bold" }}>HRM</span>
                            ) : (
                              <span style={{ background: "#22d3ee22", border: "1px solid #22d3ee55", borderRadius: "4px", padding: "1px 6px", fontSize: "9px", color: "#22d3ee", fontWeight: "bold" }}>BIB</span>
                            )}
                            <span style={{ fontSize: "11px", color: "#ccc", fontWeight: "600" }}>{item._source === "hrmpanel" ? item.name : (item.titulo || "Sin título")}</span>
                          </div>
                        </div>
                        {(item._source === "hrmpanel" ? item.prompt : item.promptPositivo) && (
                          <div style={{ fontSize: "10px", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <span style={{ color: "#7c3aed" }}>+</span> {(item._source === "hrmpanel" ? item.prompt : item.promptPositivo).substring(0, 80)}…
                          </div>
                        )}
                        {(item._source === "hrmpanel" ? item.negativePrompt : item.promptNegativo) && (
                          <div style={{ fontSize: "10px", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <span style={{ color: "#ef4444" }}>–</span> {(item._source === "hrmpanel" ? item.negativePrompt : item.promptNegativo).substring(0, 80)}…
                          </div>
                        )}
                        <div style={{ display: "flex", gap: "5px" }}>
                          {item._source === "hrmpanel" ? (
                            <button onClick={() => { handleCargarSave(item); setShowBuscador(false); setBuscadorQuery(""); }} style={{ flex: 1, backgroundColor: "#0c1a0c", color: "#4ade80", border: "1px solid #166534", borderRadius: "5px", padding: "4px 7px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>⬆️ CARGAR EN HRMPANEL</button>
                          ) : (
                            <>
                              <button onClick={() => { navigator.clipboard.writeText(item.promptPositivo || ""); alert("📋 Prompt positivo copiado!"); }} style={{ flex: 1, backgroundColor: "#0a0a1a", color: "#7c3aed", border: "1px solid #3b0764", borderRadius: "5px", padding: "4px 6px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>📋 + POSITIVO</button>
                              <button onClick={() => { navigator.clipboard.writeText(item.promptNegativo || ""); alert("📋 Prompt negativo copiado!"); }} style={{ flex: 1, backgroundColor: "#1a0000", color: "#ef4444", border: "1px solid #7f1d1d", borderRadius: "5px", padding: "4px 6px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>📋 – NEGATIVO</button>
                              <button onClick={() => { handleEditarBib(item); setShowBuscador(false); setBuscadorQuery(""); }} style={{ backgroundColor: "#0a1a1a", color: "#22d3ee", border: "1px solid #164e63", borderRadius: "5px", padding: "4px 8px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>✏️</button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BIBLIOTECA */}
          <button
            onClick={handleAbrirNuevaBib}
            style={{ backgroundColor: "#0a1a1a", color: "#22d3ee", border: "1px solid #164e63", padding: "8px 15px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
          >
            📚 BIBLIOTECA {bibliotecaItems.length > 0 ? `(${bibliotecaItems.length})` : ""}
          </button>

          {/* DROPDOWN HISTORIAL */}
          <div style={{ position: "relative" }} ref={historyDropdownRef} onMouseEnter={() => setShowHistoryMenu(true)} onMouseLeave={() => setShowHistoryMenu(false)}>
            <button
              onClick={() => setShowHistory(prev => !prev)}
              style={{
                backgroundColor: showHistory ? "#1a1a00" : "#222",
                color: showHistory ? "#facc15" : "#aaa",
                border: `1px solid ${showHistory ? "#facc15" : "#444"}`,
                padding: "8px 15px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer"
              }}
            >
              📂 HISTORIAL {saves.length > 0 ? `(${saves.length})` : ""} {showHistoryMenu ? "▲" : "▼"}
            </button>

            {showHistoryMenu && (
              <div style={{ position: "absolute", top: "100%", left: 0, backgroundColor: "#111", border: "1px solid #2a2a00", borderRadius: "8px", overflow: "hidden", minWidth: "200px", boxShadow: "0 10px 30px rgba(0,0,0,0.8)", zIndex: 1001 }}>
                <button
                  onClick={() => { handleGuardar(); }}
                  style={{ width: "100%", padding: "12px 15px", textAlign: "left", backgroundColor: "transparent", color: "#4ade80", border: "none", borderBottom: "1px solid #222", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#0c1a0c"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  💾 GUARDAR ACTUAL
                </button>
                <label
                  style={{ display: "block", width: "100%", padding: "12px 15px", textAlign: "left", backgroundColor: "transparent", color: "#34d399", border: "none", fontSize: "11px", fontWeight: "bold", cursor: "pointer", boxSizing: "border-box" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#0a1a1a"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  📂 IMPORTAR JSON
                  <input type="file" accept=".json" onChange={(e) => handleImportSave(e)} style={{ display: "none" }} />
                </label>
              </div>
            )}
          </div>
            
          {/* DROPDOWN LIMPIAR */}
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <button 
              onClick={() => setShowClearMenu(!showClearMenu)}
              style={{ backgroundColor: "#222", color: "#fff", border: "1px solid #444", padding: "8px 15px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
            >
              🧹 LIMPIAR {showClearMenu ? "▲" : "▼"}
            </button>

            {showClearMenu && (
              <div style={{ position: "absolute", top: "115%", right: 0, backgroundColor: "#111", border: "1px solid #333", borderRadius: "8px", overflow: "hidden", minWidth: "190px", boxShadow: "0 10px 30px rgba(0,0,0,0.8)", zIndex: 1001 }}>
                <button 
                  onClick={() => toggleGroupActive('POSITIVO')}
                  style={{ width: "100%", padding: "12px 15px", textAlign: "left", backgroundColor: "transparent", color: "#7c3aed", border: "none", fontSize: "11px", fontWeight: "bold", cursor: "pointer", borderBottom: "1px solid #222" }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#1a1a1a"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                >
                  ON/OFF POSITIVOS
                </button>
                <button 
                  onClick={() => toggleGroupActive('NEGATIVO')}
                  style={{ width: "100%", padding: "12px 15px", textAlign: "left", backgroundColor: "transparent", color: "#ef4444", border: "none", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#1a1a1a"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                >
                  VACIAR NEGATIVOS
                </button>
              </div>
            )}
          </div>

          {/* DROPDOWN INSPIRA */}
          <div style={{ position: "relative" }} ref={inspiraDropdownRef} onMouseEnter={() => setShowInspiraMenu(true)} onMouseLeave={() => setShowInspiraMenu(false)}>
            <button
              style={{ backgroundColor: "#1a0a2e", color: "#c084fc", border: "1px solid #6b21a8", padding: "8px 15px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
            >
              ✨ INSPIRA {showInspiraMenu ? "▲" : "▼"}
            </button>

            {showInspiraMenu && (
              <div style={{ position: "absolute", top: "100%", left: 0, backgroundColor: "#111", border: "1px solid #3b1a5a", borderRadius: "8px", overflow: "hidden", minWidth: "220px", boxShadow: "0 10px 30px rgba(0,0,0,0.8)", zIndex: 1001 }}>

                {/* Links existentes */}
                {inspiraLinks.map(link => (
                  <div key={link.id} style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #1e1e1e" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1a0a2e"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ flex: 1, padding: "11px 15px", color: "#c084fc", fontSize: "11px", fontWeight: "bold", textDecoration: "none", display: "block" }}
                    >
                      {link.emoji} {link.label}
                    </a>
                    <button
                      onClick={() => handleRemoveLink(link.id)}
                      title="Eliminar link"
                      style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "0 10px", fontSize: "12px" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "#555"}
                    >✕</button>
                  </div>
                ))}

                {/* Formulario agregar link */}
                {showAddLink ? (
                  <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px solid #2a1a3a" }}>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <input
                        type="text"
                        placeholder="😀"
                        value={newLinkEmoji}
                        onChange={e => setNewLinkEmoji(e.target.value)}
                        style={{ width: "38px", backgroundColor: "#000", border: "1px solid #444", color: "#fff", borderRadius: "4px", padding: "4px 6px", fontSize: "13px", textAlign: "center" }}
                      />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Nombre"
                        value={newLinkLabel}
                        onChange={e => setNewLinkLabel(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleAddLink(); if (e.key === "Escape") setShowAddLink(false); }}
                        style={{ flex: 1, backgroundColor: "#000", border: "1px solid #444", color: "#fff", borderRadius: "4px", padding: "4px 8px", fontSize: "11px" }}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={newLinkUrl}
                      onChange={e => setNewLinkUrl(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleAddLink(); if (e.key === "Escape") setShowAddLink(false); }}
                      style={{ width: "100%", backgroundColor: "#000", border: "1px solid #444", color: "#aaa", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", boxSizing: "border-box" }}
                    />
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button onClick={handleAddLink} style={{ flex: 1, backgroundColor: "#6b21a8", color: "#fff", border: "none", borderRadius: "4px", padding: "5px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>✓ AGREGAR</button>
                      <button onClick={() => setShowAddLink(false)} style={{ background: "none", border: "1px solid #333", color: "#666", borderRadius: "4px", padding: "5px 8px", fontSize: "10px", cursor: "pointer" }}>✕</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddLink(true)}
                    style={{ width: "100%", padding: "10px 15px", textAlign: "left", backgroundColor: "transparent", color: "#6b21a8", border: "none", borderTop: inspiraLinks.length > 0 ? "1px solid #1e1e1e" : "none", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#0d0018"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    ＋ AGREGAR LINK
                  </button>
                )}
              </div>
            )}
          </div>

          <button onClick={handleGenerarIA} disabled={loadingAI} style={{ backgroundColor: "#1e40af", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>
              {loadingAI ? "TRADUCIENDO..." : "✨ IA"}
          </button>
          <button onClick={() => enviarAComfy(prompt, negativePrompt)} disabled={sendingComfy} style={{ backgroundColor: "#f97316", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>
              {sendingComfy ? "ENVIANDO..." : "🚀 COMFY"}
          </button>
        </div>
      </nav>

      {/* MODAL BIBLIOTECA */}
      {showBiblioteca && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #164e63", borderRadius: "14px", width: "100%", maxWidth: "720px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.95)" }}>
            {/* Header */}
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #1a2a2a", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, backgroundColor: "#0d0d0d", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "18px" }}>📚</span>
                <span style={{ color: "#22d3ee", fontWeight: "bold", fontSize: "14px" }}>{editingBibItem ? "EDITAR ENTRADA" : "NUEVA ENTRADA — BIBLIOTECA"}</span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {!editingBibItem && bibliotecaItems.length > 0 && (
                  <button onClick={handleExportBib} style={{ backgroundColor: "#0a1020", color: "#60a5fa", border: "1px solid #1e3a5f", borderRadius: "6px", padding: "6px 12px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>⬇️ EXPORTAR JSON</button>
                )}
                <button onClick={() => setShowBiblioteca(false)} style={{ background: "none", border: "1px solid #333", borderRadius: "6px", color: "#666", cursor: "pointer", padding: "6px 10px", fontSize: "13px" }}>✕</button>
              </div>
            </div>

            {/* Formulario */}
            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "10px", color: "#22d3ee", fontWeight: "bold", display: "block", marginBottom: "5px", letterSpacing: "0.4px" }}>TÍTULO / NOMBRE</label>
                <input value={bibForm.titulo} onChange={e => setBibForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ej: Personaje épico fantasy, DTF vintage..." style={{ width: "100%", backgroundColor: "#050505", border: "1px solid #1e3a4a", borderRadius: "7px", color: "#e0e0e0", padding: "9px 12px", fontSize: "12px", outline: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#22d3ee"} onBlur={e => e.target.style.borderColor = "#1e3a4a"} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px" }}>
                  <label style={{ fontSize: "10px", color: "#7c3aed", fontWeight: "bold", letterSpacing: "0.4px" }}>PROMPT POSITIVO</label>
                  <button
                    onClick={() => handleExpandirBibIA("pos")}
                    disabled={loadingBibIA.pos || !bibForm.promptPositivo.trim()}
                    style={{ backgroundColor: loadingBibIA.pos ? "#111" : "#1e1a3a", color: loadingBibIA.pos ? "#555" : "#a78bfa", border: "1px solid #3b2a6a", borderRadius: "5px", padding: "3px 9px", fontSize: "10px", fontWeight: "bold", cursor: loadingBibIA.pos || !bibForm.promptPositivo.trim() ? "not-allowed" : "pointer", opacity: !bibForm.promptPositivo.trim() ? 0.4 : 1, transition: "all 0.15s" }}
                  >
                    {loadingBibIA.pos ? "⏳ TRADUCIENDO..." : "✨ EXPANDIR CON IA"}
                  </button>
                </div>
                <textarea value={bibForm.promptPositivo} onChange={e => setBibForm(f => ({ ...f, promptPositivo: e.target.value }))} placeholder="Ingresá el prompt positivo..." rows={4} style={{ width: "100%", backgroundColor: "#050505", border: "1px solid #3b0764", borderRadius: "7px", color: "#e0e0e0", padding: "9px 12px", fontSize: "12px", resize: "vertical", outline: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#7c3aed"} onBlur={e => e.target.style.borderColor = "#3b0764"} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px" }}>
                  <label style={{ fontSize: "10px", color: "#ef4444", fontWeight: "bold", letterSpacing: "0.4px" }}>PROMPT NEGATIVO</label>
                  <button
                    onClick={() => handleExpandirBibIA("neg")}
                    disabled={loadingBibIA.neg || !bibForm.promptNegativo.trim()}
                    style={{ backgroundColor: loadingBibIA.neg ? "#111" : "#1a0a0a", color: loadingBibIA.neg ? "#555" : "#f87171", border: "1px solid #7f1d1d", borderRadius: "5px", padding: "3px 9px", fontSize: "10px", fontWeight: "bold", cursor: loadingBibIA.neg || !bibForm.promptNegativo.trim() ? "not-allowed" : "pointer", opacity: !bibForm.promptNegativo.trim() ? 0.4 : 1, transition: "all 0.15s" }}
                  >
                    {loadingBibIA.neg ? "⏳ TRADUCIENDO..." : "✨ TRADUCIR CON IA"}
                  </button>
                </div>
                <textarea value={bibForm.promptNegativo} onChange={e => setBibForm(f => ({ ...f, promptNegativo: e.target.value }))} placeholder="Ingresá el prompt negativo..." rows={3} style={{ width: "100%", backgroundColor: "#050505", border: "1px solid #7f1d1d", borderRadius: "7px", color: "#e0e0e0", padding: "9px 12px", fontSize: "12px", resize: "vertical", outline: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#ef4444"} onBlur={e => e.target.style.borderColor = "#7f1d1d"} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "10px", color: "#888", fontWeight: "bold", display: "block", marginBottom: "5px", letterSpacing: "0.4px" }}>NOTAS</label>
                  <textarea value={bibForm.notas} onChange={e => setBibForm(f => ({ ...f, notas: e.target.value }))} placeholder="Notas generales, contexto, model usado..." rows={3} style={{ width: "100%", backgroundColor: "#050505", border: "1px solid #2a2a2a", borderRadius: "7px", color: "#aaa", padding: "9px 12px", fontSize: "12px", resize: "vertical", outline: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#555"} onBlur={e => e.target.style.borderColor = "#2a2a2a"} />
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "#888", fontWeight: "bold", display: "block", marginBottom: "5px", letterSpacing: "0.4px" }}>OBSERVACIONES</label>
                  <textarea value={bibForm.observaciones} onChange={e => setBibForm(f => ({ ...f, observaciones: e.target.value }))} placeholder="Observaciones, mejoras posibles, resultados..." rows={3} style={{ width: "100%", backgroundColor: "#050505", border: "1px solid #2a2a2a", borderRadius: "7px", color: "#aaa", padding: "9px 12px", fontSize: "12px", resize: "vertical", outline: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#555"} onBlur={e => e.target.style.borderColor = "#2a2a2a"} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "10px", color: "#a78bfa", fontWeight: "bold", display: "block", marginBottom: "5px", letterSpacing: "0.4px" }}>🔗 LINK / FUENTE</label>
                  <input value={bibForm.linkFuente} onChange={e => setBibForm(f => ({ ...f, linkFuente: e.target.value }))} placeholder="https://donde-obtuve-el-prompt.com" style={{ width: "100%", backgroundColor: "#050505", border: "1px solid #3b2a5a", borderRadius: "7px", color: "#a78bfa", padding: "9px 12px", fontSize: "12px", outline: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#a78bfa"} onBlur={e => e.target.style.borderColor = "#3b2a5a"} />
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "#34d399", fontWeight: "bold", display: "block", marginBottom: "5px", letterSpacing: "0.4px" }}>🖼️ LINK IMAGEN REFERENCIA</label>
                  <input value={bibForm.linkImagen} onChange={e => setBibForm(f => ({ ...f, linkImagen: e.target.value }))} placeholder="https://imagen-referencia.jpg" style={{ width: "100%", backgroundColor: "#050505", border: "1px solid #064e3b", borderRadius: "7px", color: "#34d399", padding: "9px 12px", fontSize: "12px", outline: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#34d399"} onBlur={e => e.target.style.borderColor = "#064e3b"} />
                </div>
              </div>
              {/* Preview imagen si hay link */}
              {bibForm.linkImagen && (
                <div style={{ textAlign: "center" }}>
                  <img src={bibForm.linkImagen} alt="Referencia" onError={e => { e.target.style.display = "none"; }} style={{ maxHeight: "180px", borderRadius: "8px", border: "1px solid #164e63", objectFit: "contain" }} />
                </div>
              )}
              {/* Botones */}
              <div style={{ display: "flex", gap: "10px", paddingTop: "6px" }}>
                <button onClick={handleGuardarBib} style={{ flex: 1, backgroundColor: "#164e63", color: "#22d3ee", border: "1px solid #22d3ee", borderRadius: "8px", padding: "11px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>
                  💾 {editingBibItem ? "GUARDAR CAMBIOS" : "GUARDAR EN BIBLIOTECA"}
                </button>
                {editingBibItem && (
                  <button onClick={() => { handleEliminarBib(editingBibItem.id); setShowBiblioteca(false); }} style={{ backgroundColor: "#1a0000", color: "#ef4444", border: "1px solid #7f1d1d", borderRadius: "8px", padding: "11px 18px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>🗑️</button>
                )}
                <button onClick={() => setShowBiblioteca(false)} style={{ backgroundColor: "#111", color: "#666", border: "1px solid #333", borderRadius: "8px", padding: "11px 18px", fontSize: "12px", cursor: "pointer" }}>Cancelar</button>
              </div>
            </div>

            {/* Lista de items guardados (solo cuando se crea nuevo) */}
            {!editingBibItem && bibliotecaItems.length > 0 && (
              <div style={{ borderTop: "1px solid #1a2a2a", padding: "18px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "11px", color: "#22d3ee", fontWeight: "bold" }}>📋 ENTRADAS GUARDADAS ({bibliotecaItems.length})</span>
                  <button onClick={handleExportBib} style={{ backgroundColor: "#0a1020", color: "#60a5fa", border: "1px solid #1e3a5f", borderRadius: "5px", padding: "4px 10px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>⬇️ EXPORTAR TODO</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px", maxHeight: "340px", overflowY: "auto" }}>
                  {bibliotecaItems.map(item => (
                    <div key={item.id} style={{ backgroundColor: "#111", border: "1px solid #1e3a4a", borderRadius: "9px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "7px" }}>
                      <div style={{ fontSize: "12px", color: "#22d3ee", fontWeight: "bold" }}>{item.titulo || "Sin título"}</div>
                      {item.promptPositivo && <div style={{ fontSize: "10px", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><span style={{ color: "#7c3aed" }}>+</span> {item.promptPositivo.substring(0, 70)}{item.promptPositivo.length > 70 ? "…" : ""}</div>}
                      {item.promptNegativo && <div style={{ fontSize: "10px", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><span style={{ color: "#ef4444" }}>–</span> {item.promptNegativo.substring(0, 70)}{item.promptNegativo.length > 70 ? "…" : ""}</div>}
                      {item.linkImagen && <img src={item.linkImagen} alt="ref" onError={e => { e.target.style.display = "none"; }} style={{ width: "100%", maxHeight: "80px", objectFit: "cover", borderRadius: "5px", border: "1px solid #1e3a4a" }} />}
                      {item.linkFuente && <a href={item.linkFuente} target="_blank" rel="noopener noreferrer" style={{ fontSize: "10px", color: "#a78bfa", textDecoration: "underline", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🔗 {item.linkFuente}</a>}
                      <div style={{ display: "flex", gap: "5px" }}>
                        <button onClick={() => handleEditarBib(item)} style={{ flex: 1, backgroundColor: "#0a1a1a", color: "#22d3ee", border: "1px solid #164e63", borderRadius: "5px", padding: "5px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>✏️ EDITAR</button>
                        <button onClick={() => { navigator.clipboard.writeText(item.promptPositivo || ""); alert("📋 Positivo copiado!"); }} style={{ flex: 1, backgroundColor: "#0a0a1a", color: "#7c3aed", border: "1px solid #3b0764", borderRadius: "5px", padding: "5px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>📋 +</button>
                        <button onClick={() => handleEliminarBib(item.id)} style={{ backgroundColor: "#1a0000", color: "#ef4444", border: "1px solid #7f1d1d", borderRadius: "5px", padding: "5px 7px", fontSize: "10px", cursor: "pointer" }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PANEL HISTORIAL */}
      {showHistory && (
        <div style={{ backgroundColor: "#0a0a0a", borderBottom: "1px solid #2a2a00", padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "11px", fontWeight: "bold", color: "#facc15" }}>📂 HISTORIAL DE GUARDADOS</span>
            {saves.length === 0 && <span style={{ fontSize: "11px", color: "#555" }}>No hay guardados aún.</span>}
          </div>

          {saves.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", maxHeight: "400px", overflowY: "auto" }}>
              {saves.map(save => (
                <div key={save.id} style={{ backgroundColor: "#111", border: "1px solid #2a2a00", borderRadius: "8px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  
                  {/* Nombre editable */}
                  {editingNameId === save.id ? (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input
                        autoFocus
                        value={editingNameValue}
                        onChange={e => setEditingNameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleRenameConfirm(save.id); if (e.key === "Escape") setEditingNameId(null); }}
                        style={{ flex: 1, backgroundColor: "#000", border: "1px solid #facc15", color: "#facc15", borderRadius: "4px", padding: "4px 8px", fontSize: "11px" }}
                      />
                      <button onClick={() => handleRenameConfirm(save.id)} style={{ backgroundColor: "#facc15", color: "#000", border: "none", borderRadius: "4px", padding: "4px 8px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>✓</button>
                      <button onClick={() => setEditingNameId(null)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "12px" }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "12px", color: "#e0e0e0", fontWeight: "bold", display: "block", marginBottom: "4px" }}>{save.name}</span>
                      <div style={{ fontSize: "10px", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span style={{ color: "#7c3aed" }}>+</span> {save.prompt.substring(0, 55)}{save.prompt.length > 55 ? "…" : ""}
                      </div>
                      <div style={{ fontSize: "10px", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span style={{ color: "#ef4444" }}>–</span> {save.negativePrompt.substring(0, 55)}{save.negativePrompt.length > 55 ? "…" : ""}
                      </div>
                    </div>
                  )}

                  {/* Acciones fila 1 */}
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button
                      onClick={() => handleRenameStart(save)}
                      title="Cambiar nombre"
                      style={{ flex: 1, backgroundColor: "#1a1a00", color: "#facc15", border: "1px solid #3a3a00", borderRadius: "5px", padding: "5px 6px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleCargarSave(save)}
                      title="Cargar en los paneles"
                      style={{ flex: 2, backgroundColor: "#0c1a0c", color: "#4ade80", border: "1px solid #166534", borderRadius: "5px", padding: "5px 6px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}
                    >
                      ⬆️ CARGAR
                    </button>
                    <button
                      onClick={() => handleDeleteSave(save.id)}
                      title="Eliminar guardado"
                      style={{ flex: 1, backgroundColor: "#1a0000", color: "#ef4444", border: "1px solid #7f1d1d", borderRadius: "5px", padding: "5px 6px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}
                    >
                      🗑️
                    </button>
                  </div>
                  {/* Acciones fila 2 */}
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button
                      onClick={() => handleExportSave(save)}
                      title="Exportar este guardado como JSON"
                      style={{ flex: 1, backgroundColor: "#0a0a1a", color: "#60a5fa", border: "1px solid #1e3a5f", borderRadius: "5px", padding: "5px 6px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}
                    >
                      ⬇️ EXPORTAR JSON
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: "20px" }}>
        {/* TABS POSITIVOS */}
        <div style={{ marginBottom: "30px" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #333", marginBottom: "15px", gap: "5px" }}>
            {TABS_CONFIG.POSITIVO.map(tab => (
              <button key={tab.id} onClick={() => setActiveTabPos(tab.id)} style={{ padding: "10px 20px", backgroundColor: activeTabPos === tab.id ? "#1a1a1a" : "transparent", color: activeTabPos === tab.id ? "#7c3aed" : "#666", border: "none", borderBottom: activeTabPos === tab.id ? "2px solid #7c3aed" : "none", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>
                {tab.label}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "15px" }}>
            {TABS_CONFIG.POSITIVO.find(t => t.id === activeTabPos).keys.map(key => (
                <Card key={key} id={key} label={HMR_LABELS[key]} hmrCards={hmrCards} bank={bank} handleMultiSelect={handleMultiSelect} setHmrCards={setHmrCards} color={GET_COLOR(key)} />
            ))}
          </div>
        </div>

        {/* TABS NEGATIVOS */}
        <div style={{ marginBottom: "30px", padding: "20px", backgroundColor: "#110505", borderRadius: "12px", border: "1px solid #300" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #400", marginBottom: "15px", gap: "5px" }}>
            {TABS_CONFIG.NEGATIVO.map(tab => (
              <button key={tab.id} onClick={() => setActiveTabNeg(tab.id)} style={{ padding: "10px 20px", backgroundColor: activeTabNeg === tab.id ? "#2a0a0a" : "transparent", color: activeTabNeg === tab.id ? "#ef4444" : "#666", border: "none", borderBottom: activeTabNeg === tab.id ? "2px solid #ef4444" : "none", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>
                {tab.label}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "15px" }}>
            {TABS_CONFIG.NEGATIVO.find(t => t.id === activeTabNeg).keys.map(key => (
                <Card key={key} id={key} label={NEGATIVE_LABELS[key]} hmrCards={hmrCards} bank={bank} handleMultiSelect={handleMultiSelect} setHmrCards={setHmrCards} color="#ef4444" isNeg />
            ))}
          </div>
        </div>

        {/* MÓDULO DE TEXTO */}
        <TextoModule
          textos={textos}
          setTextos={setTextos}
          textoTab={textoTab}
          setTextoTab={setTextoTab}
          showTextos={showTextos}
          setShowTextos={setShowTextos}
        />

        {/* MÓDULO IMAGEN → CONCEPTO */}
        <ImagenConceptoModule
          hmrCards={hmrCards}
          setHmrCards={setHmrCards}
          bank={bank}
        />

        {/* RESULTADOS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", backgroundColor: "#000", padding: "20px", borderRadius: "12px", border: "1px solid #222" }}>
            <div>
                <label style={{ fontSize: "10px", color: "#7c3aed", fontWeight: "bold", display: "block", marginBottom: "8px" }}>PROMPT POSITIVO (Sombrea para añadir peso)</label>
                <textarea value={prompt} onMouseUp={(e) => handleTextSelection(e, "prompt")} onChange={(e) => setPrompt(e.target.value)} style={{ width: "100%", minHeight: "120px", backgroundColor: "#050505", border: "1px solid #7c3aed", borderRadius: "8px", color: "#fff", padding: "10px", fontSize: "12px", resize: "vertical" }} />
                <button onClick={() => copiarAlPortapapeles(prompt)} style={{ marginTop: "10px", width: "100%", backgroundColor: "#7c3aed", color: "#fff", border: "none", padding: "8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>📋 COPIAR POSITIVO</button>
            </div>
            <div>
                <label style={{ fontSize: "10px", color: "#ef4444", fontWeight: "bold", display: "block", marginBottom: "8px" }}>PROMPT NEGATIVO (Sombrea para añadir peso)</label>
                <textarea value={negativePrompt} onMouseUp={(e) => handleTextSelection(e, "negative")} onChange={(e) => setNegativePrompt(e.target.value)} style={{ width: "100%", minHeight: "120px", backgroundColor: "#050505", border: "1px solid #ef4444", borderRadius: "8px", color: "#fff", padding: "10px", fontSize: "12px", resize: "vertical" }} />
                <button onClick={() => copiarAlPortapapeles(negativePrompt)} style={{ marginTop: "10px", width: "100%", backgroundColor: "#ef4444", color: "#fff", border: "none", padding: "8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>📋 COPIAR NEGATIVO</button>
            </div>
        </div>
      </div>
    </div>
  );
};

const Card = ({ id, label, hmrCards, bank, handleMultiSelect, setHmrCards, color, isNeg }) => {
  const cardData = hmrCards[id];
  if (!cardData?.active) return <div onClick={() => setHmrCards(prev => ({...prev, [id]: {...prev[id], active: true}}))} style={{ border: "1px dashed #333", padding: "10px", borderRadius: "8px", textAlign: "center", cursor: "pointer", fontSize: "10px", color: "#444" }}>+ Activar {label}</div>;

  return (
    <div style={{ background: isNeg ? "#1a0a0a" : "#111", border: `1px solid ${cardData.locked || cardData.showManual ? color : "#333"}`, borderRadius: "10px", padding: "12px", minHeight: "100px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "center" }}>
        <span style={{ fontSize: "10px", color: color, fontWeight: "bold" }}>{label.toUpperCase()}</span>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button onClick={() => setHmrCards(prev => ({...prev, [id]: {...prev[id], locked: !prev[id].locked}}))} style={{ background: "none", border: "none", cursor: "pointer" }}><LockIcon color={cardData.locked ? color : "#666"} /></button>
          {!cardData.showManual && <button onClick={() => setHmrCards(prev => ({...prev, [id]: {...prev[id], showManual: true}}))} style={{ background: "none", border: "none", cursor: "pointer" }}><EditIcon color="#666" /></button>}
          <button onClick={() => setHmrCards(prev => ({...prev, [id]: {...prev[id], active: false}}))} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "12px" }}>✕</button>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
        {!cardData.showManual ? (
          MULTI_SELECT_CATS.includes(id) ? (
            <div style={{ maxHeight: "80px", overflowY: "auto", border: "1px solid #222", padding: "5px", borderRadius: "5px", width: "100%" }}>
              {bank[id]?.map((opt, i) => (
                <label key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: cardData.selected.includes(opt) ? color : "#999", padding: "2px 0", cursor: "pointer" }}>
                  <input type="checkbox" checked={cardData.selected.includes(opt)} onChange={() => handleMultiSelect(id, opt)} style={{ accentColor: color }} />{opt}
                </label>
              ))}
            </div>
          ) : (
            <select value={cardData.selected} onChange={(e) => setHmrCards(prev => ({...prev, [id]: {...prev[id], selected: e.target.value}}))} style={{ width: "100%", padding: "8px", backgroundColor: "#000", color: "#ccc", border: "1px solid #333", borderRadius: "6px", fontSize: "11px" }}>
              {bank[id]?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
            </select>
          )
        ) : (
          <div style={{ position: "relative", width: "100%" }}>
            <input type="text" placeholder="Manual..." value={cardData.manual} onChange={(e) => setHmrCards(prev => ({...prev, [id]: {...prev[id], manual: e.target.value}}))} style={{ width: "100%", padding: "8px 30px 8px 10px", backgroundColor: "#000", color: color, border: `1px solid ${color}`, borderRadius: "6px", fontSize: "11px", boxSizing: "border-box" }} />
            <button onClick={() => setHmrCards(prev => ({...prev, [id]: {...prev[id], showManual: false, manual: ""}}))} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#666", cursor: "pointer" }}>✕</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;