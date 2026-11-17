import mongoose from "mongoose";
import Pedido from "../models/Pedido.js";
import Producto from "../models/Producto.js";
import Local from "../models/Local.js";

export const obtenerReposicionesPendientes = async (req, res) => {
  try {
    const locales = await Local.find({ vendedor: req.usuario.id }).select("_id");
    const pedidos = await Pedido.find({
      local: { $in: locales.map((l) => l._id) }, estado: "cancelado", "reposicionStock.estado": "pendiente",
    }).select("alias productos createdAt updatedAt canceladoPor reposicionStock").sort({ updatedAt: 1 });
    res.json(pedidos);
  } catch {
    res.status(500).json({ mensaje: "Error al consultar las reposiciones" });
  }
};

export const resolverReposicion = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const cantidades = req.body.cantidades;
    if (!mongoose.isValidObjectId(pedidoId) || !Array.isArray(cantidades) || cantidades.some((n) => !Number.isSafeInteger(n) || n < 0)) {
      return res.status(400).json({ mensaje: "Indica cantidades enteras válidas para reponer" });
    }
    const locales = await Local.find({ vendedor: req.usuario.id }).select("_id");
    const session = await Pedido.startSession();
    let resultado;
    try {
      resultado = await session.withTransaction(async () => {
        const pedido = await Pedido.findOne({ _id: pedidoId, local: { $in: locales.map((l) => l._id) } }).session(session);
        if (!pedido) return { status: 404, mensaje: "Pedido no encontrado" };
        if (pedido.estado !== "cancelado" || pedido.reposicionStock?.estado !== "pendiente") {
          return { status: 409, mensaje: "La reposición no está pendiente o ya fue revisada" };
        }
        if (cantidades.length !== pedido.productos.length || cantidades.some((n, i) => n > pedido.productos[i].cantidad)) {
          return { status: 400, mensaje: "Las cantidades no coinciden con los productos cancelados" };
        }
        // Reclamar la decisión dentro de la misma transacción impide reponer dos veces.
        const actualizado = await Pedido.findOneAndUpdate(
          { _id: pedidoId, estado: "cancelado", "reposicionStock.estado": "pendiente" },
          { $set: { reposicionStock: { estado: "resuelta", cantidades, revisadoPor: req.usuario.id, revisadoEn: new Date() } } },
          { new: true, session }
        );
        if (!actualizado) throw new Error("REPOSICION_RESUELTA");
        for (const [i, item] of pedido.productos.entries()) {
          if (!cantidades[i]) continue;
          const cambio = await Producto.updateOne(
            { _id: item.producto, local: pedido.local }, { $inc: { stock: cantidades[i] } }, { session }
          );
          if (cambio.matchedCount !== 1) throw new Error("PRODUCTO_NO_DISPONIBLE");
        }
        return { status: 200, mensaje: "Decisión de inventario guardada", repuestas: cantidades.reduce((a, n) => a + n, 0) };
      });
    } finally { await session.endSession(); }
    res.status(resultado.status).json(resultado);
  } catch (error) {
    if (error.message === "PRODUCTO_NO_DISPONIBLE") return res.status(409).json({ mensaje: "Un producto ya no existe en este local. Revisa las cantidades; indica 0 para no reponerlo." });
    if (error.message === "REPOSICION_RESUELTA") return res.status(409).json({ mensaje: "Otra persona ya revisó esta reposición" });
    res.status(500).json({ mensaje: "Error al guardar la decisión de inventario" });
  }
};
