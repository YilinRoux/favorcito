// Aviso sonoro de pedidos nuevos. Usa Web Audio (sin archivos ni librerías) para ser liviano.
const CLAVE = "favorcito-sonido";
let contexto = null;

const obtenerContexto = () => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!contexto) contexto = new AudioCtx();
  return contexto;
};

export const sonidoActivado = () => localStorage.getItem(CLAVE) === "1";

/** Debe llamarse desde un toque del usuario: los navegadores bloquean el audio antes de eso. */
export const activarSonido = async () => {
  const ctx = obtenerContexto();
  if (!ctx) return false;
  await ctx.resume?.();
  localStorage.setItem(CLAVE, "1");
  sonar();
  return true;
};

export const desactivarSonido = () => localStorage.setItem(CLAVE, "0");

/** Tras recargar la página, el audio se reanuda con el primer toque en cualquier parte. */
export const reanudarEnPrimerToque = () => {
  const reanudar = () => {
    if (sonidoActivado()) obtenerContexto()?.resume?.();
  };
  window.addEventListener("pointerdown", reanudar, { once: true });
  return () => window.removeEventListener("pointerdown", reanudar);
};

export const sonar = () => {
  navigator.vibrate?.([200, 100, 200]);
  const ctx = contexto;
  if (!ctx || ctx.state !== "running") return;
  [880, 1175].forEach((frecuencia, i) => {
    const inicio = ctx.currentTime + i * 0.2;
    const oscilador = ctx.createOscillator();
    const volumen = ctx.createGain();
    oscilador.type = "sine";
    oscilador.frequency.value = frecuencia;
    volumen.gain.setValueAtTime(0.0001, inicio);
    volumen.gain.exponentialRampToValueAtTime(0.25, inicio + 0.02);
    volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.18);
    oscilador.connect(volumen).connect(ctx.destination);
    oscilador.start(inicio);
    oscilador.stop(inicio + 0.2);
  });
};
