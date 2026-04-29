import { useState, useEffect } from "react";

const HMR_LABELS = {
  sujeto: "Sujeto", pose: "Pose", accion: "Acción", ambiente: "Ambiente",
  estilo: "Estilo", iluminacion: "Iluminación", atmosfera: "Atmósfera",
  detalles: "Detalles", angulo: "Ángulo", calidad: "Calidad",
  formato: "Formato", paleta: "Paleta", fondo: "Fondo", mascara: "Máscara"
};

const MULTI_SELECT_CATS = ["fondo", "mascara"];

const App = () => {
  const [bank, setBank] = useState(null);
  const [hmrCards, setHmrCards] = useState({});
  const [prompt, setPrompt] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false); // Estado para el feedback de copiado

  useEffect(() => {
    fetch("./hmr-bank.json")
      .then(res => res.json())
      .then(data => {
        setBank(data);
        const initialState = {};
        Object.keys(HMR_LABELS).forEach(key => {
          initialState[key] = {
            selected: MULTI_SELECT_CATS.includes(key) ? [] : (data[key]?.[0] || ""),
            active: true,
            manual: ""
          };
        });
        setHmrCards(initialState);
      })
      .catch(err => console.error("Error al cargar JSON", err));
  }, []);

  useEffect(() => {
    if (!bank) return;
    const finalString = Object.keys(HMR_LABELS)
      .filter(key => hmrCards[key]?.active)
      .map(key => {
        const card = hmrCards[key];
        if (card.manual.trim() !== "") return card.manual.trim();
        if (Array.isArray(card.selected)) return card.selected.join(", ");
        return card.selected;
      })
      .filter(Boolean)
      .join(", ");
    setPrompt(finalString);
  }, [hmrCards, bank]);

  // Función de copiado con feedback
  const handleCopy = () => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    
    // Volver al estado original tras 2 segundos
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const toggleCategory = (key) => {
    setHmrCards(prev => ({
      ...prev,
      [key]: { ...prev[key], active: !prev[key].active }
    }));
  };

  const handleMultiSelect = (key, value) => {
    setHmrCards(prev => {
      const currentSelection = prev[key].selected;
      const newSelection = currentSelection.includes(value)
        ? currentSelection.filter(item => item !== value)
        : [...currentSelection, value];
      return { ...prev, [key]: { ...prev[key], selected: newSelection } };
    });
  };

  if (!bank) return <div style={{ color: "#888", padding: "20px" }}>Cargando...</div>;

  return (
    <div style={{ 
      padding: "30px", 
      paddingBottom: isMinimized ? "100px" : "250px", 
      backgroundColor: "#050505", 
      minHeight: "100vh", 
      color: "#e0e0e0", 
      fontFamily: "sans-serif",
      transition: "padding 0.3s ease"
    }}>
      
      {/* MENU DE CHIPS */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "30px", padding: "15px", backgroundColor: "#0f0f0f", borderRadius: "15px", border: "1px solid #1a1a1a" }}>
        {Object.keys(HMR_LABELS).map(key => (
          <div key={key} onClick={() => toggleCategory(key)} style={{
            padding: "8px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", cursor: "pointer",
            backgroundColor: hmrCards[key]?.active ? "#4c1d95" : "transparent",
            borderColor: hmrCards[key]?.active ? "#7c3aed" : "#333",
            color: hmrCards[key]?.active ? "#fff" : "#666",
            border: "1px solid"
          }}>
            {HMR_LABELS[key]}
          </div>
        ))}
      </div>

      {/* GRILLA DE TARJETAS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {Object.keys(HMR_LABELS).map(key => (
          hmrCards[key]?.active && (
            <div key={key} style={{ background: "#111", border: "1px solid #222", borderRadius: "16px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                <span style={{ fontSize: "11px", color: "#555", fontWeight: "bold" }}>{HMR_LABELS[key].toUpperCase()}</span>
                <button onClick={() => toggleCategory(key)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer" }}>×</button>
              </div>

              {MULTI_SELECT_CATS.includes(key) ? (
                <div style={{ maxHeight: "150px", overflowY: "auto", marginBottom: "12px", opacity: hmrCards[key].manual.trim() !== "" ? 0.4 : 1 }}>
                  {bank[key]?.map((option, index) => (
                    <label key={index} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px", cursor: "pointer", fontSize: "13px", borderBottom: "1px solid #1a1a1a" }}>
                      <input type="checkbox" disabled={hmrCards[key].manual.trim() !== ""} checked={hmrCards[key].selected.includes(option)} onChange={() => handleMultiSelect(key, option)} />
                      {option}
                    </label>
                  ))}
                </div>
              ) : (
                <select
                  disabled={hmrCards[key].manual.trim() !== ""}
                  value={hmrCards[key].selected}
                  onChange={(e) => setHmrCards(prev => ({...prev, [key]: {...prev[key], selected: e.target.value}}))}
                  style={{ width: "100%", padding: "10px", backgroundColor: "#1a1a1a", color: hmrCards[key].manual.trim() !== "" ? "#444" : "#ddd", border: "1px solid #333", borderRadius: "8px", marginBottom: "12px", opacity: hmrCards[key].manual.trim() !== "" ? 0.5 : 1 }}
                >
                  {bank[key]?.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              )}

              <input
                type="text"
                placeholder="Texto manual..."
                value={hmrCards[key].manual}
                onChange={(e) => setHmrCards(prev => ({...prev, [key]: {...prev[key], manual: e.target.value}}))}
                style={{ width: "100%", padding: "12px", backgroundColor: "#050505", color: "#a78bfa", border: "1px solid #7c3aed55", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
              />
            </div>
          )
        ))}
      </div>

      {/* FOOTER COLAPSABLE CON BOTÓN DINÁMICO */}
      <div style={{ 
        position: "fixed", 
        bottom: isMinimized ? "-120px" : "20px", 
        left: "50%", 
        transform: "translateX(-50%)", 
        width: "90%", maxWidth: "1000px",
        backgroundColor: "#111", borderRadius: "16px", border: "1px solid #7c3aed", 
        boxShadow: "0px -10px 40px rgba(0,0,0,0.9)", zIndex: 1000,
        transition: "bottom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
      }}>
        <button onClick={() => setIsMinimized(!isMinimized)} style={{ position: "absolute", top: "-20px", right: "20px", backgroundColor: "#7c3aed", color: "white", border: "none", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", fontWeight: "bold", fontSize: "18px" }}>
          {isMinimized ? "↑" : "↓"}
        </button>

        <div style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "10px", color: "#7c3aed", fontWeight: "bold" }}>PROMPT GENERADO</span>
              <div style={{ marginTop: "8px", color: "#fff", fontSize: "14px", maxHeight: "120px", overflowY: "auto" }}>
                {prompt || "Esperando selección..."}
              </div>
            </div>
            
            {/* BOTÓN CON CAMBIO DE ESTADO Y COLOR */}
            <button 
              onClick={handleCopy} 
              style={{ 
                backgroundColor: copied ? "#10b981" : "#7c3aed", // Verde si está copiado, morado normal
                color: "#fff", 
                border: "none", 
                padding: "12px 25px", 
                borderRadius: "8px", 
                cursor: "pointer", 
                fontWeight: "bold", 
                whiteSpace: "nowrap", 
                alignSelf: "center",
                transition: "all 0.3s ease",
                minWidth: "120px",
                boxShadow: copied ? "0 0 20px rgba(16,185,129,0.4)" : "none"
              }}
            >
              {copied ? "¡Copiado! ✓" : "Copiar Prompt"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;