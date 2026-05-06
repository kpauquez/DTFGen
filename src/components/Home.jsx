import React, { useState, useRef, useEffect } from "react";

const Home = ({ promptsData, saves, bibliotecaItems }) => {
  const [buscadorQuery, setBuscadorQuery] = useState("");
  const [buscadorResults, setBuscadorResults] = useState([]);
  const buscadorRef = useRef();

  const getBuscadorResults = (query) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    // 1. Prompts JSON
    const fromJson = promptsData
      ?.filter(p => 
        p.title?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q)) ||
        p.prompt?.toLowerCase().includes(q)
      )
      ?.map(p => ({ ...p, source: "json" }));

    // 2. Biblioteca
    const fromBib = bibliotecaItems
      ?.filter(item => 
        item.titulo?.toLowerCase().includes(q) ||
        item.promptPositivo?.toLowerCase().includes(q) ||
        item.promptNegativo?.toLowerCase().includes(q)
      )
      ?.map(item => ({ ...item, source: "bib" }));

    // 3. HRMPanel saves
    const fromHmr = saves
      ?.filter(s => 
        s.name?.toLowerCase().includes(q) ||
        s.prompt?.toLowerCase().includes(q)
      )
      ?.map(s => ({ ...s, source: "hrm" }));

    return [...(fromJson || []), ...(fromBib || []), ...(fromHmr || [])];
  };

  useEffect(() => {
    setBuscadorResults(getBuscadorResults(buscadorQuery));
  }, [buscadorQuery, promptsData, saves, bibliotecaItems]);

  return (
    <main style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ position: "relative", marginBottom: "30px" }} ref={buscadorRef}>
        <input
          type="text"
          placeholder="🔍 Buscar prompts en JSON, Biblioteca y HRMPanel..."
          value={buscadorQuery}
          onChange={(e) => setBuscadorQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "15px 20px",
            background: "#111",
            border: "2px solid #333",
            borderRadius: "12px",
            fontSize: "16px",
            color: "#eee",
            outline: "none"
          }}
        />
        
        {buscadorResults.length === 0 && buscadorQuery && (
          <p style={{ textAlign: "center", color: "#666", marginTop: "20px" }}>
            Sin resultados para "{buscadorQuery}"
          </p>
        )}
      </div>

      <div style={{ display: "grid", gap: "15px", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))" }}>
        {buscadorResults.map((item, idx) => (
          <PromptCard key={idx} item={item} />
        ))}
      </div>
    </main>
  );
};

const PromptCard = ({ item }) => {
  const getSourceBadge = (source) => {
    const badges = {
      json: { bg: "#10b981", label: "JSON" },
      bib: { bg: "#3b82f6", label: "BIB" },
      hrm: { bg: "#f59e0b", label: "HRM" }
    };
    const badge = badges[source] || badges.json;
    return (
      <span style={{
        background: badge.bg + "22",
        border: `1px solid ${badge.bg}55`,
        borderRadius: "4px",
        padding: "2px 8px",
        fontSize: "11px",
        color: badge.bg
      }}>
        {badge.label}
      </span>
    );
  };

  const handleCopy = () => {
    const prompt = item.prompt || item.promptPositivo || "";
    navigator.clipboard.writeText(prompt);
  };

  return (
    <div style={{
      background: "#1a1a1a",
      border: "1px solid #333",
      borderRadius: "12px",
      padding: "20px",
      transition: "all 0.2s"
    }}>
      <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
        {getSourceBadge(item.source)}
        <h3 style={{ margin: 0, color: "#eee", fontSize: "16px" }}>
          {item.title || item.name || item.titulo || "Sin título"}
        </h3>
      </div>
      
      <p style={{ color: "#ccc", marginBottom: "8px", fontSize: "14px" }}>
        {item.prompt?.substring(0, 150)}...
      </p>
      
      {item.negativePrompt && (
        <p style={{ color: "#f87171", fontSize: "12px", marginBottom: "12px" }}>
          Neg: {item.negativePrompt.substring(0, 80)}...
        </p>
      )}
      
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={handleCopy} style={{ flex: 1, padding: "8px", background: "#10b981", color: "white", border: "none", borderRadius: "6px" }}>
          📋 Copiar
        </button>
        <button style={{ padding: "8px 12px", background: "#333", color: "#aaa", border: "none", borderRadius: "6px" }}>
          ✏️ Editar
        </button>
      </div>
    </div>
  );
};

export default Home;