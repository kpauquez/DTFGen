import { useState, useEffect, useRef } from "react";

// Componentes de Iconos SVG
const BotIcon = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ marginRight: "6px" }}>
    <rect x="4" y="10" width="16" height="11" rx="3" fill="#3b82f6" />
    <circle cx="9" cy="15" r="1.5" fill="#1e3a8a" />
    <circle cx="15" cy="15" r="1.5" fill="#1e3a8a" />
    <path d="M12 7V10" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="7" r="1.5" fill="#ef4444" />
  </svg>
);

const PromptIcon = ({ size = 14, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ marginRight: "6px" }}>
    <rect x="2" y="4" width="20" height="14" rx="3" fill="#334155" />
    <path d="M7 8L10 11L7 14" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12" y1="14" x2="17" y2="14" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Categorías Positivas - SE AGREGA DTF
const HMR_LABELS = {
  sujeto: "Sujeto", pose: "Pose", accion: "Acción", ambiente: "Ambiente",
  estilo: "Estilo", iluminacion: "Iluminación", atmosfera: "Atmósfera",
  detalles: "Detalles", angulo: "Ángulo", calidad: "Calidad",
  formato: "Formato", paleta: "Paleta", fondo: "Fondo", mascara: "Máscara",
  dtf: "DTF" // Nueva categoría
};

// Categorías Negativas
const NEGATIVE_LABELS = {
  n_calidad: "⭐ Calidad",
  n_anatomia: "🦴 Anatomía",
  n_rostro: "😐 Rostro",
  n_estilo: "🎨 Estilo NO deseado",
  n_composicion: "🖼 Composición",
  n_texto: "💬 Texto y Marcas"
};

// SE AGREGA "dtf" A MULTI_SELECT_CATS
const MULTI_SELECT_CATS = ["dtf", "fondo", "mascara", "n_calidad", "n_anatomia", "n_rostro", "n_estilo", "n_composicion", "n_texto"];

// Paleta de colores por categoría
const GET_COLOR = (key) => {
  if (key === "dtf") return "#f97316"; // Naranja para DTF
  if (NEGATIVE_LABELS[key]) return "#ef4444"; // Rojo para negativos
  return "#7c3aed"; // Violeta para el resto de positivos
};

const App = () => {
  const [bank, setBank] = useState(null);
  const [hmrCards, setHmrCards] = useState({});
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  
  const [copiedPos, setCopiedPos] = useState(false);
  const [copiedNeg, setCopiedNeg] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  const posSectionRef = useRef(null);
  const negSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);

  useEffect(() => {
    fetch("./hmr-bank.json")
      .then(res => res.json())
      .then(data => {
        const fullData = {
          ...data,
          dtf: data.dtf || [   "masterpiece", "modern graphic illustration", "poster style", "transparent background", "centered composition", "vector style", "sticker design",  "flat design", "flat color", "thick white outline", "sharp outlines", "solid palette", "clean composition", "clean shapes", "sharp design", "bold lines", "clean lines", "white background", "isolated white", "high contrast", "vivid colors"],
          n_calidad: ["baja calidad", "borroso", "pixelado", "ruido", "granulado", "desenfocado"],
          n_anatomia: ["mala anatomía", "deformado", "extremidades extra", "dedos extra", "manos malformadas", "proporciones incorrectas"],
          n_rostro: ["feo", "rostro deformado", "ojos malos", "ojos bizcos", "dientes malos"],
          n_estilo: ["caricatura", "anime", "boceto", "render 3D", "estilo infantil"],
          n_composicion: ["recortado", "fuera de cuadro", "duplicado", "sobresaturado", "marco"],
          n_texto: ["texto", "marca de agua", "firma", "logo"]
        };
        setBank(fullData);

        const initialState = {};
        const allKeys = [...Object.keys(HMR_LABELS), ...Object.keys(NEGATIVE_LABELS)];
        allKeys.forEach(key => {
          initialState[key] = {
            selected: MULTI_SELECT_CATS.includes(key) ? [] : (fullData[key]?.[0] || ""),
            active: true,
            manual: ""
          };
        });
        setHmrCards(initialState);
        
        const saved = localStorage.getItem("hmr_templates");
        if (saved) setTemplates(JSON.parse(saved));
      })
      .catch(err => console.error("Error al cargar JSON", err));
  }, []);

  useEffect(() => {
    if (!bank) return;
    const buildString = (keys) => keys
      .filter(key => hmrCards[key]?.active)
      .map(key => {
        const card = hmrCards[key];
        if (card.manual.trim() !== "") return card.manual.trim();
        return Array.isArray(card.selected) ? card.selected.join(", ") : card.selected;
      })
      .filter(Boolean)
      .join(", ");

    setPrompt(buildString(Object.keys(HMR_LABELS)));
    setNegativePrompt(buildString(Object.keys(NEGATIVE_LABELS)));
  }, [hmrCards, bank]);

  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      const offset = 100; 
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = ref.current.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const handleToggleTemplates = () => {
    setShowTemplates(!showTemplates);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const randomizePositive = () => {
    setHmrCards(prev => {
      const newState = { ...prev };
      Object.keys(HMR_LABELS).forEach(key => {
        if (bank[key] && bank[key].length > 0) {
          const options = bank[key];
          if (MULTI_SELECT_CATS.includes(key)) {
            const shuffled = [...options].sort(() => 0.5 - Math.random());
            newState[key] = { 
              ...newState[key], 
              selected: shuffled.slice(0, Math.floor(Math.random() * 3) + 1),
              manual: "" 
            };
          } else {
            const randomOpt = options[Math.floor(Math.random() * options.length)];
            newState[key] = { ...newState[key], selected: randomOpt, manual: "" };
          }
        }
      });
      return newState;
    });
  };

  const handleCopyPos = () => {
    navigator.clipboard.writeText(prompt);
    setCopiedPos(true);
    setTimeout(() => setCopiedPos(false), 2000);
  };

  const handleCopyNeg = () => {
    navigator.clipboard.writeText(negativePrompt);
    setCopiedNeg(true);
    setTimeout(() => setCopiedNeg(false), 2000);
  };

  const toggleCategory = (key) => {
    setHmrCards(prev => ({...prev, [key]: { ...prev[key], active: !prev[key].active }}));
  };

  const handleMultiSelect = (key, value) => {
    setHmrCards(prev => {
      const current = prev[key].selected;
      const next = current.includes(value) ? current.filter(i => i !== value) : [...current, value];
      return { ...prev, [key]: { ...prev[key], selected: next } };
    });
  };

  const saveTemplate = () => {
    if (!templateName.trim()) return alert("Ingresa un nombre para la plantilla");
    const newTemplate = {
      id: Date.now(),
      name: templateName,
      data: JSON.parse(JSON.stringify(hmrCards))
    };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    localStorage.setItem("hmr_templates", JSON.stringify(updated));
    setTemplateName("");
  };

  const loadTemplate = (template) => {
    setHmrCards(template.data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteTemplate = (id) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem("hmr_templates", JSON.stringify(updated));
  };

  const exportTemplates = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(templates));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "plantillas_prompt.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importTemplates = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        setTemplates(imported);
        localStorage.setItem("hmr_templates", JSON.stringify(imported));
      } catch (err) {
        alert("Error al importar el archivo JSON");
      }
    };
    reader.readAsText(file);
  };

  if (!bank) return <div style={{ color: "#888", padding: "20px" }}>Cargando...</div>;

  return (
    <div style={{ backgroundColor: "#050505", minHeight: "100vh", color: "#e0e0e0", fontFamily: "sans-serif" }}>
      
      <nav style={{
        position: "sticky", top: 0, zIndex: 1000, backgroundColor: "rgba(15, 15, 15, 0.9)",
        backdropFilter: "blur(12px)", borderBottom: "1px solid #333", padding: "10px 15px", 
        display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center",
        gap: "10px", opacity: 0.95
      }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
          <a href="https://perchance.org/qinegen" target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: "none", backgroundColor: "#1e40af", color: "#fff", border: "1px solid #3b82f6", padding: "6px 12px", borderRadius: "6px", fontSize: "10px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center" }}
          >
            <BotIcon /> QINEGEN
          </a>
          
          <button onClick={() => scrollToSection(posSectionRef)} 
            style={{ backgroundColor: "#4c1d95", color: "#fff", border: "1px solid #7c3aed", padding: "6px 12px", borderRadius: "6px", fontSize: "10px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center" }}
          >
            <PromptIcon /> POSITIVO
          </button>

          <button onClick={() => scrollToSection(negSectionRef)} 
            style={{ backgroundColor: "#991b1b", color: "#fff", border: "1px solid #ef4444", padding: "6px 12px", borderRadius: "6px", fontSize: "10px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center" }}
          >
            <PromptIcon /> NEGATIVO
          </button>

          <button onClick={() => scrollToSection(resultsSectionRef)} 
            style={{ backgroundColor: "#334155", color: "#fff", border: "1px solid #475569", padding: "6px 10px", borderRadius: "6px", fontSize: "10px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center" }}
          >
            <PromptIcon /> RESULTADOS
          </button>

          <button onClick={handleToggleTemplates} style={{ backgroundColor: showTemplates ? "#065f46" : "#111", color: "#fff", border: "1px solid #444", padding: "6px 10px", borderRadius: "6px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" }}>
            Plantillas
          </button>
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
          <button onClick={handleCopyPos} style={{ backgroundColor: copiedPos ? "#10b981" : "#4c1d95", color: "#fff", border: "none", padding: "7px 12px", borderRadius: "6px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" }}>
            {copiedPos ? "OK!" : "COPY +"}
          </button>
          <button onClick={handleCopyNeg} style={{ backgroundColor: copiedNeg ? "#10b981" : "#991b1b", color: "#fff", border: "none", padding: "7px 12px", borderRadius: "6px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" }}>
            {copiedNeg ? "OK!" : "COPY -"}
          </button>
          <button onClick={randomizePositive} style={{ backgroundColor: "#7c3aed", color: "#fff", border: "none", padding: "7px 15px", borderRadius: "20px", fontSize: "10px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 0 10px rgba(124, 58, 237, 0.3)" }}>
            🎲 MEZCLA
          </button>
        </div>
      </nav>

      <div style={{ padding: "20px 15px" }}>
        
        {/* SECCIÓN DE PLANTILLAS CORREGIDA */}
        {showTemplates && (
          <div style={{ backgroundColor: "#111", padding: "15px", borderRadius: "12px", border: "1px solid #333", marginBottom: "30px" }}>
            <h2 style={{ fontSize: "12px", color: "#10b981", marginBottom: "12px", letterSpacing: "1px" }}>GESTIÓN DE PLANTILLAS</h2>
            
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <input 
                type="text" 
                placeholder="Nombre de la plantilla..." 
                value={templateName} 
                onChange={(e) => setTemplateName(e.target.value)} 
                style={{ flex: 1, backgroundColor: "#050505", border: "1px solid #333", padding: "8px", borderRadius: "6px", color: "#fff", fontSize: "12px" }}
              />
              <button onClick={saveTemplate} style={{ backgroundColor: "#10b981", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>
                GUARDAR ACTUAL
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px", marginBottom: "20px" }}>
              {templates.map(t => (
                <div key={t.id} style={{ backgroundColor: "#1a1a1a", padding: "10px", borderRadius: "8px", border: "1px solid #222", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "#ddd", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button onClick={() => loadTemplate(t)} style={{ flex: 1, backgroundColor: "#1e40af", color: "#fff", border: "none", padding: "5px", borderRadius: "4px", fontSize: "9px", cursor: "pointer" }}>CARGAR</button>
                    <button onClick={() => deleteTemplate(t.id)} style={{ backgroundColor: "#991b1b", color: "#fff", border: "none", padding: "5px 8px", borderRadius: "4px", fontSize: "9px", cursor: "pointer" }}>✕</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px", borderTop: "1px solid #222", paddingTop: "15px" }}>
              <button onClick={exportTemplates} style={{ flex: 1, backgroundColor: "#334155", color: "#fff", border: "none", padding: "8px", borderRadius: "6px", fontSize: "10px", cursor: "pointer" }}>
                EXPORTAR JSON
              </button>
              <label style={{ flex: 1, backgroundColor: "#334155", color: "#fff", padding: "8px", borderRadius: "6px", fontSize: "10px", cursor: "pointer", textAlign: "center" }}>
                IMPORTAR JSON
                <input type="file" accept=".json" onChange={importTemplates} style={{ display: "none" }} />
              </label>
            </div>
          </div>
        )}

        <div ref={posSectionRef}>
          <h2 style={{ fontSize: "13px", color: "#7c3aed", marginBottom: "12px" }}>CONFIGURACIÓN POSITIVA</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
            {Object.keys(HMR_LABELS).map(key => (
              <div key={key} onClick={() => toggleCategory(key)} 
                style={{ 
                  padding: "5px 10px", 
                  borderRadius: "12px", 
                  fontSize: "10px", 
                  cursor: "pointer", 
                  backgroundColor: hmrCards[key]?.active ? GET_COLOR(key) : "#111", 
                  border: "1px solid #333",
                  transition: "all 0.2s"
                }}>
                {HMR_LABELS[key]}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px", marginBottom: "40px" }}>
            {Object.keys(HMR_LABELS).map(key => hmrCards[key]?.active && (
              <Card key={key} id={key} label={HMR_LABELS[key]} hmrCards={hmrCards} bank={bank} toggleCategory={toggleCategory} handleMultiSelect={handleMultiSelect} setHmrCards={setHmrCards} color={GET_COLOR(key)} />
            ))}
          </div>
        </div>

        <div ref={negSectionRef} style={{ borderTop: "1px solid #222", paddingTop: "30px" }}>
          <h2 style={{ fontSize: "13px", color: "#ef4444", marginBottom: "12px" }}>PROMPT NEGATIVO</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px", padding: "10px", backgroundColor: "#1a0a0a", borderRadius: "10px", border: "1px solid #991b1b33" }}>
            {Object.keys(NEGATIVE_LABELS).map(key => (
              <div key={key} onClick={() => toggleCategory(key)} style={{ padding: "5px 10px", borderRadius: "12px", fontSize: "10px", cursor: "pointer", backgroundColor: hmrCards[key]?.active ? "#991b1b" : "#111", border: "1px solid #444" }}>
                {NEGATIVE_LABELS[key]}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px", marginBottom: "40px" }}>
            {Object.keys(NEGATIVE_LABELS).map(key => hmrCards[key]?.active && (
              <Card key={key} id={key} label={NEGATIVE_LABELS[key]} hmrCards={hmrCards} bank={bank} toggleCategory={toggleCategory} handleMultiSelect={handleMultiSelect} setHmrCards={setHmrCards} color="#ef4444" isNeg />
            ))}
          </div>
        </div>

        {/* Sección de resultados */}
        <div ref={resultsSectionRef} style={{ marginTop: "40px", padding: "20px", backgroundColor: "#0f0f0f", borderRadius: "15px", border: "2px solid #333" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ width: "100%" }}>
              <span style={{ fontSize: "9px", color: "#7c3aed", fontWeight: "bold" }}>PROMPT POSITIVO</span>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{ width: "100%", backgroundColor: "#050505", padding: "12px", borderRadius: "8px", border: "1px solid #222", marginTop: "8px", color: "#fff", fontSize: "12px", minHeight: "80px", resize: "vertical", boxSizing: "border-box" }} />
              <button onClick={handleCopyPos} style={{ width: "100%", marginTop: "8px", backgroundColor: copiedPos ? "#10b981" : "#7c3aed", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "bold", fontSize: "11px" }}>
                {copiedPos ? "¡COPIADO!" : "COPIAR POSITIVO"}
              </button>
            </div>
            <div style={{ width: "100%" }}>
              <span style={{ fontSize: "9px", color: "#ef4444", fontWeight: "bold" }}>PROMPT NEGATIVO</span>
              <textarea value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} style={{ width: "100%", backgroundColor: "#050505", padding: "12px", borderRadius: "8px", border: "1px solid #222", marginTop: "8px", color: "#fca5a5", fontSize: "12px", minHeight: "80px", resize: "vertical", boxSizing: "border-box" }} />
              <button onClick={handleCopyNeg} style={{ width: "100%", marginTop: "8px", backgroundColor: copiedNeg ? "#10b981" : "#ef4444", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "bold", fontSize: "11px" }}>
                {copiedNeg ? "¡COPIADO!" : "COPIAR NEGATIVO"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Card = ({ id, label, hmrCards, bank, toggleCategory, handleMultiSelect, setHmrCards, color, isNeg }) => {
  const isManualActive = hmrCards[id].manual.trim() !== "";
  const clearManual = () => setHmrCards(prev => ({ ...prev, [id]: { ...prev[id], manual: "" } }));

  return (
    <div style={{ background: isNeg ? "#1a0a0a" : "#111", border: `1px solid ${isManualActive ? color : isNeg ? "#991b1b44" : "#222"}`, borderRadius: "10px", padding: "12px", boxSizing: "border-box", transition: "border 0.3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "9px", color: color, fontWeight: "bold" }}>{label.toUpperCase()}</span>
        <button onClick={() => toggleCategory(id)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer" }}>×</button>
      </div>
      {!isManualActive && (
        <div style={{ marginBottom: "8px" }}>
          {MULTI_SELECT_CATS.includes(id) ? (
            <div style={{ maxHeight: "100px", overflowY: "auto", paddingRight: "5px" }}>
              {bank[id]?.map((opt, i) => (
                <label key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 0", fontSize: "11px", cursor: "pointer", color: hmrCards[id].selected.includes(opt) ? color : "#ccc" }}>
                  <input type="checkbox" checked={hmrCards[id].selected.includes(opt)} onChange={() => handleMultiSelect(id, opt)} style={{ accentColor: color }} />
                  {opt}
                </label>
              ))}
            </div>
          ) : (
            <select value={hmrCards[id].selected} onChange={(e) => setHmrCards(prev => ({...prev, [id]: {...prev[id], selected: e.target.value}}))} style={{ width: "100%", padding: "6px", backgroundColor: "#050505", color: "#ccc", border: "1px solid #333", borderRadius: "6px", fontSize: "11px" }}>
              {bank[id]?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
            </select>
          )}
        </div>
      )}
      <div style={{ position: "relative" }}>
        <input type="text" placeholder="Escribe aquí..." value={hmrCards[id].manual} onChange={(e) => setHmrCards(prev => ({...prev, [id]: {...prev[id], manual: e.target.value}}))} style={{ width: "100%", padding: "6px 25px 6px 6px", backgroundColor: "#000", color: color, border: isManualActive ? `1px solid ${color}` : "1px solid #222", borderRadius: "6px", fontSize: "11px", boxSizing: "border-box" }} />
        {isManualActive && <button onClick={clearManual} style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: color, cursor: "pointer" }}>×</button>}
      </div>
    </div>
  );
};

export default App;