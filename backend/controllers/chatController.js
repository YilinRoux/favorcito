import Mensaje from "../models/Mensaje.js";
import Pedido from "../models/Pedido.js";
import Local from "../models/Local.js";

const verificarAcceso = async (pedido, usuario) => {
  const esEstudiante = pedido.estudiante.toString() === usuario.id;

  let esVendedor = false;
  if (usuario.rol === "vendedor") {
    const local = await Local.findOne({ vendedor: usuario.id });
    esVendedor = local && pedido.local.toString() === local._id.toString();
  }

  const esRepartidor =
    pedido.repartidor && pedido.repartidor.toString() === usuario.id;

  return esEstudiante || esVendedor || esRepartidor;
};

export const enviarMensaje = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { mensaje } = req.body;

    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) return res.status(404).json({ mensaje: "Pedido no encontrado" });

    const tieneAcceso = await verificarAcceso(pedido, req.usuario);
    if (!tieneAcceso) return res.status(403).json({ mensaje: "No autorizado para este chat" });

    const nuevoMensaje = await Mensaje.create({
      pedido: pedidoId,
      emisor: req.usuario.id,
      rol: req.usuario.rol,
      mensaje,
      leidoPorEstudiante: req.usuario.rol === "estudiante",
      leidoPorVendedor: req.usuario.rol === "vendedor",
    });

    const io = req.app.get("io");

    // Enviar mensaje solo a los del room del pedido
    io.to(pedidoId).emit("nuevoMensaje", nuevoMensaje);

    // Notificación global con emisorId para que el frontend filtre
    io.to(pedidoId).emit("nuevaNotificacion", {
  pedidoId,
  emisorId: req.usuario.id,
});
    res.status(201).json(nuevoMensaje);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al enviar mensaje", error: error.message });
  }
};

export const obtenerMensajes = async (req, res) => {
  try {
    const { pedidoId } = req.params;

    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) return res.status(404).json({ mensaje: "Pedido no encontrado" });

    const tieneAcceso = await verificarAcceso(pedido, req.usuario);
    if (!tieneAcceso) return res.status(403).json({ mensaje: "No autorizado" });

    const mensajes = await Mensaje.find({ pedido: pedidoId })
      .populate("emisor", "nombre_completo rol")
      .sort({ createdAt: 1 });

    res.json(mensajes);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener mensajes", error: error.message });
  }
};

export const marcarComoLeido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const rol = req.usuario.rol;

    if (rol === "estudiante") {
      await Mensaje.updateMany(
        { pedido: pedidoId, leidoPorEstudiante: false },
        { leidoPorEstudiante: true }
      );
    }
    if (rol === "vendedor") {
      await Mensaje.updateMany(
        { pedido: pedidoId, leidoPorVendedor: false },
        { leidoPorVendedor: true }
      );
    }

    res.json({ mensaje: "Mensajes marcados como leídos" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al marcar como leído", error: error.message });
  }
};

export const contarNoLeidos = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const rol = req.usuario.rol;

    let filtro = { pedido: pedidoId };
    if (rol === "estudiante") filtro.leidoPorEstudiante = false;
    if (rol === "vendedor") filtro.leidoPorVendedor = false;

    const cantidad = await Mensaje.countDocuments(filtro);
    res.json({ noLeidos: cantidad });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al contar mensajes", error: error.message });
  }
};