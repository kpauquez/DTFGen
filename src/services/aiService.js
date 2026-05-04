import { Ollama } from 'ollama/browser'; // Importante usar la versión /browser

const ollama = new Ollama({ host: 'http://localhost:11434' });

export const expandirPrompt = async (tagsSeleccionados) => {
  try {
    const response = await ollama.chat({
      model: 'llama3.2:1b', // O el modelo que tengas descargado
      messages: [
        {
          role: 'system',
          content: `You are a professional prompt engineer.
RULES: Output ONLY keywords separated by commas, single line, no sentences..`
        },
        {
          role: 'user',
          content: `Crea un prompt detallado basado en estas etiquetas: ${tagsSeleccionados}`
        }
      ],
    });

    let textoIA = response.message.content;

    // Limpieza de seguridad: Eliminamos frases conversacionales típicas si la IA las ignora en el system prompt
    textoIA = textoIA.replace(/¡Claro!|Claro|Aquí tienes|el prompt detallado:|aquí te dejo el prompt:|seguro, aquí está:/gi, "");
    
    // Eliminamos saltos de línea extra y espacios al inicio/final
    return textoIA.trim();

  } catch (error) {
    console.error("Error conectando con Ollama:", error);
    return "Error al generar el prompt.";
  }
};