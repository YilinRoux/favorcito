/** Usa la fecha del estado actual; los pedidos antiguos sin historial se identifican como tales. */
export const tiempoCocina = (pedido, ahora = Date.now()) => {
  const estados = pedido.estado === "en_preparacion" ? ["en_preparacion"] : [pedido.estado];
  const paso = [...(pedido.historialEstados || [])].reverse().find((p) => estados.includes(p.estado));
  const fechaEstado = paso?.fecha ? new Date(paso.fecha).getTime() : NaN;
  const tieneEstado = Number.isFinite(fechaEstado);
  const fecha = tieneEstado ? fechaEstado : new Date(pedido.createdAt).getTime();
  const minutos = Number.isFinite(fecha) ? Math.max(0, Math.floor((ahora - fecha) / 60000)) : null;
  const texto = minutos === null ? "Tiempo no disponible" : minutos < 60 ? `${minutos} min` : `${Math.floor(minutos / 60)} h ${minutos % 60} min`;
  const etiquetas = { enviado: "Esperando aceptación", aceptado: "Aceptado", en_preparacion: "En preparación", listo: "Listo desde hace", en_camino: "En camino" };
  const etiqueta = tieneEstado || pedido.estado === "enviado" ? etiquetas[pedido.estado] : "Desde el pedido";
  const urgente = tieneEstado || pedido.estado === "enviado";
  const clase = urgente && ["enviado", "aceptado", "en_preparacion"].includes(pedido.estado) && minutos !== null
    ? minutos >= 20 ? " is-rojo" : minutos >= 10 ? " is-ambar" : "" : "";
  return { etiqueta, texto, clase };
};

export const agruparCocina = (pedidos) => [
  ["nuevos", "Por aceptar", pedidos.filter((p) => p.estado === "enviado")],
  ["preparando", "En preparación", pedidos.filter((p) => ["aceptado", "en_preparacion"].includes(p.estado))],
  ["listos", "Por entregar", pedidos.filter((p) => p.estado === "listo")],
];
