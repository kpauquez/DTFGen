import React, { useState, useRef, useEffect } from "react";

const StickyMenu = ({ enableLocalAI, setEnableLocalAI }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showBiblioteca, setShowBiblioteca] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowHistory(false);
        setShowBiblioteca(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 1000,
      backgroundColor: "#0f0f0f",
      borderBottom: "1px solid #333",
      padding: "10px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <span style={{ fontWeight: "bold", fontSize: "14px", color: "#7c3aed" }}>
        PROMPT GENERATOR
      </span>
      
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        {/* Botón IA LOCAL - NUEVO */}
        <button 
          onClick={() => setEnableLocalAI(!enableLocalAI)}
          style={{
            backgroundColor: enableLocalAI ? "#0ea5e9" : "#222",
            color: enableLocalAI ? "white" : "#aaa",
            border: "1px solid " + (enableLocalAI ? "#0ea5e9" : "#444"),
            padding: "8px 15px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          {enableLocalAI ? "❌ Cerrar IA" : "🚀 Cargar IA Local"}
        </button>

        {/* Tus botones existentes */}
        <button style={{ padding: "8px 12px", borderRadius: "6px", background: "#222", color: "#aaa" }}>
          Generar
        </button>
        <button style={{ padding: "8px 12px", borderRadius: "6px", background: "#222", color: "#aaa" }}>
          Copiar
        </button>
        <button style={{ padding: "8px 12px", borderRadius: "6px", background: "#222", color: "#aaa" }}>
          ComfyUI
        </button>
        
        {/* Historial */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button onClick={() => setShowHistory(!showHistory)}>
            📚 Historial
          </button>
          {showHistory && (
            <div style={{ position: "absolute", top: "40px", right: 0, background: "#0d0d0d" }}>
              {/* Tu lógica de historial */}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default StickyMenu;