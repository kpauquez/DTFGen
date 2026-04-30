import { useState, useEffect, useRef } from "react";

// Categorías Positivas
const HMR_LABELS = {
  sujeto: "Sujeto", pose: "Pose", accion: "Acción", ambiente: "Ambiente",
  estilo: "Estilo", iluminacion: "Iluminación", atmosfera: "Atmósfera",
  detalles: "Detalles", angulo: "Ángulo", calidad: "Calidad",
  formato: "Formato", paleta: "Paleta", fondo: "Fondo", mascara: "Máscara"
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

const MULTI_SELECT_CATS = ["fondo", "mascara", "n_calidad", "n_anatomia", "n_rostro", "n_estilo", "n_composicion", "n_texto"];

const App = () => {
  const [bank, setBank] = useState(null);
  const [hmrCards, setHmrCards] = useState({});
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  
  const [copiedPos, setCopiedPos] = useState(false);
  const [copiedNeg, setCopiedNeg] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState("");

  const [showPosTabs, setShowPosTabs] = useState(true);
  const [showNegTabs, setShowNegTabs] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);

  // Referencias para el scroll
  const posSectionRef = useRef(null);
  const negSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);

  useEffect(() => {
    fetch("./hmr-bank.json")
      .then(res => res.json())
      .then(data => {
        const fullData = {
          ...data,
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

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const handleTogglePos = () => {
    const nextState = !showPosTabs;
    setShowPosTabs(nextState);
    if (nextState) setTimeout(() => scrollToSection(posSectionRef), 100);
  };

  const handleToggleNeg = () => {
    const nextState = !showNegTabs;
    setShowNegTabs(nextState);
    if (nextState) setTimeout(() => scrollToSection(negSectionRef), 100);
  };

  // NUEVA FUNCIÓN: Toggle Plantillas + Scroll al inicio
  const handleToggleTemplates = () => {
    const nextState = !showTemplates;
    setShowTemplates(nextState);
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

  const renameTemplate = (id, newName) => {
    const updated = templates.map(t => t.id === id ? { ...t, name: newName } : t);
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
      
      {/* MENÚ SUPERIOR FLOTANTE */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 1000, backgroundColor: "rgba(15, 15, 15, 0.85)",
        backdropFilter: "blur(12px)", borderBottom: "1px solid #333", padding: "12px 30px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        opacity: 0.8, transition: "opacity 0.3s ease"
      }}
      onMouseOver={(e) => e.currentTarget.style.opacity = 1}
      onMouseOut={(e) => e.currentTarget.style.opacity = 0.8}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button 
            onClick={() => scrollToSection(resultsSectionRef)} 
            style={{ backgroundColor: "#333", color: "#fff", border: "1px solid #444", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}
          >
            ↓ VER PROMPT
          </button>
          <button onClick={handleTogglePos} style={{ backgroundColor: showPosTabs ? "#4c1d95" : "#111", color: "#fff", border: "1px solid #444", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}>
            {showPosTabs ? "Ocultar Positivos" : "Ver Positivos"}
          </button>
          <button onClick={handleToggleNeg} style={{ backgroundColor: showNegTabs ? "#991b1b" : "#111", color: "#fff", border: "1px solid #444", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}>
            {showNegTabs ? "Ocultar Negativos" : "Ver Negativos"}
          </button>
          {/* BOTÓN MODIFICADO: AHORA LLAMA A handleToggleTemplates */}
          <button onClick={handleToggleTemplates} style={{ backgroundColor: showTemplates ? "#065f46" : "#111", color: "#fff", border: "1px solid #444", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}>
            {showTemplates ? "Ocultar Plantillas" : "Ver Plantillas"}
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button onClick={handleCopyPos} style={{ backgroundColor: copiedPos ? "#10b981" : "#4c1d95", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", fontSize: "11px", cursor: "pointer", fontWeight: "bold", transition: "0.2s" }}>
            {copiedPos ? "¡LISTO! ✓" : "COPIAR POS"}
          </button>
          <button onClick={handleCopyNeg} style={{ backgroundColor: copiedNeg ? "#10b981" : "#991b1b", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", fontSize: "11px", cursor: "pointer", fontWeight: "bold", transition: "0.2s" }}>
            {copiedNeg ? "¡LISTO! ✓" : "COPIAR NEG"}
          </button>
          <div style={{ width: "1px", height: "20px", backgroundColor: "#333", margin: "0 5px" }} />
          <button onClick={randomizePositive} style={{ backgroundColor: "#7c3aed", color: "#fff", border: "none", padding: "8px 20px", borderRadius: "20px", fontSize: "12px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 0 15px rgba(124, 58, 237, 0.4)" }}>
            🎲 MEZCLA ALEATORIA
          </button>
        </div>
      </nav>

      <div style={{ padding: "30px" }}>
        
        {/* PLANTILLAS */}
        {showTemplates && (
          <div style={{ backgroundColor: "#111", padding: "25px", borderRadius: "15px", border: "1px solid #333", marginBottom: "50px" }}>
            <h2 style={{ fontSize: "14px", color: "#10b981", marginBottom: "15px", letterSpacing: "1px" }}>PLANTILLAS Y EXPORTACIÓN</h2>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <input type="text" placeholder="Nombre de la nueva plantilla..." value={templateName} onChange={(e) => setTemplateName(e.target.value)} 
                style={{ flex: 1, padding: "10px", backgroundColor: "#000", border: "1px solid #333", color: "#fff", borderRadius: "8px", boxSizing: "border-box" }} />
              <button onClick={saveTemplate} style={{ backgroundColor: "#10b981", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                GUARDAR SELECCIÓN
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px", marginBottom: "20px" }}>
              {templates.map(t => (
                <div key={t.id} style={{ backgroundColor: "#1a1a1a", padding: "10px", borderRadius: "10px", border: "1px solid #333" }}>
                  <input type="text" value={t.name} onChange={(e) => renameTemplate(t.id, e.target.value)} style={{ backgroundColor: "transparent", border: "none", color: "#10b981", fontSize: "12px", fontWeight: "bold", width: "100%", marginBottom: "8px", boxSizing: "border-box" }} />
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button onClick={() => loadTemplate(t)} style={{ flex: 1, background: "#059669", color: "white", border: "none", padding: "5px", borderRadius: "4px", fontSize: "10px", cursor: "pointer" }}>CARGAR</button>
                    <button onClick={() => deleteTemplate(t.id)} style={{ flex: 1, background: "#dc2626", color: "white", border: "none", padding: "5px", borderRadius: "4px", fontSize: "10px", cursor: "pointer" }}>BORRAR</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px", borderTop: "1px solid #222", paddingTop: "15px" }}>
              <button onClick={exportTemplates} style={{ flex: 1, backgroundColor: "#4b5563", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>📤 EXPORTAR A JSON</button>
              <label style={{ flex: 1, backgroundColor: "#4b5563", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "bold", textAlign: "center" }}>
                📥 IMPORTAR DESDE JSON
                <input type="file" onChange={importTemplates} style={{ display: "none" }} accept=".json" />
              </label>
            </div>
          </div>
        )}

        <div ref={posSectionRef}>
          <h2 style={{ fontSize: "14px", color: "#7c3aed", marginBottom: "15px", letterSpacing: "1px" }}>CONFIGURACIÓN POSITIVA</h2>
          {showPosTabs && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
              {Object.keys(HMR_LABELS).map(key => (
                <div key={key} onClick={() => toggleCategory(key)} style={{ padding: "6px 12px", borderRadius: "15px", fontSize: "11px", cursor: "pointer", backgroundColor: hmrCards[key]?.active ? "#4c1d95" : "#111", border: "1px solid #333" }}>
                  {HMR_LABELS[key]}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "15px", marginBottom: "50px" }}>
            {Object.keys(HMR_LABELS).map(key => hmrCards[key]?.active && (
              <Card key={key} id={key} label={HMR_LABELS[key]} hmrCards={hmrCards} bank={bank} toggleCategory={toggleCategory} handleMultiSelect={handleMultiSelect} setHmrCards={setHmrCards} color="#7c3aed" />
            ))}
          </div>
        </div>

        <div ref={negSectionRef} style={{ borderTop: "1px solid #222", paddingTop: "40px" }}>
          <h2 style={{ fontSize: "14px", color: "#ef4444", marginBottom: "15px", letterSpacing: "1px" }}>PROMPT NEGATIVO (EVITAR)</h2>
          {showNegTabs && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px", padding: "12px", backgroundColor: "#1a0a0a", borderRadius: "12px", border: "1px solid #991b1b33" }}>
              {Object.keys(NEGATIVE_LABELS).map(key => (
                <div key={key} onClick={() => toggleCategory(key)} style={{ padding: "6px 12px", borderRadius: "15px", fontSize: "11px", cursor: "pointer", backgroundColor: hmrCards[key]?.active ? "#991b1b" : "#111", border: "1px solid #444" }}>
                  {NEGATIVE_LABELS[key]}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "15px", marginBottom: "50px" }}>
            {Object.keys(NEGATIVE_LABELS).map(key => hmrCards[key]?.active && (
              <Card key={key} id={key} label={NEGATIVE_LABELS[key]} hmrCards={hmrCards} bank={bank} toggleCategory={toggleCategory} handleMultiSelect={handleMultiSelect} setHmrCards={setHmrCards} color="#ef4444" isNeg />
            ))}
          </div>
        </div>

        <div ref={resultsSectionRef} style={{ marginTop: "50px", padding: "25px", backgroundColor: "#0f0f0f", borderRadius: "20px", border: "2px solid #333" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            <div style={{ width: "100%" }}>
              <span style={{ fontSize: "10px", color: "#7c3aed", fontWeight: "bold" }}>PROMPT POSITIVO (EDITABLE)</span>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{ width: "100%", backgroundColor: "#050505", padding: "15px", borderRadius: "10px", border: "1px solid #222", marginTop: "10px", color: "#fff", fontSize: "13px", minHeight: "100px", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", display: "block" }} />
              <button onClick={handleCopyPos} style={{ width: "100%", marginTop: "10px", backgroundColor: copiedPos ? "#10b981" : "#7c3aed", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>
                {copiedPos ? "¡COPIADO! ✓" : "COPIAR POSITIVO"}
              </button>
            </div>
            <div style={{ width: "100%" }}>
              <span style={{ fontSize: "10px", color: "#ef4444", fontWeight: "bold" }}>PROMPT NEGATIVO (EVITAR EDITABLE)</span>
              <textarea value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} style={{ width: "100%", backgroundColor: "#050505", padding: "15px", borderRadius: "10px", border: "1px solid #222", marginTop: "10px", color: "#fca5a5", fontSize: "13px", minHeight: "100px", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", display: "block" }} />
              <button onClick={handleCopyNeg} style={{ width: "100%", marginTop: "10px", backgroundColor: copiedNeg ? "#10b981" : "#ef4444", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>
                {copiedNeg ? "¡COPIADO! ✓" : "COPIAR NEGATIVO"}
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
    <div style={{ background: isNeg ? "#1a0a0a" : "#111", border: `1px solid ${isNeg ? "#991b1b44" : "#222"}`, borderRadius: "12px", padding: "15px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <span style={{ fontSize: "10px", color: color, fontWeight: "bold" }}>{label.toUpperCase()}</span>
        <button onClick={() => toggleCategory(id)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer" }}>×</button>
      </div>
      {!isManualActive && (
        <div style={{ marginBottom: "10px" }}>
          {MULTI_SELECT_CATS.includes(id) ? (
            <div style={{ maxHeight: "120px", overflowY: "auto" }}>
              {bank[id]?.map((opt, i) => (
                <label key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0", fontSize: "12px", cursor: "pointer" }}>
                  <input type="checkbox" checked={hmrCards[id].selected.includes(opt)} onChange={() => handleMultiSelect(id, opt)} />
                  {opt}
                </label>
              ))}
            </div>
          ) : (
            <select value={hmrCards[id].selected} onChange={(e) => setHmrCards(prev => ({...prev, [id]: {...prev[id], selected: e.target.value}}))} style={{ width: "100%", padding: "8px", backgroundColor: "#050505", color: "#ccc", border: "1px solid #333", borderRadius: "6px" }}>
              {bank[id]?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
            </select>
          )}
        </div>
      )}
      <div style={{ position: "relative" }}>
        <input type="text" placeholder="Escribir manual..." value={hmrCards[id].manual} onChange={(e) => setHmrCards(prev => ({...prev, [id]: {...prev[id], manual: e.target.value}}))} style={{ width: "100%", padding: "8px 30px 8px 8px", backgroundColor: "#000", color: isNeg ? "#f87171" : "#a78bfa", border: isManualActive ? `1px solid ${color}` : "1px solid #222", borderRadius: "6px", fontSize: "12px", boxSizing: "border-box" }} />
        {isManualActive && <button onClick={clearManual} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: color, cursor: "pointer" }}>×</button>}
      </div>
    </div>
  );
};

export default App;