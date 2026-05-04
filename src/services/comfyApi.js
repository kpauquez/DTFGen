// src/services/comfyApi.js
export const enviarAComfy = async (workflowJson) => {
  const payload = {
    prompt: workflowJson,
    client_id: "mi_app_react"
  };

  const response = await fetch('http://127.0.0.1:8188/prompt' , {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error("Error en la respuesta de ComfyUI");
  
  return await response.json();
};