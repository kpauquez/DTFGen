import { useState, useEffect } from "react";

// ── OPCIONES DE MÓDULOS ──────────────────────────────────────────────
const OPTIONS = {
  formato:      ["Portrait", "Landscape", "Square"],
  paleta:       ["Vibrante", "Pastel", "Monocromo", "Oscuro"],
  fondo:        ["Transparente", "Negro", "Textura", "Isolated White", "Solid BG", "Blanco", "Solo silueta del sujeto"],
};

const LABELS = {
  formato:      "Formato",
  paleta:       "Paleta",
  fondo:        "Fondo",
};

const PLACEHOLDERS = {
  formato:      "Ej: A4, 30x40cm, panoramic...",
  paleta:       "Ej: dorado y negro, neon rosa...",
  fondo:        "Ej: degradado azul, humo blanco...",
};

const FORMATO_MAP = {
  Portrait:  "portrait format, vertical orientation",
  Landscape: "landscape format, horizontal orientation",
  Square:    "square format",
};

// ── MÁSCARA / MARCO ──────────────────────────────────────────────────
const MASCARA_OPTIONS = [
  { value: "fade",     label: "Desvanecido",   desc: "bordes con fade out hacia transparente, sin corte brusco" },
  { value: "rasgado",  label: "Borde rasgado", desc: "bordes irregulares efecto rasgado, estilo papel roto" },
  { value: "silueta",  label: "Silueta",       desc: "recortado en silueta del sujeto principal, sin fondo cuadrado" },
  { value: "escudo",   label: "Escudo",        desc: "enmarcado en forma de escudo, borde decorativo tipo crest" },
  { value: "estrella", label: "Estrella",      desc: "enmarcado en forma de estrella, borde en punta" },
  { value: "circulo",  label: "Círculo",       desc: "recortado en máscara circular con bordes suaves" },
  { value: "hexagono", label: "Hexágono",      desc: "enmarcado en forma hexagonal, borde geométrico" },
  { value: "spray",    label: "Efecto spray",     desc: "bordes con textura de aerosol, estilo graffiti stencil" },
  { value: "distress",  label: "Distress border",  desc: "distress border, worn edges, rough texture, aged ink effect" },
  { value: "grunge",    label: "Grunge frame",      desc: "grunge texture frame, dirty edges, paint splatter border, raw aesthetic" },
  { value: "halftone",  label: "Halftone frame",    desc: "halftone frame, dot pattern border, comic book style edges" },
  { value: "wavyhalf",  label: "Wavy halftone",     desc: "wavy halftone border, undulating dot pattern edges, fluid halftone mask" },
];

// ── HMR BANCO DE OPCIONES ────────────────────────────────────────────
const HMR_BANK = {
  sujeto: [
    "un león imponente coronado con espinas, de mirada feroz y melena desbordante",
    "un astronauta solitario a la deriva en el vacío infinito del cosmos",
    "un lobo salvaje aullando con ferocidad bajo la luz de la luna llena",
    "un dragón ancestral envuelto en llamas que devoran todo a su paso",
    "una calavera elegante entrelazada con rosas que florecen entre los huesos",
    "un águila majestuosa con las alas completamente desplegadas en pleno vuelo",
    "un boxeador de la vieja escuela curtido por mil peleas, con los puños en alto",
    "un samurái en profunda meditación, con la katana descansando sobre sus rodillas",
    "un oso descomunal conduciendo una motocicleta a toda velocidad por la ruta",
    "un fénix resurgiendo glorioso entre las cenizas y las llamas de su propia muerte",
    "un tigre poderoso con rayas que arden como neón encendido en la oscuridad",
    "un esqueleto elegante tocando la guitarra eléctrica con pasión desenfrenada",
    "un toro furioso embistiendo de frente con los cuernos apuntando al cielo",
    "una serpiente sinuosa enroscada con maestría alrededor de una daga antigua",
    "una pantera oscura y ágil saltando entre la maleza densa de la jungla tropical",
  ],
  pose: [
    "erguido con los brazos cruzados y una mirada desafiante que no pide permiso",
    "de rodillas con la cabeza inclinada en señal de profunda reverencia y honor",
    "en postura de combate, con el peso distribuido y los puños listos para golpear",
    "saltando en el aire con el cuerpo completamente extendido hacia el cielo",
    "recostado con una actitud relajada y dominante, completamente dueño del espacio",
    "de espaldas, mirando por encima del hombro con una expresión misteriosa",
    "con un brazo extendido señalando hacia adelante, liderando con determinación",
    "en cuclillas con la tensión muscular contenida, listo para explotar en movimiento",
    "girando a media vuelta con el peso en un pie, en un instante de elegancia dinámica",
    "de perfil en postura estoica, con la barbilla levantada y el pecho abierto",
    "con ambas manos alzadas hacia el cielo en un gesto de triunfo absoluto",
    "agachado sobre una rodilla, como un guerrero que toma aliento antes de la batalla",
    "colgando desde una altura con una sola mano, mirando hacia abajo sin miedo",
    "con los pies separados y los brazos abiertos, ocupando cada centímetro del espacio",
    "recostado sobre una superficie, en un momento de calma que contrasta con su poder",
  ],
  accion: [
    "blandiendo una espada en pleno arco de ataque, con chispas volando alrededor",
    "corriendo a toda velocidad dejando un rastro de fuego y humo a sus espaldas",
    "rugiendo con toda la fuerza de sus pulmones hacia un cielo que retumba",
    "lanzando un puñetazo cargado de energía que deforma el aire a su alrededor",
    "emergiendo entre las llamas con determinación absoluta e imparable",
    "soltando un grito de guerra que sacude todo lo que está a su alrededor",
    "saltando desde una gran altura con los ojos clavados en su objetivo",
    "encadenando un movimiento fluido y letal como el de un maestro de artes marciales",
    "avanzando lentamente pero con una presencia que aplasta todo a su paso",
    "destrozando una pared de un solo golpe con una fuerza sobrenatural",
    "girando en el aire con velocidad imposible, como una tormenta que toma forma",
    "extendiendo las alas por primera vez, con el viento empujando hacia arriba",
    "aferrando su arma con ambas manos mientras canaliza toda su energía interior",
    "disparando hacia adelante como un proyectil humano lleno de intención",
    "deteniéndose en seco en el último momento, con el polvo todavía en el aire",
  ],
  ambiente: [
    "sobre un cielo cargado de nubes tormentosas que amenazan con desatar su furia",
    "en la cima helada de una montaña bañada por los últimos rayos del atardecer",
    "frente a un horizonte urbano nocturno donde los rascacielos tocan las estrellas",
    "en el corazón de una jungla sofocante donde la luz apenas se abre paso entre las hojas",
    "en medio de un desierto árido con la tierra agrietada bajo el sol implacable",
    "sobre olas del océano que rompen con violencia contra las rocas de la orilla",
    "en una tundra ártica desolada donde el viento corta y el hielo reina sin piedad",
    "entre ruinas milenarias que emergen en la penumbra mientras cae la noche",
    "en un callejón oscuro iluminado únicamente por la luz pulsante de los neones",
    "sobre un campo de lava con grietas que aún resplandecen en rojo vivo",
    "en un bosque envuelto en niebla espesa justo antes de que amanezca el día",
    "flotando en medio de una nebulosa estelar de colores imposibles en el espacio",
    "dentro de una cueva subterránea iluminada por la luz propia de cristales gigantes",
    "en el patio empedrado de un castillo medieval bajo un cielo estrellado y frío",
    "en una azotea de la ciudad bañada por la cálida luz dorada de la hora mágica",
  ],
  estilo: [
    "vector style con formas limpias, colores sólidos y bordes perfectamente definidos",
    "sticker design con contorno grueso blanco, colores vibrantes y fondo transparente",
    "flat design con paleta limitada, sin sombras ni degradados, formas geométricas simples",
    "sharp design con líneas nítidas, contornos definidos y alto contraste visual",
    "bold lines con trazos gruesos y expresivos que dominan la composición con fuerza",
    "vector style, sticker design, flat design, sharp design, bold lines: composición con formas limpias, contorno grueso blanco, paleta sólida sin degradados y trazos expresivos dominantes",
  ],
  iluminacion: [
    "iluminado dramáticamente desde abajo con una luz roja intensa que marca cada sombra",
    "bañado por un contraluz de atardecer que traza una silueta dorada y poderosa",
    "envuelto en una luz cenital fría y dura que crea sombras profundas y teatrales",
    "iluminado por destellos de relámpagos que congela el movimiento en el tiempo",
    "con una luz de neón azul y violeta que vibra y tiñe todo a su alrededor",
    "bajo la luz suave y difusa de un amanecer que disuelve los bordes con delicadeza",
    "recortado por un haz de luz lateral que divide el cuerpo entre sombra y claridad",
    "bañado en luz de luna fría y plateada que convierte cada detalle en plata",
    "con llamaradas que proyectan una luz anaranjada y temblorosa sobre su figura",
    "iluminado desde el frente con una luz blanca y dura que no perdona ningún detalle",
    "con destellos de luz que escapan desde dentro, como si ardiera por dentro",
    "envuelto en la penumbra con solo el contorno iluminado por una fuente distante",
    "bañado en luz de estudio con gradientes suaves que modelan cada volumen",
    "con luz ultravioleta que hace brillar pigmentos invisibles bajo la luz natural",
    "sumergido en la oscuridad casi total, con una sola fuente de luz que lo define",
  ],
  atmosfera: [
    "con un ambiente dramático y cargado que se siente instantes antes de la tormenta",
    "envuelto en un tono misterioso y sombrío que invita a explorar las sombras",
    "irradiando una energía poderosa y dominante que se impone sin necesidad de palabras",
    "con una actitud callejera y rebelde que desafía cada norma sin pedir explicaciones",
    "transmitiendo una sensación épica y mitológica como si fuera parte de una leyenda",
    "con una vibra cruda y visceral que no oculta nada ni pide disculpas por ser así",
    "rodeado de un aura sagrada y espiritual que trasciende lo material y toca lo eterno",
    "impregnado de una calidez nostálgica que evoca una época que ya no volverá",
    "con una tensión glacial y amenazante que congela el aire antes de la tormenta",
    "exudando una sensación de libertad salvaje e indomable que no admite ninguna jaula",
    "con la calma estoica y profunda de un guerrero que ya ha superado todo miedo",
    "desbordando una energía caótica y punk que sacude y desestabiliza todo lo que toca",
    "teñido de una melancolía suave y poética como la luz que muere en el horizonte",
    "proyectando un espíritu triunfante y heroico que celebra la victoria sobre todo",
    "inmerso en un ambiente gótico y oscuro que mezcla belleza perturbadora con misterio",
  ],
  detalles: [
    "con trazado intrincado de líneas ultrafinas que construyen textura y profundidad",
    "con textura de tinta envejecida, manchas, quiebres y bordes completamente irregulares",
    "con contornos negros gruesos y bien definidos que dan peso visual y fuerza al diseño",
    "con patrón de mediotonos de puntos que degradan suavemente entre luces y sombras",
    "con sombreado de líneas cruzadas que agregan volumen real y tensión gráfica",
    "con efecto de salpicaduras de pintura que rompen la composición con energía cruda",
    "con textura de cuero agrietado que muestra vetas profundas y acabado rugoso",
    "con grano vintage que simula el papel envejecido y el desgaste auténtico de décadas",
    "con bordes vectoriales perfectamente nítidos, listos para el corte y la serigrafía",
    "con detalle de bordado a punto que evoca la artesanía textil más cuidadosa",
    "con acabado metálico cromado que refleja la luz y agrega dimensión visual al trazo",
    "con superposición de glitch digital que distorsiona y fragmenta con precisión fría",
    "con pinceladas entintadas a mano y gestos expresivos llenos de irregularidades vivas",
    "con sombreado puntillista construido con miles de pequeños puntos perfectamente colocados",
    "con textura de relieve como madera tallada que agrega profundidad y sombras dramáticas",
  ],
  angulo: [
    "vista frontal directa, sujeto centrado mirando al espectador con presencia total",
    "plano picado desde arriba que reduce al sujeto y exagera el entorno circundante",
    "contrapicado dramático desde abajo que magnifica al sujeto y lo hace imponente",
    "vista lateral de perfil que revela la silueta y el contorno con precisión gráfica",
    "ángulo de tres cuartos que combina frontalidad y profundidad con naturalidad",
    "perspectiva isométrica geométrica que aplana el espacio con precisión técnica",
    "vista trasera de espaldas que genera misterio y tensión narrativa",
    "primer plano extremo que llena el encuadre con textura y detalle máximo",
    "plano general amplio que muestra al sujeto pequeño dentro de un entorno vasto",
    "ángulo holandés inclinado que transmite inestabilidad, tensión y dinamismo",
    "vista cenital desde el techo, completamente perpendicular al suelo",
    "perspectiva de ojo de pez con distorsión exagerada de los bordes del encuadre",
    "plano americano que corta a la altura de las rodillas, equilibrado y narrativo",
    "macro extremo que revela detalles invisibles a simple vista con gran impacto visual",
    "punto de vista subjetivo en primera persona que sumerge al espectador en la escena",
  ],
  calidad: [
    "score_9, score_8_up, masterpiece, best quality, ultra detailed, sharp focus, high resolution",
    "score_9, masterpiece, ultra detailed, best quality, 8k resolution, hyper detailed, sharp edges",
    "score_8_up, best quality, highly detailed, ultra sharp, professional illustration",
    "masterpiece, score_9, ultra detailed, high resolution, clean lines, sharp outlines, 4k UHD",
    "score_9, score_8_up, best quality, ultra detailed, vector style, sticker design, flat design, sharp design, bold lines",
    "masterpiece, best quality, ultra detailed, high resolution, cinematic quality, sharp focus",
    "score_9, ultra detailed, masterpiece, best quality, 8k, hyper realistic, professional grade",
    "score_8_up, masterpiece, ultra detailed, sharp focus, high resolution, clean composition",
  ],
  formato: ["Portrait", "Landscape", "Square"],
  paleta: [
    "vibrante y saturada", "pastel y suave", "monocromática en blanco y negro",
    "oscura y contrastada", "dorada y negra", "neón sobre negro",
    "tierra y ocres vintage", "rojo y negro intenso", "azul y plata metálico",
    "multicolor psicodélico",
  ],
  fondo: ["Transparente", "Negro", "Textura", "Isolated White", "Solid BG", "Blanco", "Solo silueta del sujeto"],
  mascara: [
    "fade", "rasgado", "silueta", "escudo", "estrella", "circulo",
    "hexagono", "spray", "distress", "grunge", "halftone", "wavyhalf",
  ],
};

const HMR_LABELS = {
  sujeto:     "Sujeto",
  pose:       "Pose",
  accion:     "Acción",
  ambiente:   "Ambiente",
  estilo:     "Estilo",
  iluminacion:"Iluminación",
  atmosfera:  "Atmósfera",
  detalles:   "Detalles Extra",
  angulo:     "Ángulo de cámara",
  calidad:    "Calidad SD",
  formato:    "Formato",
  paleta:     "Paleta",
  fondo:      "Fondo",
  mascara:    "Máscara/Marco",
};

const HMR_ICONS = {
  sujeto:     "👤",
  pose:       "🧍",
  accion:     "⚡",
  ambiente:   "🌄",
  estilo:     "🎨",
  iluminacion:"💡",
  atmosfera:  "🌫",
  detalles:   "✦",
  angulo:     "📷",
  formato:    "📐",
  paleta:     "🎨",
  fondo:      "🖼",
  mascara:    "◈",
  calidad:    "⭐",
  formato:    "📐",
  paleta:     "🎨",
  fondo:      "🖼",
  mascara:    "◈",
};

const HMR_CATS = ["sujeto", "pose", "accion", "ambiente", "angulo", "estilo", "iluminacion", "atmosfera", "detalles", "formato", "paleta", "fondo", "mascara", "calidad"];

// ── BUILD PROMPT ─────────────────────────────────────────────────────

// ── CALIDAD DE IMAGEN ────────────────────────────────────────────────
const CALIDAD_BY_MODEL = {
  default: [
    { key: "alta",        label: "Alta calidad",  color: "#F5C518", tags: ["ultra high quality", "best quality", "masterpiece", "8k resolution", "4k UHD", "hyper detailed"] },
    { key: "profesional", label: "Profesional",   color: "#29b6f6", tags: ["studio quality", "production ready", "print-ready design", "commercial quality"] },
    { key: "dtf",         label: "DTF",           color: "#4caf50", tags: ["vector style", "vector art", "sticker design", "flat design", "flat color", "sharp design", "bold lines", "clean lines", "white background", "isolated white", "high contrast", "vivid colors", "no blur"] },
  ],
};

// ── MÓDULO DE TEXTO ───────────────────────────────────────────────────
const FONT_STYLES   = ["Negrita", "Cursiva", "Subrayada", "Versalitas", "Mayúsculas"];
const FILL_TYPES    = ["Sólido", "Degradado", "Metálico", "Transparente"];
const TEXT_EFFECTS  = ["Sombra", "Resplandor", "Relieve", "Distorsión", "3D", "Contorno doble"];
const TEXT_ALIGN    = ["Izquierda", "Centro", "Derecha", "Justificado"];
const TEXT_ORDER    = ["Delante del sujeto", "Detrás del sujeto"];

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
  if (t.fuente)        parts.push(`font: ${t.fuente}${t.estilos.length ? " " + t.estilos.map(s => s.toLowerCase()).join(" ") : ""}`);
  else if (t.estilos.length) parts.push(`font style: ${t.estilos.map(s => s.toLowerCase()).join(", ")}`);
  if (t.colorRelleno)  parts.push(`fill: ${t.colorRelleno} ${t.tipoRelleno.toLowerCase()}`);
  else if (t.tipoRelleno !== "Sólido") parts.push(`fill: ${t.tipoRelleno.toLowerCase()}`);
  if (t.colorContorno) parts.push(`stroke: ${t.colorContorno}${t.anchoContorno ? " " + t.anchoContorno : ""}`);
  if (t.efectos.length) parts.push(t.efectos.map(e => e.toLowerCase()).join(", ") + " effect");
  parts.push(`${t.alineacion.toLowerCase()} aligned`);
  const ord = t.ordenCustom.trim() || t.orden;
  parts.push(ord.toLowerCase());
  if (t.ideogram) parts.push("legible typography, crisp text rendering");
  return parts.join(", ");
};


const buildPrompt = (sel, custom, negativo, hmr, textos) => {
  const get = (cat) => (custom[cat] && custom[cat].trim()) ? custom[cat].trim() : null;
  const h = (cat) => (hmr?.[cat]?.active && hmr?.[cat]?.value) ? hmr[cat].value : null;

  const parts = [
    // 1. Sujeto
    h("sujeto"),
    // 2. Pose
    h("pose"),
    // 3. Acción
    h("accion"),
    // 4. Ambiente
    h("ambiente"),
    // 5. Ángulo de cámara
    h("angulo"),
    // 6. Atmósfera
    h("atmosfera"),
    // 7b. Textos
    ...(textos || []).map(buildTextPrompt).filter(Boolean),
    // 8. Iluminación
    h("iluminacion"),
    // 9. Estilo (tarjeta HMR)
    h("estilo"),
    // 10. Detalles Extra
    h("detalles"),
    // 11. Formato
    h("formato"),
    // 12. Paleta
    h("paleta"),
    // 13. Fondo
    h("fondo"),
    // 14. Máscara
    h("mascara"),
    // 15. Calidad SD (tarjeta HMR) + Calidad módulo
    h("calidad"),
    sel.calidad && sel.calidad.length > 0 ? sel.calidad.join(", ") : null,
  ].filter(Boolean);
  let result = parts.join(", ");
  if (negativo && negativo.trim()) result += ` --no ${negativo.trim()}`;
  return result;
};


// ── TEXTO MODULE COMPONENT ────────────────────────────────────────────
const TextoModule = ({ textos, setTextos, textoTab, setTextoTab, showTextos, setShowTextos }) => {
  const t = textos[textoTab] || textos[0];

  const update = (field, val) => setTextos(prev => prev.map((tx, i) => i === textoTab ? { ...tx, [field]: val } : tx));
  const toggleMulti = (field, val) => setTextos(prev => prev.map((tx, i) => {
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
    fontFamily: "'DM Sans', sans-serif", fontWeight: active ? "600" : "400", transition: "all 0.15s",
  });

  const inputStyle = (hasVal) => ({
    flex: 1, background: hasVal ? "#141420" : "#181818",
    border: `1.5px solid ${hasVal ? "#5555aa" : "#252525"}`,
    borderRadius: "8px", padding: "7px 11px",
    color: hasVal ? "#c8c8ff" : "#555",
    fontFamily: "'DM Sans', sans-serif", fontSize: "12px", outline: "none", transition: "all 0.18s",
  });

  const labelStyle = { color: "#888", fontWeight: "600", fontSize: "11px", letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: "6px", display: "block" };

  return (
    <div style={{ marginTop: "14px" }}>
      {/* Header toggle */}
      <button onClick={() => setShowTextos(v => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: showTextos ? "#0e0e1a" : "#111", border: `1.5px solid ${showTextos ? "#3a3a6a" : "#1e1e2a"}`, borderRadius: showTextos ? "11px 11px 0 0" : "11px", cursor: "pointer", transition: "all 0.2s" }}
        onMouseOver={(e) => { if (!showTextos) e.currentTarget.style.borderColor = "#4a4a8a"; }}
        onMouseOut={(e) => { if (!showTextos) e.currentTarget.style.borderColor = "#1e1e2a"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px" }}>🔤</span>
          <span style={{ color: "#8888dd", fontWeight: "700", fontSize: "12.5px", letterSpacing: "0.4px" }}>MÓDULO DE TEXTO</span>
          <span style={{ color: "#2a2a4a", fontSize: "10.5px" }}>— integrá tipografía en el diseño</span>
          {textos.some(t => t.contenido.trim()) && (
            <span style={{ background: "#8888dd33", border: "1px solid #8888dd55", borderRadius: "999px", padding: "1px 8px", fontSize: "11px", color: "#8888dd" }}>
              {textos.filter(t => t.contenido.trim()).length} texto{textos.filter(t => t.contenido.trim()).length !== 1 ? "s" : ""}
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
                  style={{ padding: "5px 13px", borderRadius: textos.length > 1 ? "999px 0 0 999px" : "999px", border: `1.5px solid ${textoTab === i ? "#8888dd" : "#2a2a4a"}`, borderRight: textos.length > 1 ? "none" : undefined, background: textoTab === i ? "#8888dd22" : "#111", color: textoTab === i ? "#8888dd" : "#444", fontFamily: "'DM Sans', sans-serif", fontWeight: textoTab === i ? "700" : "400", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}
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
                style={{ padding: "5px 11px", borderRadius: "999px", border: "1.5px dashed #2a2a4a", background: "none", color: "#444", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", cursor: "pointer", transition: "all 0.15s" }}
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
                style={{ padding: "7px 11px", borderRadius: "8px", border: `1.5px solid ${t.ideogram ? "#0ea5e9" : "#252525"}`, background: t.ideogram ? "#0ea5e922" : "#181818", color: t.ideogram ? "#0ea5e9" : "#444", fontFamily: "'DM Sans', sans-serif", fontSize: "11px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}
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
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <input value={t.colorRelleno} onChange={(e) => update("colorRelleno", e.target.value)}
                placeholder='Relleno: ej: dorado, #FFD700, blanco...'
                style={{ ...inputStyle(!!t.colorRelleno), flex: 1 }}
                onFocus={(e) => { e.target.style.borderColor = "#8888ddaa"; e.target.style.color = "#e0e0e0"; }}
                onBlur={(e) => { e.target.style.borderColor = t.colorRelleno ? "#5555aa" : "#252525"; e.target.style.color = t.colorRelleno ? "#c8c8ff" : "#555"; }}
              />
              <input value={t.colorContorno} onChange={(e) => update("colorContorno", e.target.value)}
                placeholder='Contorno: ej: negro, rojo...'
                style={{ ...inputStyle(!!t.colorContorno), flex: 1 }}
                onFocus={(e) => { e.target.style.borderColor = "#8888ddaa"; e.target.style.color = "#e0e0e0"; }}
                onBlur={(e) => { e.target.style.borderColor = t.colorContorno ? "#5555aa" : "#252525"; e.target.style.color = t.colorContorno ? "#c8c8ff" : "#555"; }}
              />
              <input value={t.anchoContorno} onChange={(e) => update("anchoContorno", e.target.value)}
                placeholder='Ancho: ej: 3px, grueso...'
                style={{ ...inputStyle(!!t.anchoContorno), flex: 1 }}
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


// ── HMR COMPONENT ────────────────────────────────────────────────────
const HMRPanel = ({ hmrCards, setHmrCards }) => {
  const shuffle = (cat) => {
    const pool = HMR_BANK[cat];
    const current = hmrCards[cat].value;
    let next = current;
    let tries = 0;
    while (next === current && pool.length > 1 && tries < 20) { next = pool[Math.floor(Math.random() * pool.length)]; tries++; }
    setHmrCards(prev => ({ ...prev, [cat]: { ...prev[cat], value: next, locked: false, showDropdown: false } }));
  };
  const toggleLock = (cat) => setHmrCards(prev => ({ ...prev, [cat]: { ...prev[cat], locked: !prev[cat].locked, showDropdown: false } }));
  const selectOption = (cat, val) => setHmrCards(prev => ({ ...prev, [cat]: { ...prev[cat], value: val, locked: true, showDropdown: false } }));
  const toggleDropdown = (cat) => {
    if (hmrCards[cat].locked) return;
    setHmrCards(prev => {
      const next = { ...prev };
      HMR_CATS.forEach(c => { next[c] = { ...next[c], showDropdown: c === cat ? !prev[cat].showDropdown : false }; });
      return next;
    });
  };
  const toggleCustom = (cat) => setHmrCards(prev => ({ ...prev, [cat]: { ...prev[cat], showCustom: !prev[cat].showCustom, showDropdown: false } }));
  const toggleActive = (cat) => setHmrCards(prev => ({ ...prev, [cat]: { ...prev[cat], active: !prev[cat].active, showDropdown: false } }));
  const addCustom = (cat) => {
    const val = hmrCards[cat].custom;
    if (!val || !val.trim()) return;
    HMR_BANK[cat] = [...new Set([...HMR_BANK[cat], val.trim()])];
    setHmrCards(prev => ({ ...prev, [cat]: { ...prev[cat], value: val.trim(), locked: true, custom: "", showCustom: false } }));
  };
  const shuffleAll = () => setHmrCards(prev => {
    const next = { ...prev };
    HMR_CATS.forEach(cat => {
      if (!prev[cat].locked) {
        const pool = HMR_BANK[cat];
        let v = pool[Math.floor(Math.random() * pool.length)];
        next[cat] = { ...prev[cat], value: v, showDropdown: false };
      }
    });
    return next;
  });

  const generateWithAI = async (cat, selectedModel) => {
    setHmrCards(prev => ({ ...prev, [cat]: { ...prev[cat], generating: true, showDropdown: false } }));
    const contextCats = HMR_CATS.filter(c => c !== cat);
    const context = contextCats.map(c => `${HMR_LABELS[c]}: ${hmrCards[c].active && hmrCards[c].value ? hmrCards[c].value : "(sin valor)"}`).join("\n");
    const systemPrompt = `Eres un experto en prompts para generación de imágenes con IA, especializado en diseños para estampado en remeras. Generás una sola sentencia creativa, descriptiva y fluida en español para la categoría indicada. La sentencia debe ser específica, evocadora y optimizada para prompts de imagen. No uses comillas. No expliques nada. Responde solo con la sentencia.`;
    const userPrompt = `Categoría: ${HMR_LABELS[cat]}\n\nContexto actual del diseño:\n${context}\n\nGenerá una sentencia nueva, creativa y diferente para la categoría "${HMR_LABELS[cat]}". Debe ser coherente con el contexto pero inesperada y fresca.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      const data = await res.json();
      const text = data?.content?.[0]?.text?.trim();
      if (text) {
        HMR_BANK[cat] = [...new Set([...HMR_BANK[cat], text])];
        setHmrCards(prev => ({ ...prev, [cat]: { ...prev[cat], value: text, locked: true, generating: false } }));
      } else {
        setHmrCards(prev => ({ ...prev, [cat]: { ...prev[cat], generating: false } }));
      }
    } catch {
      setHmrCards(prev => ({ ...prev, [cat]: { ...prev[cat], generating: false } }));
    }
  };

  const analyzeCardImage = async (cat, file) => {
    if (!file) return;
    setHmrCards(prev => ({ ...prev, [cat]: { ...prev[cat], analyzingImg: true } }));

    // preview URL
    const previewUrl = URL.createObjectURL(file);

    const toBase64 = (f) => new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(f);
    });

    try {
      const base64 = await toBase64(file);
      const mediaType = file.type || "image/jpeg";
      const catLabel = HMR_LABELS[cat];

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 150,
          system: `Sos un experto en análisis visual para diseño gráfico y generación de prompts. Analizás imágenes y extraés SOLO la característica visual correspondiente a la categoría indicada. Respondé con UNA SOLA frase descriptiva en español, fluida y concisa (máximo 15 palabras). Sin comillas. Sin explicaciones. Solo la frase.`,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: `Analizá esta imagen y describí SOLO la categoría "${catLabel}" que ves. Una sola frase corta en español.` }
            ]
          }]
        })
      });

      const data = await res.json();
      const desc = data?.content?.[0]?.text?.trim();

      if (desc) {
        setHmrCards(prev => {
          const existing = prev[cat].value;
          const combined = existing ? `${existing}, referencia: ${desc}` : desc;
          HMR_BANK[cat] = [...new Set([...HMR_BANK[cat], combined])];
          return { ...prev, [cat]: { ...prev[cat], value: combined, locked: true, active: true, imgRef: previewUrl, analyzingImg: false } };
        });
      } else {
        setHmrCards(prev => ({ ...prev, [cat]: { ...prev[cat], analyzingImg: false } }));
      }
    } catch {
      setHmrCards(prev => ({ ...prev, [cat]: { ...prev[cat], analyzingImg: false } }));
    }
  };

  return (
    <div style={{ marginTop: "18px" }}>
      {/* Title + shuffle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#F5C518", fontWeight: "700", fontSize: "12.5px", letterSpacing: "0.4px" }}>⬡ GENERADOR DE CONCEPTO</span>
          <span style={{ color: "#333", fontSize: "10.5px" }}>— mezcla aleatoria por categoría</span>
        </div>
        <button onClick={shuffleAll}
          style={{ padding: "5px 12px", background: "#1e1e1e", border: "1.5px solid #2e2e2e", borderRadius: "8px", color: "#888", fontFamily: "'DM Sans', sans-serif", fontWeight: "600", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", transition: "all 0.18s" }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = "#F5C518"; e.currentTarget.style.color = "#F5C518"; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = "#2e2e2e"; e.currentTarget.style.color = "#888"; }}
        >⚄ Mezclar todo</button>
      </div>

      {/* Chips horizontales */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px", paddingBottom: "14px", borderBottom: "1px solid #1e1e1e" }}>
        {HMR_CATS.map(cat => {
          const card = hmrCards[cat];
          const isOn = card.active;
          return (
            <button key={cat} onClick={() => toggleActive(cat)}
              title={isOn ? `Quitar ${HMR_LABELS[cat]} del prompt` : `Incluir ${HMR_LABELS[cat]} en el prompt`}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "5px 12px", borderRadius: "999px",
                border: `1.5px solid ${isOn ? (card.locked ? "#4a4a18" : "#F5C51888") : "#252525"}`,
                background: isOn ? (card.locked ? "#2a2a10" : "#F5C51812") : "#181818",
                color: isOn ? (card.locked ? "#c8a830" : "#F5C518") : "#444",
                fontFamily: "'DM Sans', sans-serif", fontWeight: isOn ? "600" : "400",
                fontSize: "11.5px", cursor: "pointer", transition: "all 0.18s",
              }}
              onMouseOver={(e) => { if (!isOn) { e.currentTarget.style.borderColor = "#F5C51844"; e.currentTarget.style.color = "#777"; }}}
              onMouseOut={(e) => { if (!isOn) { e.currentTarget.style.borderColor = "#252525"; e.currentTarget.style.color = "#444"; }}}
            >
              <span style={{ fontSize: "11px" }}>{HMR_ICONS[cat]}</span>
              {HMR_LABELS[cat]}
              {card.locked && isOn && <span style={{ fontSize: "9px", opacity: 0.7 }}>🔒</span>}
              {isOn && <span style={{ fontSize: "9px", color: "inherit", opacity: 0.6 }}>✓</span>}
            </button>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(255px, 1fr))", gap: "10px" }}>
        {HMR_CATS.map(cat => {
          const card = hmrCards[cat];
          const allOptions = [...HMR_BANK[cat]];
          if (!card.active) return null;
          return (
            <div key={cat} style={{ background: "#111", border: `1.5px solid ${card.locked ? "#3a3a1a" : "#1e1e1e"}`, borderRadius: "11px", padding: "11px", position: "relative", transition: "all 0.25s ease", animation: "fadeIn 0.25s ease" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "7px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ fontSize: "12px" }}>{HMR_ICONS[cat]}</span>
                  <span style={{ color: "#777", fontWeight: "700", fontSize: "10px", letterSpacing: "0.6px", textTransform: "uppercase" }}>{HMR_LABELS[cat]}</span>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button onClick={() => shuffle(cat)} title="Regenerar solo esta tarjeta"
                    style={{ width: "22px", height: "22px", background: "none", border: "1px solid #252525", borderRadius: "5px", color: "#444", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = "#F5C518"; e.currentTarget.style.color = "#F5C518"; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = "#252525"; e.currentTarget.style.color = "#444"; }}
                  >⚄</button>
                  <button onClick={() => toggleLock(cat)} title={card.locked ? "Desbloquear" : "Fijar valor"}
                    style={{ width: "22px", height: "22px", background: card.locked ? "#2a2a10" : "none", border: `1px solid ${card.locked ? "#4a4a18" : "#252525"}`, borderRadius: "5px", color: card.locked ? "#F5C518" : "#444", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = "#F5C518"; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = card.locked ? "#4a4a18" : "#252525"; }}
                  >{card.locked ? "🔒" : "🔓"}</button>
                  <button onClick={() => toggleCustom(cat)} title="Agregar opción personalizada"
                    style={{ width: "22px", height: "22px", background: card.showCustom ? "#0e0e1a" : "none", border: `1px solid ${card.showCustom ? "#2e2e5a" : "#252525"}`, borderRadius: "5px", color: card.showCustom ? "#7777cc" : "#444", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = "#7777cc"; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = card.showCustom ? "#2e2e5a" : "#252525"; }}
                  >✎</button>
                  <button onClick={() => !card.generating && generateWithAI(cat, null)} title="Generar con IA"
                    style={{ width: "22px", height: "22px", background: card.generating ? "#1a1a0a" : "none", border: `1px solid ${card.generating ? "#4a4a10" : "#252525"}`, borderRadius: "5px", color: card.generating ? "#c8a830" : "#444", fontSize: "11px", cursor: card.generating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                    onMouseOver={(e) => { if (!card.generating) { e.currentTarget.style.borderColor = "#c8a830"; e.currentTarget.style.color = "#c8a830"; }}}
                    onMouseOut={(e) => { if (!card.generating) { e.currentTarget.style.borderColor = "#252525"; e.currentTarget.style.color = "#444"; }}}
                  >{card.generating ? <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: "12px" }}>⟳</span> : "✨"}</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (!card.analyzingImg) document.getElementById(`img-input-${cat}`).click(); }}
                    title="Cargar imagen de referencia para esta tarjeta"
                    style={{ width: "22px", height: "22px", background: card.imgRef ? "#0e1a10" : card.analyzingImg ? "#0e1a10" : "none", border: `1px solid ${card.imgRef ? "#2a5a2a" : card.analyzingImg ? "#2a5a2a" : "#252525"}`, borderRadius: "5px", color: card.imgRef ? "#4caf50" : card.analyzingImg ? "#4caf50" : "#444", fontSize: "11px", cursor: card.analyzingImg ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                    onMouseOver={(e) => { if (!card.analyzingImg) { e.currentTarget.style.borderColor = "#4caf5099"; e.currentTarget.style.color = "#4caf50"; }}}
                    onMouseOut={(e) => { if (!card.analyzingImg) { e.currentTarget.style.borderColor = card.imgRef ? "#2a5a2a" : "#252525"; e.currentTarget.style.color = card.imgRef ? "#4caf50" : "#444"; }}}
                  >
                    {card.analyzingImg ? <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: "11px" }}>⟳</span> : "📎"}
                  </button>
                  <input id={`img-input-${cat}`} type="file" accept="image/*" style={{ display: "none" }} disabled={card.analyzingImg}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) analyzeCardImage(cat, f); e.target.value = ""; }}
                  />
                </div>
              </div>
              {/* Multi-select chips for fondo and mascara */}
              {(cat === "fondo" || cat === "mascara") ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", padding: "6px 0" }}>
                  {HMR_BANK[cat].map(opt => {
                    const arr = Array.isArray(card.value) ? card.value : [];
                    const isActive = arr.includes(opt);
                    const label = cat === "mascara" ? (MASCARA_OPTIONS.find(m => m.value === opt)?.label || opt) : opt;
                    return (
                      <button key={opt} onClick={() => {
                        setHmrCards(prev => {
                          const cur = Array.isArray(prev[cat].value) ? prev[cat].value : [];
                          const next = cur.includes(opt) ? cur.filter(v => v !== opt) : [...cur, opt];
                          return { ...prev, [cat]: { ...prev[cat], value: next, active: true } };
                        });
                      }}
                        style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif", fontWeight: isActive ? "600" : "400", transition: "all 0.15s", border: `1.5px solid ${isActive ? "#F5C518" : "#252525"}`, background: isActive ? "#F5C51818" : "#181818", color: isActive ? "#F5C518" : "#555" }}
                        onMouseOver={(e) => { if (!isActive) { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#888"; }}}
                        onMouseOut={(e) => { if (!isActive) { e.currentTarget.style.borderColor = "#252525"; e.currentTarget.style.color = "#555"; }}}
                      >{label}</button>
                    );
                  })}
                </div>
              ) : (
              <div onClick={() => !card.generating && toggleDropdown(cat)}
                style={{ background: card.generating ? "#141408" : "#181818", border: `1px solid ${card.generating ? "#3a3a10" : card.showDropdown ? "#F5C51855" : "#222"}`, borderRadius: "8px", padding: "8px 11px", cursor: card.locked || card.generating ? "default" : "pointer", minHeight: "44px", transition: "all 0.15s" }}
                onMouseOver={(e) => { if (!card.locked && !card.generating) e.currentTarget.style.borderColor = "#F5C51833"; }}
                onMouseOut={(e) => { if (!card.showDropdown && !card.generating) e.currentTarget.style.borderColor = "#222"; }}
              >
                {card.analyzingImg
                  ? <p style={{ color: "#2a6a2a", fontSize: "12px", lineHeight: "1.5", margin: 0, fontStyle: "italic" }}>📎 Analizando imagen...</p>
                  : card.generating
                  ? <p style={{ color: "#6a6a20", fontSize: "12px", lineHeight: "1.5", margin: 0, fontStyle: "italic" }}>✨ Generando con IA...</p>
                  : <>
                      <p style={{ color: card.locked ? "#b8a840" : "#bbb", fontSize: "12px", lineHeight: "1.5", margin: 0 }}>{Array.isArray(card.value) ? (card.value.length ? card.value.join(", ") : <span style={{ color: "#444" }}>—</span>) : (card.value || <span style={{ color: "#444" }}>—</span>)}</p>
                      {!card.locked && <p style={{ color: "#333", fontSize: "9.5px", marginTop: "2px" }}>▾ clic para elegir</p>}
                    </>
                }
              </div>
              )}
              {card.showDropdown && cat !== "fondo" && cat !== "mascara" && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200, background: "#1a1a1a", border: "1.5px solid #2a2a2a", borderRadius: "10px", marginTop: "4px", maxHeight: "190px", overflowY: "auto", boxShadow: "0 8px 28px #000000aa" }}>
                  {allOptions.map(opt => (
                    <div key={opt} onClick={() => selectOption(cat, opt)}
                      style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #1e1e1e", background: opt === card.value ? "#222210" : "transparent", transition: "background 0.1s" }}
                      onMouseOver={(e) => { e.currentTarget.style.background = opt === card.value ? "#222210" : "#1e1e1e"; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = opt === card.value ? "#222210" : "transparent"; }}
                    >
                      <p style={{ color: opt === card.value ? "#F5C518" : "#999", fontSize: "11.5px", lineHeight: "1.4", margin: 0 }}>{opt === card.value ? "✓ " : ""}{opt}</p>
                    </div>
                  ))}
                </div>
              )}
              {card.showCustom && (
                <div style={{ marginTop: "7px", display: "flex", gap: "5px" }}>
                  <input value={card.custom || ""}
                    onChange={(e) => setHmrCards(prev => ({ ...prev, [cat]: { ...prev[cat], custom: e.target.value } }))}
                    onKeyDown={(e) => { if (e.key === "Enter") addCustom(cat); }}
                    placeholder={`Tu ${HMR_LABELS[cat].toLowerCase()}...`}
                    style={{ flex: 1, background: "#0a0a14", border: "1.5px solid #252545", borderRadius: "7px", padding: "6px 9px", color: "#aaa", fontFamily: "'DM Sans', sans-serif", fontSize: "11.5px", outline: "none" }}
                  />
                  <button onClick={() => addCustom(cat)}
                    style={{ padding: "6px 10px", background: "#12122a", border: "1.5px solid #2e2e6a", borderRadius: "7px", color: "#7777cc", fontFamily: "'DM Sans', sans-serif", fontWeight: "700", fontSize: "11px", cursor: "pointer" }}
                  >+</button>
                </div>
              )}
              {card.imgRef && (
                <div style={{ marginTop: "7px", display: "flex", alignItems: "center", gap: "7px" }}>
                  <img src={card.imgRef} alt="ref" style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "5px", border: "1px solid #2a5a2a" }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "9.5px", color: "#2a6a2a" }}>📎 imagen de referencia cargada</p>
                  </div>
                  <button onClick={() => setHmrCards(prev => ({ ...prev, [cat]: { ...prev[cat], imgRef: null } }))}
                    style={{ background: "none", border: "none", color: "#444", fontSize: "10px", cursor: "pointer", padding: "2px 4px" }}
                    title="Quitar imagen de referencia"
                  >✕</button>
                </div>
              )}
              {card.locked && !card.imgRef && <p style={{ marginTop: "5px", fontSize: "9.5px", color: "#4a4a1a" }}>🔒 fijado</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── COMPONENTES ──────────────────────────────────────────────────────
const Toggle = ({ label, active, onClick, color, disabled }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: "8px",
    padding: "7px 13px", borderRadius: "999px",
    border: `1.5px solid ${active ? (color || "#F5C518") : "#333"}`,
    background: active ? (color ? color + "22" : "#F5C51822") : "#1e1e1e",
    color: active ? (color || "#F5C518") : disabled ? "#444" : "#777",
    fontFamily: "'DM Sans', sans-serif", fontSize: "13px",
    fontWeight: active ? "600" : "400",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "all 0.18s", whiteSpace: "nowrap",
  }}>
    <span style={{
      width: "26px", height: "15px", borderRadius: "999px",
      background: active ? (color || "#F5C518") : "#2a2a2a",
      position: "relative", display: "inline-block", flexShrink: 0, transition: "background 0.18s",
    }}>
      <span style={{
        position: "absolute", top: "2px", left: active ? "13px" : "2px",
        width: "11px", height: "11px", borderRadius: "50%",
        background: active ? "#111" : "#555", transition: "left 0.18s",
      }} />
    </span>
    {label}
  </button>
);


const CalidadRow = ({ selected, onToggle }) => {
  const calidad = selected.calidad || [];
  const groups = CALIDAD_BY_MODEL.default;
  const activeModel = null;

  const toggleTag = (tag) => {
    const next = calidad.includes(tag) ? calidad.filter(t => t !== tag) : [...calidad, tag];
    onToggle("calidad", next);
  };

  const toggleGroup = (group) => {
    const allActive = group.tags.every(t => calidad.includes(t));
    if (allActive) {
      onToggle("calidad", calidad.filter(t => !group.tags.includes(t)));
    } else {
      const merged = [...new Set([...calidad, ...group.tags])];
      onToggle("calidad", merged);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <span style={{ color: "#bbb", fontWeight: "600", fontSize: "13px", minWidth: "76px", paddingTop: "2px" }}>Calidad:</span>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
          {groups.map((group) => {
            const allActive = group.tags.every(t => calidad.includes(t));
            const someActive = group.tags.some(t => calidad.includes(t));
            return (
              <div key={group.key}>
                {/* Group header */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <button
                    onClick={() => toggleGroup(group)}
                    style={{
                      padding: "4px 12px", borderRadius: "999px", fontSize: "11.5px", fontWeight: "700",
                      border: `1.5px solid ${allActive ? group.color : someActive ? group.color + "66" : "#2a2a2a"}`,
                      background: allActive ? group.color + "22" : someActive ? group.color + "11" : "#181818",
                      color: allActive ? group.color : someActive ? group.color + "bb" : "#555",
                      cursor: "pointer", transition: "all 0.18s", fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {allActive ? "✓ " : someActive ? "◑ " : "+ "}{group.label}
                  </button>
                  {someActive && (
                    <button
                      onClick={() => onToggle("calidad", calidad.filter(t => !group.tags.includes(t)))}
                      style={{ background: "none", border: "none", color: "#444", fontSize: "10px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                      onMouseOver={(e) => e.target.style.color = "#888"}
                      onMouseOut={(e) => e.target.style.color = "#444"}
                    >✕ quitar</button>
                  )}
                </div>
                {/* Tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {group.tags.map((tag) => {
                    const active = calidad.includes(tag);
                    return (
                      <button key={tag} onClick={() => toggleTag(tag)}
                        style={{
                          padding: "5px 11px", borderRadius: "999px", fontSize: "11.5px",
                          border: `1.5px solid ${active ? group.color : "#252525"}`,
                          background: active ? group.color + "1a" : "#181818",
                          color: active ? group.color : "#555",
                          fontFamily: "'DM Sans', sans-serif", fontWeight: active ? "600" : "400",
                          cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
                        }}
                        onMouseOver={(e) => { if (!active) { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#888"; }}}
                        onMouseOut={(e) => { if (!active) { e.currentTarget.style.borderColor = "#252525"; e.currentTarget.style.color = "#555"; }}}
                      >{active ? "✓ " : ""}{tag}</button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {calidad.length > 0 && (
        <div style={{ marginTop: "10px", paddingLeft: "88px" }}>
          <p style={{ fontSize: "11px", color: "#3a3a2a", fontStyle: "italic" }}>
            → {calidad.length} tag{calidad.length > 1 ? "s" : ""} activo{calidad.length > 1 ? "s" : ""}:{" "}
            <span style={{ color: "#5a5a3a" }}>{calidad.join(", ")}</span>
          </p>
        </div>
      )}
    </div>
  );
};



// ── APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [selected, setSelected] = useState({
    calidad: [],
    formato: "Landscape",
    paleta: "Vibrante", fondo: [], mascara: [],
  });
  const [custom, setCustom] = useState({
    formato: "", paleta: "", fondo: "", mascara: "",
  });
  const [negativo, setNegativo]         = useState("");
  const [textos, setTextos]             = useState([emptyText()]);
  const [textoTab, setTextoTab]         = useState(0);
  const [showTextos, setShowTextos]     = useState(false);
  const [customNegChips, setCustomNegChips] = useState([]);
  const [newNegChip, setNewNegChip]       = useState("");
  const [translatingChip, setTranslatingChip] = useState(false);
  const [imgAnalyzing, setImgAnalyzing] = useState(false);
  const [imgPreview, setImgPreview]     = useState(null);
  const [imgError, setImgError]         = useState("");
  const [imgSuccess, setImgSuccess]     = useState(false);
  const [hmrCards, setHmrCards]         = useState(() => {
    const init = {};
    HMR_CATS.forEach(cat => {
      const pool = HMR_BANK[cat];
      const multiCats = ["fondo", "mascara"];
      init[cat] = {
        value: multiCats.includes(cat) ? [] : pool[Math.floor(Math.random() * pool.length)],
        locked: false, active: cat !== "fondo" && cat !== "mascara",
        generating: false, analyzingImg: false, imgRef: null,
        custom: "", showDropdown: false, showCustom: false
      };
    });
    return init;
  });
  const [prompt, setPrompt]             = useState("");
  const [history, setHistory]           = useState([
    { label: "Vintage auto, fondo negro...", tags: "Vintage, Ilustración, Negro" },
    { label: "Perro con gafas urbanas...",  tags: "Streetwear, Mixto, Transparente" },
    { label: 'Frase "Modo diablo"...',      tags: "Streetwear, Frase, Oscuro" },
  ]);
  const [promptEdited, setPromptEdited] = useState(false);
  const [templates, setTemplates]       = useState([]);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [savingName, setSavingName]     = useState("");
  const [editingId, setEditingId]       = useState(null);
  const [editingName, setEditingName]   = useState("");
  const [showExportJson, setShowExportJson] = useState(false);
  const [exportJsonCopied, setExportJsonCopied] = useState(false);
  const [showImportBox, setShowImportBox] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [importError, setImportError]   = useState("");
  const [copied, setCopied]             = useState(false);
  const [copiedEn, setCopiedEn]         = useState(false);
  const [promptEn, setPromptEn]         = useState("");
  const [translating, setTranslating]   = useState(false);
  const [translateError, setTranslateError] = useState(false);

  useEffect(() => {
    if (!promptEdited) {
      setPrompt(buildPrompt(selected, custom, negativo, hmrCards, textos));
      setPromptEn("");
      setTranslateError(false);
    }
  }, [selected, custom, negativo, hmrCards, textos, promptEdited]);

  const toggle = (cat, val) => {
    if (cat === "calidad") {
      setSelected(prev => ({ ...prev, calidad: val }));
    } else if (cat === "fondo") {
      setSelected(prev => {
        const arr = Array.isArray(prev.fondo) ? prev.fondo : (prev.fondo ? [prev.fondo] : []);
        return { ...prev, fondo: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
      });
    } else if (cat === "mascara") {
      setSelected(prev => {
        if (val === "__clear__") return { ...prev, mascara: [] };
        const arr = Array.isArray(prev.mascara) ? prev.mascara : (prev.mascara ? [prev.mascara] : []);
        return { ...prev, mascara: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
      });
    } else {
      setSelected(prev => ({ ...prev, [cat]: prev[cat] === val ? "" : val }));
    }
  };
  const setCustomField = (cat, val) =>
    setCustom(prev => ({ ...prev, [cat]: val }));



  const copyText = (text, setCopiedFn) => {
    try {
      const el = document.createElement("textarea");
      el.value = text; el.style.position = "fixed"; el.style.opacity = "0";
      document.body.appendChild(el); el.focus(); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
      setCopiedFn(true); setTimeout(() => setCopiedFn(false), 1800);
    } catch {
      navigator.clipboard?.writeText(text).then(() => { setCopiedFn(true); setTimeout(() => setCopiedFn(false), 1800); });
    }
  };

  const handleTranslate = async () => {
    if (!prompt) return;
    setTranslating(true); setTranslateError(false); setPromptEn("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: `Translate this image generation prompt to English. Return ONLY the translated prompt, no explanations, no quotes, no extra text:\n\n${prompt}` }],
        }),
      });
      const data = await res.json();
      const text = data?.content?.[0]?.text?.trim();
      if (text) setPromptEn(text); else setTranslateError(true);
    } catch { setTranslateError(true); }
    finally { setTranslating(false); }
  };

  const handleImageAnalysis = async (file) => {
    if (!file) return;
    setImgAnalyzing(true);
    setImgError("");
    setImgSuccess(false);

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setImgPreview(e.target.result);
    reader.readAsDataURL(file);

    // Convert to base64 for API
    const toBase64 = (f) => new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(f);
    });

    try {
      const base64 = await toBase64(file);
      const mediaType = file.type || "image/jpeg";

      const systemPrompt = `Sos un experto en análisis visual para diseño gráfico y generación de prompts para IA, especializado en estampados DTF para remeras. Analizás imágenes y extraés sus características visuales clave en español. Respondé SOLO con un JSON válido, sin texto adicional, sin backticks, sin explicaciones. El JSON debe tener exactamente estas claves: sujeto, pose, accion, ambiente, estilo, iluminacion, atmosfera, detalles, calidad. Cada valor debe ser una sola frase descriptiva en español, fluida y concisa (máximo 20 palabras). Si alguna categoría no aplica claramente a la imagen, usá null.`;

      const userPrompt = `Analizá esta imagen y extraé sus características visuales para cada categoría. Retorná solo el JSON.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: userPrompt }
            ]
          }]
        })
      });

      const data = await res.json();
      const raw = data?.content?.[0]?.text?.trim();
      if (!raw) throw new Error("Sin respuesta");

      const parsed = JSON.parse(raw);

      // Map parsed values to hmrCards
      setHmrCards(prev => {
        const next = { ...prev };
        HMR_CATS.forEach(cat => {
          if (parsed[cat]) {
            const val = parsed[cat];
            HMR_BANK[cat] = [...new Set([...HMR_BANK[cat], val])];
            next[cat] = { ...prev[cat], value: val, locked: true, active: true };
          }
        });
        return next;
      });

      setImgSuccess(true);
      setTimeout(() => setImgSuccess(false), 3000);
    } catch (e) {
      setImgError("No se pudo analizar la imagen. Intentá con otra o verificá el formato.");
    } finally {
      setImgAnalyzing(false);
    }
  };

  const saveTemplate = () => {
    if (!savingName.trim() || !prompt) return;
    const tpl = {
      id: Date.now(), name: savingName.trim(), prompt, promptEn,
      selected: { ...selected }, custom: { ...custom },
      hmrCards: Object.fromEntries(Object.entries(hmrCards).map(([k, v]) => [k, { value: v.value, locked: v.locked, active: v.active }])),
      negativo, createdAt: new Date().toISOString(),
    };
    setTemplates(prev => [tpl, ...prev]);
    setSavingName(""); setShowSaveInput(false);
  };

  const loadTemplate = (tpl) => {
    setSelected(tpl.selected); setCustom(tpl.custom); setNegativo(tpl.negativo || "");
    setHmrCards(prev => {
      const next = { ...prev };
      Object.entries(tpl.hmrCards || {}).forEach(([k, v]) => { if (next[k]) next[k] = { ...next[k], ...v }; });
      return next;
    });
  };

  const deleteTemplate = (id) => setTemplates(prev => prev.filter(t => t.id !== id));
  const startRename = (tpl) => { setEditingId(tpl.id); setEditingName(tpl.name); };
  const confirmRename = () => {
    if (!editingName.trim()) return;
    setTemplates(prev => prev.map(t => t.id === editingId ? { ...t, name: editingName.trim() } : t));
    setEditingId(null);
  };

  const exportTemplates = () => {
    if (!templates.length) return;
    setShowExportJson(v => !v);
    setExportJsonCopied(false);
  };

  const copyExportJson = () => {
    const json = JSON.stringify(templates, null, 2);
    try {
      const el = document.createElement("textarea");
      el.value = json; el.style.position = "fixed"; el.style.opacity = "0";
      document.body.appendChild(el); el.focus(); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
      setExportJsonCopied(true); setTimeout(() => setExportJsonCopied(false), 2000);
    } catch {
      navigator.clipboard?.writeText(json).then(() => { setExportJsonCopied(true); setTimeout(() => setExportJsonCopied(false), 2000); });
    }
  };

  const pasteImportTemplates = (jsonText) => {
    setImportError("");
    try {
      const data = JSON.parse(jsonText);
      if (!Array.isArray(data)) throw new Error();
      setTemplates(prev => {
        const ids = new Set(prev.map(t => t.id));
        return [...prev, ...data.filter(t => !ids.has(t.id))];
      });
      setImportJsonText("");
      setShowImportBox(false);
    } catch { setImportError("JSON inválido. Debe ser un JSON exportado desde esta app."); }
  };

  const addCustomChip = async () => {
    const chip = newNegChip.trim();
    if (!chip) return;
    setTranslatingChip(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 60,
          messages: [{ role: "user", content: `Translate this image generation negative prompt term to English. Return ONLY the translated term, nothing else, no quotes, no explanation: ${chip}` }],
        }),
      });
      const data = await res.json();
      const raw = data?.content?.[0]?.text || chip;
      // Strip quotes, extra spaces, line breaks
      const translated = raw.replace(/["""'']/g, "").replace(/\n/g, " ").trim() || chip;
      setCustomNegChips(prev => {
        if (prev.find(c => c.en === translated)) return prev;
        return [...prev, { es: chip, en: translated }];
      });
      setNegativo(prev => prev ? prev + ", " + translated : translated);
    } catch {
      // fallback: use original
      if (!customNegChips.find(c => c.en === chip)) {
        setCustomNegChips(prev => [...prev, { es: chip, en: chip }]);
      }
      setNegativo(prev => prev ? prev + ", " + chip : chip);
    } finally {
      setNewNegChip("");
      setTranslatingChip(false);
    }
  };



  // ── RENDER ─────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #111; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: #1a1a1a; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        input:focus, textarea:focus { outline: none; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#111", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px 60px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "26px", position: "relative" }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(24px, 4vw, 38px)", fontWeight: "800", color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
            <span style={{ color: "#F5C518" }}>DTF</span> Prompt <em>Builder</em>{" "}
            <span style={{ background: "#F5C518", color: "#111", padding: "2px 8px", borderRadius: "5px", fontSize: "0.58em", fontStyle: "normal", verticalAlign: "middle" }}>PRO</span>
          </h1>
          <p style={{ color: "#555", fontSize: "13px", marginTop: "6px" }}>Generá diseños listos para imprimir en segundos.</p>
        </div>

        {/* Layout */}
        <div style={{ display: "flex", gap: "16px", width: "100%", maxWidth: "1020px", alignItems: "flex-start" }}>

          {/* ── LEFT PANEL ── */}
          <div style={{ flex: 1, background: "#161616", borderRadius: "14px", border: "1px solid #222", padding: "20px", display: "flex", flexDirection: "column" }}>

            {/* Módulos */}
            <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: "18px", display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* HMR Generador de Concepto */}
              <div>
                <HMRPanel hmrCards={hmrCards} setHmrCards={setHmrCards} />
                <div style={{ borderTop: "1px solid #1c1c1c", marginTop: "18px" }} />
              </div>

              {/* Calidad de imagen */}
              <div>
                <CalidadRow selected={selected} onToggle={toggle} />
                <div style={{ borderTop: "1px solid #1c1c1c", marginTop: "18px" }} />
              </div>


            </div>

            {/* Módulo de Texto */}
            <TextoModule textos={textos} setTextos={setTextos} textoTab={textoTab} setTextoTab={setTextoTab} showTextos={showTextos} setShowTextos={setShowTextos} />

            {/* Image to Text Panel */}
            <div style={{ marginTop: "16px", background: "#0e0e14", borderRadius: "13px", border: "1.5px solid #252535", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "15px" }}>🖼</span>
                <span style={{ color: "#a78bfa", fontWeight: "700", fontSize: "12.5px", letterSpacing: "0.4px" }}>IMAGEN → CONCEPTO</span>
                <span style={{ color: "#2a2a4a", fontSize: "10.5px" }}>— Claude analiza y llena las tarjetas automáticamente</span>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                {/* Drop zone */}
                <label style={{
                  flex: imgPreview ? "0 0 100px" : 1,
                  minHeight: imgPreview ? "100px" : "90px",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px",
                  background: "#111", border: "1.5px dashed #2a2a4a", borderRadius: "10px",
                  cursor: imgAnalyzing ? "not-allowed" : "pointer", transition: "all 0.2s",
                  overflow: "hidden", position: "relative",
                }}
                  onMouseOver={(e) => { if (!imgAnalyzing) e.currentTarget.style.borderColor = "#a78bfa88"; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = "#2a2a4a"; }}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#a78bfa"; }}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && f.type.startsWith("image/")) handleImageAnalysis(f); }}
                >
                  <input type="file" accept="image/*" style={{ display: "none" }} disabled={imgAnalyzing}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageAnalysis(f); e.target.value = ""; }}
                  />
                  {imgPreview ? (
                    <img src={imgPreview} alt="preview" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }} />
                  ) : (
                    <>
                      <span style={{ fontSize: "22px", opacity: 0.5 }}>🖼</span>
                      <p style={{ color: "#3a3a6a", fontSize: "11px", textAlign: "center", lineHeight: "1.4" }}>
                        Soltá una imagen<br/>o hacé clic para subir
                      </p>
                      <p style={{ color: "#252545", fontSize: "10px" }}>JPG, PNG, WEBP</p>
                    </>
                  )}
                </label>

                {/* Right side info */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
                  {!imgPreview && !imgAnalyzing && (
                    <p style={{ color: "#2a2a4a", fontSize: "11.5px", lineHeight: "1.6" }}>
                      Claude analizará la imagen y llenará automáticamente las tarjetas de <span style={{ color: "#4a4a7a" }}>Sujeto, Pose, Acción, Ambiente, Estilo, Iluminación, Atmósfera, Detalles</span> y <span style={{ color: "#4a4a7a" }}>Calidad</span>.
                    </p>
                  )}

                  {imgAnalyzing && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: "18px" }}>⟳</span>
                      <div>
                        <p style={{ color: "#a78bfa", fontWeight: "600", fontSize: "13px" }}>Analizando imagen...</p>
                        <p style={{ color: "#3a3a6a", fontSize: "11px", marginTop: "2px" }}>Claude está extrayendo sujeto, estilo, ambiente y más</p>
                      </div>
                    </div>
                  )}

                  {imgSuccess && !imgAnalyzing && (
                    <div style={{ padding: "10px 13px", background: "#0e1a0e", border: "1.5px solid #2a4a2a", borderRadius: "9px" }}>
                      <p style={{ color: "#4caf50", fontWeight: "700", fontSize: "13px" }}>✓ ¡Tarjetas actualizadas!</p>
                      <p style={{ color: "#2a5a2a", fontSize: "11px", marginTop: "3px" }}>Todas las categorías detectadas fueron cargadas y fijadas.</p>
                    </div>
                  )}

                  {imgError && (
                    <div style={{ padding: "10px 13px", background: "#1a0e0e", border: "1.5px solid #3e1e1e", borderRadius: "9px" }}>
                      <p style={{ color: "#cc4444", fontSize: "12px" }}>⚠ {imgError}</p>
                    </div>
                  )}

                  {imgPreview && !imgAnalyzing && (
                    <button
                      onClick={() => { setImgPreview(null); setImgError(""); setImgSuccess(false); }}
                      style={{ padding: "6px 12px", background: "none", border: "1px solid #2a2a4a", borderRadius: "7px", color: "#4a4a7a", fontFamily: "'DM Sans', sans-serif", fontSize: "11px", cursor: "pointer", alignSelf: "flex-start", transition: "all 0.15s" }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = "#a78bfa88"; e.currentTarget.style.color = "#a78bfa"; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = "#2a2a4a"; e.currentTarget.style.color = "#4a4a7a"; }}
                    >✕ Quitar imagen</button>
                  )}
                </div>
              </div>
            </div>


            {/* Prompt Negativo */}
            <div style={{ marginTop: "18px", background: "#120e0e", borderRadius: "13px", border: "1.5px solid #2e1e1e", padding: "16px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "13px" }}>✕</span>
                  <span style={{ color: "#cc4444", fontWeight: "700", fontSize: "13px", letterSpacing: "0.4px" }}>Prompt negativo</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {negativo && (
                    <button onClick={() => setNegativo("")}
                      style={{ padding: "4px 10px", background: "none", border: "1px solid #3a2020", borderRadius: "6px", color: "#553333", fontSize: "10.5px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}
                      onMouseOver={(e) => { e.target.style.borderColor = "#cc4444"; e.target.style.color = "#cc4444"; }}
                      onMouseOut={(e) => { e.target.style.borderColor = "#3a2020"; e.target.style.color = "#553333"; }}
                    >✕ Limpiar</button>
                  )}
                </div>
              </div>
              <p style={{ color: "#4a2020", fontSize: "11px", marginBottom: "14px", lineHeight: "1.5" }}>
                Seleccioná en español lo que querés evitar. Se genera automáticamente en inglés para tu modelo de IA.
              </p>

              {/* Categorías */}
              {[
                { icon: "⭐", label: "Calidad", chips: [
                  { es: "baja calidad", en: "low quality" }, { es: "peor calidad", en: "worst quality" },
                  { es: "baja resolución", en: "low resolution" }, { es: "borroso", en: "blurry" },
                  { es: "pixelado", en: "pixelated" }, { es: "artefactos jpeg", en: "jpeg artifacts" },
                  { es: "ruido", en: "noise" }, { es: "granulado", en: "grainy" },
                  { es: "comprimido", en: "compressed" }, { es: "desenfocado", en: "out of focus" },
                ]},
                { icon: "🦴", label: "Anatomía", chips: [
                  { es: "mala anatomía", en: "bad anatomy" }, { es: "deformado", en: "deformed" },
                  { es: "mutado", en: "mutated" }, { es: "extremidades extra", en: "extra limbs" },
                  { es: "miembros faltantes", en: "missing limbs" }, { es: "dedos extra", en: "extra fingers" },
                  { es: "dedos faltantes", en: "missing fingers" }, { es: "dedos fusionados", en: "fused fingers" },
                  { es: "manos malformadas", en: "malformed hands" }, { es: "cuello largo", en: "long neck" },
                  { es: "proporciones incorrectas", en: "bad proportions" }, { es: "cuerpo desproporcionado", en: "disproportionate body" },
                ]},
                { icon: "😐", label: "Rostro", chips: [
                  { es: "feo", en: "ugly" }, { es: "rostro asimétrico", en: "asymmetrical face" },
                  { es: "rostro deformado", en: "deformed face" }, { es: "ojos malos", en: "bad eyes" },
                  { es: "ojos bizcos", en: "cross-eyed" }, { es: "ojos asimétricos", en: "asymmetrical eyes" },
                  { es: "dientes malos", en: "bad teeth" }, { es: "boca deformada", en: "deformed mouth" },
                ]},
                { icon: "🎨", label: "Estilo no deseado", chips: [
                  { es: "caricatura", en: "cartoon" }, { es: "anime", en: "anime" },
                  { es: "boceto", en: "sketch" }, { es: "pintura", en: "painting" },
                  { es: "render 3D", en: "3D render" }, { es: "estilo plano", en: "flat style" },
                  { es: "estilo infantil", en: "childish style" }, { es: "monocromo", en: "monochrome" },
                ]},
                { icon: "🖼", label: "Composición", chips: [
                  { es: "recortado", en: "cropped" }, { es: "fuera de cuadro", en: "out of frame" },
                  { es: "duplicado", en: "duplicate" }, { es: "rostro clonado", en: "cloned face" },
                  { es: "sobresaturado", en: "oversaturated" }, { es: "subexpuesto", en: "underexposed" },
                  { es: "sobreexpuesto", en: "overexposed" }, { es: "marco", en: "frame" },
                  { es: "borde", en: "border" },
                ]},
                { icon: "💬", label: "Texto y marcas", chips: [
                  { es: "texto", en: "text" }, { es: "marca de agua", en: "watermark" },
                  { es: "firma", en: "signature" }, { es: "logo", en: "logo" },
                  { es: "nombre de usuario", en: "username" }, { es: "subtítulos", en: "subtitles" },
                  { es: "palabras", en: "words" }, { es: "letras", en: "letters" },
                ]},
                { icon: "🚫", label: "Contenido", chips: [
                  { es: "NSFW", en: "nsfw" }, { es: "desnudo", en: "nudity" },
                  { es: "violencia", en: "violence" }, { es: "sangre", en: "blood" },
                  { es: "gore", en: "gore" }, { es: "perturbador", en: "disturbing" },
                ]},
              ].map(({ icon, label, chips }) => (
                <div key={label} style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px" }}>{icon}</span>
                    <span style={{ color: "#884444", fontWeight: "700", fontSize: "11px", letterSpacing: "0.4px" }}>{label}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {chips.map(({ es, en }) => {
                      const active = negativo.toLowerCase().split(",").map(s => s.trim()).includes(en.toLowerCase());
                      return (
                        <button key={en}
                          onClick={() => {
                            if (active) {
                              setNegativo(prev => prev.split(",").map(s => s.trim()).filter(s => s.toLowerCase() !== en.toLowerCase()).join(", "));
                            } else {
                              setNegativo(prev => prev ? prev + ", " + en : en);
                            }
                          }}
                          style={{ padding: "4px 11px", borderRadius: "999px", border: `1.5px solid ${active ? "#cc4444" : "#2e1e1e"}`, background: active ? "#cc444422" : "#1a1010", color: active ? "#cc4444" : "#664444", fontFamily: "'DM Sans', sans-serif", fontSize: "11.5px", fontWeight: active ? "600" : "400", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}
                          onMouseOver={(e) => { if (!active) { e.currentTarget.style.borderColor = "#553333"; e.currentTarget.style.color = "#884444"; }}}
                          onMouseOut={(e) => { if (!active) { e.currentTarget.style.borderColor = "#2e1e1e"; e.currentTarget.style.color = "#664444"; }}}
                        >{active ? "✕ " : ""}{es}</button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Órdenes personalizadas */}
              <div style={{ borderTop: "1px solid #2e1e1e", paddingTop: "14px", marginTop: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px" }}>+</span>
                  <span style={{ color: "#884444", fontWeight: "700", fontSize: "11px", letterSpacing: "0.4px" }}>Órdenes personalizadas</span>
                </div>
                <p style={{ color: "#3a2020", fontSize: "10.5px", marginBottom: "8px" }}>Escribí en español lo que querés evitar. Se traducirá al inglés automáticamente al añadirlo.</p>

                {/* Custom chips */}
                {customNegChips.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                    {customNegChips.map((chip) => {
                      const active = negativo.toLowerCase().split(",").map(s => s.trim()).includes(chip.en.toLowerCase());
                      return (
                        <div key={chip.en} style={{ display: "flex", alignItems: "center" }}>
                          <button
                            onClick={() => { if (active) { setNegativo(prev => prev.split(",").map(s => s.trim()).filter(s => s.toLowerCase() !== chip.en.toLowerCase()).join(", ")); } else { setNegativo(prev => prev ? prev + ", " + chip.en : chip.en); }}}
                            title={`EN: ${chip.en}`}
                            style={{ padding: "4px 9px 4px 11px", borderRadius: "999px 0 0 999px", border: `1.5px solid ${active ? "#cc4444" : "#3a1e1e"}`, borderRight: "none", background: active ? "#cc444422" : "#1e1010", color: active ? "#cc4444" : "#664444", fontFamily: "'DM Sans', sans-serif", fontSize: "11.5px", fontWeight: active ? "600" : "400", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}
                          >{active ? "✕ " : ""}{chip.es}</button>
                          <button
                            onClick={() => { setCustomNegChips(prev => prev.filter(c => c.en !== chip.en)); if (active) setNegativo(prev => prev.split(",").map(s => s.trim()).filter(s => s.toLowerCase() !== chip.en.toLowerCase()).join(", ")); }}
                            style={{ padding: "4px 7px", borderRadius: "0 999px 999px 0", border: `1.5px solid ${active ? "#cc4444" : "#3a1e1e"}`, background: active ? "#cc444422" : "#1e1010", color: "#664444", fontSize: "10px", cursor: "pointer", transition: "all 0.15s" }}
                            onMouseOver={(e) => { e.currentTarget.style.color = "#cc4444"; e.currentTarget.style.borderColor = "#cc4444"; }}
                            onMouseOut={(e) => { e.currentTarget.style.color = "#664444"; e.currentTarget.style.borderColor = active ? "#cc4444" : "#3a1e1e"; }}
                          >✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Input */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <input value={newNegChip} onChange={(e) => setNewNegChip(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && newNegChip.trim() && !translatingChip) addCustomChip(); }}
                    placeholder="ej: brazos extra, aspecto plástico, fondo borroso"
                    style={{ flex: 1, background: "#1a0e0e", border: "1.5px solid #2e1616", borderRadius: "8px", padding: "8px 12px", color: "#cc8888", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", outline: "none" }}
                    onFocus={(e) => { e.target.style.borderColor = "#cc444466"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#2e1616"; }}
                  />
                  <button onClick={addCustomChip} disabled={!newNegChip.trim() || translatingChip}
                    style={{ padding: "8px 16px", background: newNegChip.trim() && !translatingChip ? "#cc4444" : "#1a0e0e", border: `1.5px solid ${newNegChip.trim() ? "#cc444466" : "#2e1616"}`, borderRadius: "8px", color: newNegChip.trim() && !translatingChip ? "#fff" : "#553333", fontFamily: "'DM Sans', sans-serif", fontWeight: "700", fontSize: "12px", cursor: newNegChip.trim() && !translatingChip ? "pointer" : "not-allowed", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}
                  >{translatingChip ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span> Traduciendo...</> : "+ Añadir"}</button>
                </div>
              </div>

              {/* Texto generado en inglés */}
              <div style={{ marginTop: "14px", borderTop: "1px solid #2e1e1e", paddingTop: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px" }}>⚡</span>
                  <span style={{ color: "#884444", fontWeight: "700", fontSize: "11px", letterSpacing: "0.4px" }}>Texto generado en inglés</span>
                </div>
                <textarea value={negativo} onChange={(e) => setNegativo(e.target.value)}
                  placeholder="Seleccioná chips o añadí términos personalizados arriba..."
                  rows={3}
                  style={{ width: "100%", background: "#1a0e0e", border: `1.5px solid ${negativo ? "#3e1e1e" : "#221212"}`, borderRadius: "8px", padding: "10px 12px", color: negativo ? "#dd8888" : "#553333", fontFamily: "'DM Sans', sans-serif", fontSize: "12.5px", outline: "none", resize: "vertical", lineHeight: "1.6", transition: "all 0.18s" }}
                  onFocus={(e) => { e.target.style.borderColor = "#cc444477"; e.target.style.color = "#ddaaaa"; }}
                  onBlur={(e) => { e.target.style.borderColor = negativo ? "#3e1e1e" : "#221212"; e.target.style.color = negativo ? "#dd8888" : "#553333"; }}
                />
                {negativo && <p style={{ marginTop: "6px", fontSize: "11px", color: "#553333", fontStyle: "italic" }}>→ <span style={{ color: "#884444" }}>--no {negativo}</span></p>}
              </div>
            </div>


            {/* Prompt generado */}
            <div style={{ marginTop: "18px" }}>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <span style={{ fontSize: "14px" }}>⚡</span>
                  <span style={{ color: "#ddd", fontWeight: "700", fontSize: "13px" }}>Prompt generado</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
                  {/* Limpiar */}
                  {prompt && (
                    <button onClick={() => { setPromptEdited(false); setPrompt(""); setPromptEn(""); }}
                      style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", background: "none", border: "1.5px solid #2a2a2a", borderRadius: "8px", color: "#666", fontFamily: "'DM Sans', sans-serif", fontWeight: "600", fontSize: "12px", cursor: "pointer", transition: "all 0.15s" }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = "#cc4444"; e.currentTarget.style.color = "#cc4444"; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#666"; }}
                    >🗑 Limpiar</button>
                  )}
                  {/* Guardar plantilla */}
                  <button onClick={() => setShowSaveInput(v => !v)} disabled={!prompt}
                    style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 13px", background: showSaveInput ? "#2a1a4a" : "#1e1e2e", border: `1.5px solid ${showSaveInput ? "#7c3aed" : "#3a3a6a"}`, borderRadius: "8px", color: showSaveInput ? "#c4b5fd" : "#8888dd", fontFamily: "'DM Sans', sans-serif", fontWeight: "600", fontSize: "12px", cursor: prompt ? "pointer" : "not-allowed", opacity: !prompt ? 0.4 : 1, transition: "all 0.18s" }}
                    onMouseOver={(e) => { if (prompt) { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.background = "#2a1a4a"; }}}
                    onMouseOut={(e) => { if (!showSaveInput) { e.currentTarget.style.borderColor = "#3a3a6a"; e.currentTarget.style.background = "#1e1e2e"; }}}
                  >+ Guardar plantilla</button>
                  {/* Traducir */}
                  <button onClick={handleTranslate} disabled={!prompt || translating}
                    style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 13px", background: translating ? "#1a1a2e" : "#1e1e2e", border: `1.5px solid ${translating ? "#3a3a7a" : "#2e2e5a"}`, borderRadius: "8px", color: translating ? "#7878cc" : "#8888dd", fontFamily: "'DM Sans', sans-serif", fontWeight: "600", fontSize: "12px", cursor: prompt && !translating ? "pointer" : "not-allowed", opacity: !prompt ? 0.4 : 1, transition: "all 0.2s" }}
                    onMouseOver={(e) => { if (prompt && !translating) e.currentTarget.style.borderColor = "#5555bb"; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = translating ? "#3a3a7a" : "#2e2e5a"; }}
                  >{translating ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span> Traduciendo...</> : <>🌐 Traducir EN</>}</button>
                  {/* Copiar */}
                  <button onClick={() => copyText(prompt, setCopied)}
                    style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 13px", background: copied ? "#162016" : "#1e1e1e", border: `1.5px solid ${copied ? "#2e6e2e" : "#2a2a2a"}`, borderRadius: "8px", color: copied ? "#4caf50" : "#888", fontFamily: "'DM Sans', sans-serif", fontWeight: "600", fontSize: "12px", cursor: "pointer", transition: "all 0.2s" }}
                  >{copied ? "✓ Copiado" : "📋 Copiar"}</button>
                </div>
              </div>

              {/* Save input row */}
              {showSaveInput && (
                <div style={{ display: "flex", gap: "8px", marginBottom: "10px", alignItems: "center", padding: "10px 12px", background: "#1a1a2e", borderRadius: "9px", border: "1.5px solid #3a3a7a" }}>
                  <span style={{ fontSize: "14px", flexShrink: 0 }}>📋</span>
                  <input autoFocus value={savingName} onChange={(e) => setSavingName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveTemplate(); if (e.key === "Escape") { setShowSaveInput(false); setSavingName(""); }}}
                    placeholder="Nombre de la plantilla..."
                    style={{ flex: 1, background: "none", border: "none", color: "#c4b5fd", fontFamily: "'DM Sans', sans-serif", fontSize: "13px", outline: "none" }}
                  />
                  <button onClick={saveTemplate} disabled={!savingName.trim()}
                    style={{ padding: "7px 18px", background: savingName.trim() ? "#7c3aed" : "#2a2a4a", border: "none", borderRadius: "8px", color: savingName.trim() ? "#fff" : "#555", fontFamily: "'DM Sans', sans-serif", fontWeight: "700", fontSize: "13px", cursor: savingName.trim() ? "pointer" : "not-allowed", transition: "all 0.18s" }}
                  >Guardar</button>
                  <button onClick={() => { setShowSaveInput(false); setSavingName(""); }}
                    style={{ background: "none", border: "none", color: "#555", fontSize: "16px", cursor: "pointer", padding: "0 4px", lineHeight: 1 }}
                    onMouseOver={(e) => e.target.style.color = "#aaa"}
                    onMouseOut={(e) => e.target.style.color = "#555"}
                  >✕</button>
                </div>
              )}
              {promptEdited && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "6px" }}>
                  <button onClick={() => { setPromptEdited(false); setPrompt(buildPrompt(selected, custom, negativo, hmrCards, textos)); setPromptEn(""); }}
                    style={{ padding: "3px 10px", background: "none", border: "1px solid #3a2a18", borderRadius: "6px", color: "#cc6644", fontFamily: "'DM Sans', sans-serif", fontSize: "10.5px", cursor: "pointer" }}
                  >↺ Restaurar auto-generado</button>
                </div>
              )}
              <textarea
                value={prompt}
                onChange={(e) => { setPrompt(e.target.value); setPromptEdited(true); setPromptEn(""); setTranslateError(false); }}
                placeholder="Seleccioná opciones para generar el prompt..."
                rows={4}
                style={{
                  width: "100%", background: "#111",
                  border: `1.5px solid ${promptEdited ? "#3a2a18" : "#252525"}`,
                  borderRadius: "11px", padding: "13px 14px",
                  color: promptEdited ? "#e8d5b0" : "#ddd",
                  fontFamily: "'DM Sans', sans-serif", fontSize: "13.5px",
                  lineHeight: "1.7", outline: "none", resize: "vertical",
                  transition: "border-color 0.2s, color 0.2s",
                  minHeight: "90px",
                }}
                onFocus={(e) => { if (!promptEdited) e.target.style.borderColor = "#3a3a3a"; }}
                onBlur={(e) => { e.target.style.borderColor = promptEdited ? "#3a2a18" : "#252525"; }}
              />
            </div>




            {/* Copiar en inglés + Prompt EN */}
            {(promptEn || translateError) && (
              <div style={{ marginTop: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <p style={{ color: "#8888dd", fontWeight: "700", fontSize: "12.5px", letterSpacing: "0.3px" }}>🌐 PROMPT EN INGLÉS</p>
                  {promptEn && (
                    <button onClick={() => copyText(promptEn, setCopiedEn)}
                      style={{ padding: "5px 12px", background: copiedEn ? "#162016" : "#1e1e1e", border: `1.5px solid ${copiedEn ? "#2e6e2e" : "#333"}`, borderRadius: "7px", color: copiedEn ? "#4caf50" : "#777", fontFamily: "'DM Sans', sans-serif", fontWeight: "600", fontSize: "11.5px", cursor: "pointer", transition: "all 0.2s" }}
                    >{copiedEn ? "✓ Copiado" : "📋 Copiar EN"}</button>
                  )}
                </div>
                <div style={{ background: "#0e0e1a", border: "1.5px solid #2a2a4a", borderRadius: "11px", padding: "14px", minHeight: "72px" }}>
                  {translateError ? <p style={{ color: "#774444", fontSize: "13px" }}>No se pudo traducir. Intentá de nuevo.</p>
                    : <p style={{ color: "#c8c8ff", fontSize: "13.5px", lineHeight: "1.7" }}>{promptEn}</p>}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div style={{ display: "flex", gap: "9px", marginTop: "14px" }}>
              <button onClick={() => { setShowExportJson(false); setShowImportBox(false); }} style={{ display: "none" }} />
              <button onClick={exportTemplates} disabled={!templates.length}
                style={{ flex: 1, padding: "10px", background: "#1e1e1e", border: `1.5px solid ${templates.length ? "#2a2a2a" : "#1a1a1a"}`, borderRadius: "9px", color: templates.length ? "#777" : "#333", fontFamily: "'DM Sans', sans-serif", fontWeight: "600", fontSize: "12.5px", cursor: templates.length ? "pointer" : "not-allowed", transition: "all 0.18s", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                onMouseOver={(e) => { if (templates.length) { e.currentTarget.style.borderColor = "#F5C51866"; e.currentTarget.style.color = "#F5C518"; }}}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = templates.length ? "#2a2a2a" : "#1a1a1a"; e.currentTarget.style.color = templates.length ? "#777" : "#333"; }}
              >↓ Exportar plantillas {templates.length > 0 && <span style={{ background: "#F5C51822", border: "1px solid #F5C51844", borderRadius: "999px", padding: "1px 7px", fontSize: "11px" }}>{templates.length}</span>}</button>
              <button onClick={() => { setShowImportBox(v => !v); setImportError(""); }}
                style={{ flex: 1, padding: "10px", background: showImportBox ? "#1a1a0e" : "#1e1e1e", border: `1.5px solid ${showImportBox ? "#4a4a18" : "#2a2a2a"}`, borderRadius: "9px", color: showImportBox ? "#F5C518" : "#777", fontFamily: "'DM Sans', sans-serif", fontWeight: "600", fontSize: "12.5px", cursor: "pointer", transition: "all 0.18s" }}
              >↑ Importar plantillas</button>
            </div>

            {/* Export JSON panel */}
            {showExportJson && templates.length > 0 && (
              <div style={{ marginTop: "10px", background: "#0a0a0e", borderRadius: "9px", border: "1.5px solid #2a2a3a", padding: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <p style={{ color: "#5a5a8a", fontSize: "11px", fontWeight: "600" }}>Copiá el JSON y guardalo como dtf-plantillas.json</p>
                  <div style={{ display: "flex", gap: "7px" }}>
                    <button onClick={copyExportJson} style={{ padding: "4px 12px", background: exportJsonCopied ? "#162016" : "#1e1e2e", border: `1.5px solid ${exportJsonCopied ? "#2e6e2e" : "#3a3a6a"}`, borderRadius: "7px", color: exportJsonCopied ? "#4caf50" : "#7777cc", fontFamily: "'DM Sans', sans-serif", fontWeight: "600", fontSize: "11px", cursor: "pointer" }}>{exportJsonCopied ? "✓ Copiado" : "📋 Copiar"}</button>
                    <button onClick={() => setShowExportJson(false)} style={{ padding: "4px 9px", background: "none", border: "1px solid #2a2a3a", borderRadius: "7px", color: "#444", fontSize: "11px", cursor: "pointer" }}>✕</button>
                  </div>
                </div>
                <textarea readOnly value={JSON.stringify(templates, null, 2)} style={{ width: "100%", height: "150px", background: "#0e0e14", border: "1px solid #1e1e2e", borderRadius: "7px", padding: "8px 10px", color: "#5a5a8a", fontFamily: "monospace", fontSize: "10.5px", outline: "none", resize: "vertical", lineHeight: "1.5" }} onFocus={(e) => e.target.select()} />
              </div>
            )}

            {/* Import JSON panel */}
            {showImportBox && (
              <div style={{ marginTop: "10px", background: "#0a0a0e", borderRadius: "9px", border: "1.5px solid #3a3a18", padding: "12px" }}>
                <p style={{ color: "#5a5a2a", fontSize: "11px", fontWeight: "600", marginBottom: "8px" }}>Pegá tu JSON exportado acá:</p>
                <textarea value={importJsonText} onChange={(e) => setImportJsonText(e.target.value)} placeholder='[{"id": 123, "name": "Mi plantilla", ...}]' style={{ width: "100%", height: "110px", background: "#0e0e0a", border: "1px solid #2a2a18", borderRadius: "7px", padding: "8px 10px", color: "#aaa", fontFamily: "monospace", fontSize: "10.5px", outline: "none", resize: "vertical" }} />
                {importError && <p style={{ color: "#cc4444", fontSize: "11px", marginTop: "6px" }}>{importError}</p>}
                <div style={{ display: "flex", gap: "7px", marginTop: "8px" }}>
                  <button onClick={() => pasteImportTemplates(importJsonText)} disabled={!importJsonText.trim()} style={{ padding: "6px 14px", background: importJsonText.trim() ? "#2a2a10" : "#1a1a0a", border: `1.5px solid ${importJsonText.trim() ? "#F5C51866" : "#2a2a18"}`, borderRadius: "8px", color: importJsonText.trim() ? "#F5C518" : "#444", fontFamily: "'DM Sans', sans-serif", fontWeight: "700", fontSize: "12px", cursor: importJsonText.trim() ? "pointer" : "not-allowed" }}>✓ Importar</button>
                  <button onClick={() => { setShowImportBox(false); setImportJsonText(""); setImportError(""); }} style={{ padding: "6px 11px", background: "none", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#555", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", cursor: "pointer" }}>Cancelar</button>
                </div>
              </div>
            )}

            {/* Plantillas guardadas */}
            {templates.length > 0 && (
              <div style={{ marginTop: "12px", background: "#111", borderRadius: "12px", border: "1.5px solid #222", padding: "14px" }}>
                <p style={{ color: "#F5C518", fontWeight: "700", fontSize: "12px", marginBottom: "10px", letterSpacing: "0.3px" }}>📁 Mis plantillas</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  {templates.map(tpl => (
                    <div key={tpl.id} style={{ background: "#161616", border: "1.5px solid #222", borderRadius: "9px", padding: "10px 13px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                        {editingId === tpl.id ? (
                          <div style={{ display: "flex", gap: "6px", flex: 1 }}>
                            <input autoFocus value={editingName} onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") setEditingId(null); }}
                              style={{ flex: 1, background: "#1a1a1a", border: "1.5px solid #F5C51866", borderRadius: "6px", padding: "4px 9px", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: "12.5px", outline: "none" }}
                            />
                            <button onClick={confirmRename} style={{ padding: "4px 10px", background: "#F5C518", border: "none", borderRadius: "6px", color: "#111", fontFamily: "'DM Sans', sans-serif", fontWeight: "700", fontSize: "11px", cursor: "pointer" }}>✓</button>
                            <button onClick={() => setEditingId(null)} style={{ padding: "4px 8px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "6px", color: "#666", fontSize: "11px", cursor: "pointer" }}>✕</button>
                          </div>
                        ) : (
                          <p style={{ color: "#ddd", fontWeight: "600", fontSize: "12.5px", flex: 1 }}>{tpl.name}</p>
                        )}
                        <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                          <button onClick={() => loadTemplate(tpl)} title="Cargar" style={{ width: "26px", height: "26px", background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: "6px", color: "#4caf50", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }} onMouseOver={(e) => { e.currentTarget.style.borderColor = "#4caf50"; e.currentTarget.style.background = "#1a2e1a"; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.background = "#1e1e1e"; }}>↺</button>
                          <button onClick={() => startRename(tpl)} title="Renombrar" style={{ width: "26px", height: "26px", background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: "6px", color: "#8888dd", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }} onMouseOver={(e) => { e.currentTarget.style.borderColor = "#8888dd"; e.currentTarget.style.background = "#12122a"; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.background = "#1e1e1e"; }}>✎</button>
                          <button onClick={() => deleteTemplate(tpl.id)} title="Eliminar" style={{ width: "26px", height: "26px", background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: "6px", color: "#cc4444", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }} onMouseOver={(e) => { e.currentTarget.style.borderColor = "#cc4444"; e.currentTarget.style.background = "#1a0e0e"; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.background = "#1e1e1e"; }}>🗑</button>
                        </div>
                      </div>
                      <p style={{ color: "#333", fontSize: "11px", lineHeight: "1.5", fontStyle: "italic", marginTop: "4px" }}>{(tpl.promptEn || tpl.prompt || "").slice(0, 120)}{(tpl.promptEn || tpl.prompt || "").length > 120 ? "..." : ""}</p>
                      <p style={{ color: "#222", fontSize: "10px", marginTop: "3px" }}>{new Date(tpl.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Panel Plantillas */}

            {/* Perchance */}
            <button
              onClick={() => { const p = promptEn || prompt; if (!p) return; window.open(`https://perchance.org/qinegen?prompt=${encodeURIComponent(p)}`, "_blank"); }}
              disabled={!prompt}
              style={{
                width: "100%", marginTop: "16px", padding: "13px",
                background: prompt ? "linear-gradient(135deg, #4c1d95, #6d28d9)" : "#1a1a2e",
                border: `1.5px solid ${prompt ? "#7c3aed55" : "#252545"}`,
                borderRadius: "10px",
                color: prompt ? "#e9d5ff" : "#333355",
                fontFamily: "'DM Sans', sans-serif", fontWeight: "700", fontSize: "14px",
                cursor: prompt ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "9px",
                transition: "all 0.2s",
                boxShadow: prompt ? "0 4px 20px #6d28d933" : "none",
              }}
              onMouseOver={(e) => { if (prompt) e.currentTarget.style.boxShadow = "0 4px 28px #6d28d966"; }}
              onMouseOut={(e) => { if (prompt) e.currentTarget.style.boxShadow = "0 4px 20px #6d28d933"; }}
            >
              <span style={{ fontSize: "16px" }}>🚀</span>
              Abrir en Perchance
              <span style={{ fontSize: "11px", opacity: 0.7, fontWeight: "400" }}>↗ nueva pestaña</span>
            </button>


          </div>

        </div>
      </div>
    </>
  );
}
