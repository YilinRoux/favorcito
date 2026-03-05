import Usuario from "../models/Usuario.js";
import Local from "../models/Local.js";
import Pedido from "../models/Pedido.js";

export const obtenerResumen = async (req, res) => {
  try {
    const totalUsuarios = await Usuario.countDocuments();
    const totalLocales = await Local.countDocuments();
    const localesPendientes = await Local.countDocuments({ aprobado: false });
    const totalPedidos = await Pedido.countDocuments();

    res.json({
      totalUsuarios,
      totalLocales,
      localesPendientes,
      totalPedidos,
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener resumen", error: error.message });
  }
};

export const obtenerEstadisticas = async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const pedidosHoy = await Pedido.countDocuments({ createdAt: { $gte: hoy } });

    const totalGenerado = await Pedido.aggregate([
      { $match: { estado: "entregado" } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);

    const localMasVentas = await Pedido.aggregate([
      { $group: { _id: "$local", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 1 },
      { $lookup: { from: "locals", localField: "_id", foreignField: "_id", as: "local" } },
      { $unwind: "$local" }
    ]);

    res.json({
      pedidosHoy,
      totalGenerado: totalGenerado[0]?.total || 0,
      localMasVentas: localMasVentas[0]?.local?.nombre || "Sin datos",
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener estadísticas", error: error.message });
  }
};
export const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener usuarios", error: error.message });
  }
};

export const obtenerUsuariosSospechosos = async (req, res) => {
  try {
    const usuarios = await Usuario.find({ sospechoso: true })
      .select("-password")
      .sort({ cancelaciones: -1 });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener sospechosos", error: error.message });
  }
};

export const suspenderUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findById(id);
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    usuario.activo = false;
    await usuario.save();

    res.json({ mensaje: "Usuario suspendido", usuario });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al suspender usuario", error: error.message });
  }
};

export const reactivarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findById(id);
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    usuario.activo = true;
    usuario.sospechoso = false;
    usuario.cancelaciones = 0;
    await usuario.save();

    res.json({ mensaje: "Usuario reactivado", usuario });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al reactivar usuario", error: error.message });
  }
};