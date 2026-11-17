import Contador from "../models/Contador.js";

const ZONA_HORARIA = "America/Mexico_City";

/** Día calendario (YYYY-MM-DD) en hora de México: el número de pedido reinicia ahí, no en UTC. */
export const diaMexico = (fecha = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);

/** Alias fácil de decir en voz alta: primer nombre (solo letras, máx. 10) + número. Ej.: "Ana12". */
export const aliasPedido = (nombreCompleto, numero) => {
  const primero = String(nombreCompleto || "").trim().split(/\s+/)[0] || "";
  const letras = primero.replace(/[^\p{L}]/gu, "").slice(0, 10);
  const nombre = letras ? letras.charAt(0).toLocaleUpperCase("es") + letras.slice(1).toLocaleLowerCase("es") : "Cliente";
  return `${nombre}${numero}`;
};

/** Siguiente número del día para el local. Atómico; debe ejecutarse dentro de la transacción del pedido. */
export const siguienteNumero = async (localId, dia, session) => {
  const contador = await Contador.findOneAndUpdate(
    { _id: `${localId}:${dia}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );
  return contador.seq;
};

/** Notas del cliente para el local (ej. "sin cebolla"). */
export const limpiarNotas = (valor) => {
  if (typeof valor !== "string") return undefined;
  const texto = valor.replace(/\s+/g, " ").trim().slice(0, 140);
  return texto || undefined;
};

/** Nombre libre de quien prepara el pedido. */
export const limpiarAtiende = (valor) => {
  if (typeof valor !== "string") return undefined;
  const texto = valor.replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 20);
  return texto || undefined;
};
