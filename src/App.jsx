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

  // Persistir guardados cada vez que cambian
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
    } catch (e) {
      console.error("Error al guardar historial:", e);
    }
  }, [saves]);

  // Persistir links de inspiración
  useEffect(() => {
    try {
      localStorage.setItem("prompt_generator_inspira_links", JSON.stringify(inspiraLinks));
    } catch (e) {}
  }, [inspiraLinks]);

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

    setPrompt(buildString(Object.keys(HMR_LABELS)));
    setNegativePrompt(buildString(Object.keys(NEGATIVE_LABELS)));
  }, [hmrCards, bank]);

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