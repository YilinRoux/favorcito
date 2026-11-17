import Usuario from "../models/Usuario.js";

export const MOTIVOS_REPARTIDOR_A_CLIENTE = ["no_pago", "no_recibio_pedido", "cliente_ausente"];
export const MOTIVOS_CLIENTE_A_REPARTIDOR = [
  "pedido_incompleto",
  "pedido_sucio_danado",
  "pedido_equivocado",
  "mal_trato",
  "no_entrego",
];
export const ESTADOS_REPORTABLES = ["en_camino", "entregado"];
export const VENTANA_REPORTE_HORAS = 48;
export const DIAS_SUSPENSION = 7;

export const MENSAJES_AVISO = {
  aviso: "Tienes una falta registrada por un reporte confirmado. Con más faltas tu cuenta puede ser suspendida.",
  sospechoso: "Tienes 2 faltas registradas y tu cuenta quedó marcada. Una falta más suspenderá tu cuenta por 7 días.",
};

/** Escalera de consecuencias según el total de faltas confirmadas. */
export const consecuenciaPorFaltas = (faltas) => {
  if (faltas >= 4) return { accion: "baja" };
  if (faltas === 3) return { accion: "suspension", dias: DIAS_SUSPENSION };
  if (faltas === 2) return { accion: "sospechoso" };
  if (faltas === 1) return { accion: "aviso" };
  return { accion: "ninguna" };
};

const idDe = (valor) => String(valor?._id ?? valor ?? "");

/**
 * Decide si `usuarioId` puede reportar el pedido y a quién.
 * Es una función pura: no toca la base de datos.
 */
export const evaluarReportePedido = ({ pedido, usuarioId, motivo, ahora = new Date() }) => {
  if (!pedido) return { ok: false, status: 404, mensaje: "Pedido no encontrado" };
  if (pedido.tipoEntrega !== "favorcito" || !pedido.repartidor) {
    return { ok: false, status: 400, mensaje: "Este pedido no tuvo repartidor" };
  }
  if (!ESTADOS_REPORTABLES.includes(pedido.estado)) {
    return { ok: false, status: 400, mensaje: "Solo puedes reportar pedidos en camino o entregados" };
  }

  const usuario = idDe(usuarioId);
  const esCliente = idDe(pedido.estudiante) === usuario;
  const esRepartidor = idDe(pedido.repartidor) === usuario;
  if (!esCliente && !esRepartidor) {
    return { ok: false, status: 403, mensaje: "No participaste en este pedido" };
  }

  const permitidos = esRepartidor ? MOTIVOS_REPARTIDOR_A_CLIENTE : MOTIVOS_CLIENTE_A_REPARTIDOR;
  if (!permitidos.includes(motivo)) {
    return { ok: false, status: 400, mensaje: "Motivo inválido" };
  }

  const historial = pedido.historialEstados || [];
  const referencia = historial.length ? historial[historial.length - 1].fecha : pedido.updatedAt;
  const horas = (ahora - new Date(referencia)) / 36e5;
  if (Number.isFinite(horas) && horas > VENTANA_REPORTE_HORAS) {
    return { ok: false, status: 400, mensaje: `El plazo para reportar (${VENTANA_REPORTE_HORAS} h) ya venció` };
  }

  return esRepartidor
    ? { ok: true, contexto: "repartidor_a_cliente", reportadoId: idDe(pedido.estudiante) }
    : { ok: true, contexto: "cliente_a_repartidor", reportadoId: idDe(pedido.repartidor) };
};

export const suspensionVencida = (usuario, ahora = new Date()) =>
  Boolean(usuario) &&
  !usuario.activo &&
  !usuario.bajaDefinitiva &&
  Boolean(usuario.suspendidoHasta) &&
  new Date(usuario.suspendidoHasta) <= ahora;

/** Suma una falta y aplica la consecuencia; participa en la transacción si se indica sesión. */
export const aplicarFalta = async (usuarioId, session) => {
  const options = session ? { session } : {};
  const usuario = await Usuario.findByIdAndUpdate(usuarioId, { $inc: { faltas: 1 } }, { new: true, ...options });
  if (!usuario) return null;

  const consecuencia = consecuenciaPorFaltas(usuario.faltas);
  const cambios = {};
  if (consecuencia.accion === "aviso") cambios.avisoFalta = true;
  if (consecuencia.accion === "sospechoso") Object.assign(cambios, { sospechoso: true, avisoFalta: true });
  if (consecuencia.accion === "suspension") {
    Object.assign(cambios, {
      sospechoso: true,
      activo: false,
      suspendidoHasta: new Date(Date.now() + consecuencia.dias * 864e5),
    });
  }
  if (consecuencia.accion === "baja") {
    Object.assign(cambios, { sospechoso: true, activo: false, suspendidoHasta: null, bajaDefinitiva: true });
  }
  if (Object.keys(cambios).length) await Usuario.updateOne({ _id: usuarioId }, { $set: cambios }, options);

  return { faltas: usuario.faltas, ...consecuencia };
};
