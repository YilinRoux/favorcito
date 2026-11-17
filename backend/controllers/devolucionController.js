import mongoose from "mongoose";
import Pedido from "../models/Pedido.js";
import Local from "../models/Local.js";

const MOTIVOS = ["cliente_ausente", "no_recibio_pedido", "no_pago"];
const avisar = (req, id, estado) => {
  try { req.app.get("io")?.to(String(id)).emit("estadoActualizado", { estado }); } catch { /* El cambio ya está guardado. */ }
};
export const solicitarDevolucion = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { motivo, conservoPedido } = req.body;
    if (!mongoose.isValidObjectId(pedidoId) || !MOTIVOS.includes(motivo) || conservoPedido !== true) {
      return res.status(400).json({ mensaje: "Indica el motivo y confirma que conservas el pedido completo" });
    }
    const pedido = await Pedido.findOneAndUpdate(
      { _id: pedidoId, tipoEntrega: "favorcito", estado: "en_camino", repartidor: req.usuario.id, "devolucion.estado": { $exists: false } },
      { $set: { devolucion: { estado: "pendiente", motivo, solicitadaEn: new Date() } } },
      { new: true }
    );
    if (!pedido) return res.status(409).json({ mensaje: "El pedido no está disponible para solicitar devolución" });
    avisar(req, pedidoId, pedido.estado);
    res.json({ mensaje: "Vuelve al local con el pedido y pide al vendedor que confirme la recepción", pedido });
  } catch { res.status(500).json({ mensaje: "Error al solicitar devolución" }); }
};
export const obtenerDevoluciones = async (req, res) => {
  try {
    const locales = await Local.find({ vendedor: req.usuario.id }).select("_id");
    const pedidos = await Pedido.find({ local: { $in: locales.map((l) => l._id) }, estado: "en_camino", "devolucion.estado": "pendiente" })
      .select("alias productos devolucion repartidor total tipoEntrega").sort({ "devolucion.solicitadaEn": 1 });
    res.json(pedidos);
  } catch { res.status(500).json({ mensaje: "Error al consultar devoluciones" }); }
};
export const recibirDevolucion = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    if (!mongoose.isValidObjectId(pedidoId)) return res.status(400).json({ mensaje: "Pedido inválido" });
    const locales = await Local.find({ vendedor: req.usuario.id }).select("_id");
    const session = await Pedido.startSession();
    let pedido;
    try {
      pedido = await session.withTransaction(async () => Pedido.findOneAndUpdate(
        { _id: pedidoId, local: { $in: locales.map((l) => l._id) }, estado: "en_camino", "devolucion.estado": "pendiente" },
        { $set: { estado: "cancelado", canceladoPor: "devolucion", "devolucion.estado": "recibida", "devolucion.recibidaEn": new Date(), "devolucion.recibidaPor": req.usuario.id, reposicionStock: { estado: "pendiente" } }, $push: { historialEstados: { estado: "cancelado" } } },
        { new: true, session }
      ));
    } finally { await session.endSession(); }
    if (!pedido) return res.status(409).json({ mensaje: "No hay una devolución pendiente para este local" });
    avisar(req, pedidoId, pedido.estado);
    res.json({ mensaje: "Recepción confirmada. Revisa qué unidades pueden volver al inventario", pedido });
  } catch { res.status(500).json({ mensaje: "Error al confirmar la recepción" }); }
};
