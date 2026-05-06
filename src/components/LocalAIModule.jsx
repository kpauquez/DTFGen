import React, { Suspense, lazy, useState, useEffect } from "react";

// Lazy load del módulo pesado
const ImagenConceptoModule = lazy(() => import("./ImagenConceptoModule"));

const LocalAIModule = ({ saves, setSaves, bibliotecaItems, setBibliotecaItems }) => {
  return (
    <div style={{ padding: "40px 20px", background: "#0a0a0a" }}>
      <h2 style={{ color: "#7c3aed", marginBottom: "30px", textAlign: "center" }}>
        🚀 HRMPanel Activado
      </h2>
      
      <Suspense fallback={
        <div style={{ textAlign: "center", padding: "60px", color: "#666" }}>
          Cargando IA local... (Ollama + ComfyUI)
        </div>
      }>
        <ImagenConceptoModule 
          saves={saves}
          setSaves={setSaves}
          bibliotecaItems={bibliotecaItems}
          setBibliotecaItems={setBibliotecaItems}
        />
      </Suspense>
    </div>
  );
};

export default LocalAIModule;