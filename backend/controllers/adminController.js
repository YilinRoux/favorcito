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

// 🔹 Data Mining: patrones agregados de todo el sistema (productos, categorías,
// horarios y días con más demanda). Alimenta el dashboard de admin y, a futuro,
// sirve de base para el modelo de predicción de demanda (Machine Learning).
export const obtenerInsightsDataMining = async (req, res) => {
  try {
    // 1. Productos más vendidos (unidades totales en pedidos entregados)
    const productosMasVendidos = await Pedido.aggregate([
      { $match: { estado: "entregado" } },
      { $unwind: "$productos" },
      {
        $group: {
          _id: "$productos.producto",
          nombre: { $first: "$productos.nombre" },
          unidadesVendidas: { $sum: "$productos.cantidad" },
        },
      },
      { $sort: { unidadesVendidas: -1 } },
      { $limit: 5 },
    ]);

    // 2. Categorías más populares (join con Producto para conocer su categoría)
    const categoriasPopulares = await Pedido.aggregate([
      { $match: { estado: "entregado" } },
      { $unwind: "$productos" },
      {
        $lookup: {
          from: "productos",
          localField: "productos.producto",
          foreignField: "_id",
          as: "productoInfo",
        },
      },
      { $unwind: "$productoInfo" },
      {
        $group: {
          _id: "$productoInfo.categoria",
          unidadesVendidas: { $sum: "$productos.cantidad" },
        },
      },
      { $sort: { unidadesVendidas: -1 } },
    ]);

    // 3. Horarios pico: mismos buckets que usamos en el onboarding
    // (mañana 6-12, mediodía 12-18, tarde 18-6) para poder cruzar ambos datasets
    const horariosPico = await Pedido.aggregate([
      { $project: { hora: { $hour: "$createdAt" } } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $and: [{ $gte: ["$hora", 6] }, { $lt: ["$hora", 12] }] }, then: "manana" },
                { case: { $and: [{ $gte: ["$hora", 12] }, { $lt: ["$hora", 18] }] }, then: "mediodia" },
              ],
              default: "tarde",
            },
          },
          totalPedidos: { $sum: 1 },
        },
      },
      { $sort: { totalPedidos: -1 } },
    ]);

    // 4. Día de la semana con más pedidos
    const diasPopulares = await Pedido.aggregate([
      { $group: { _id: { $dayOfWeek: "$createdAt" }, totalPedidos: { $sum: 1 } } },
      { $sort: { totalPedidos: -1 } },
    ]);
    const nombresDias = ["", "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const diasFormateados = diasPopulares.map((d) => ({
      dia: nombresDias[d._id],
      totalPedidos: d.totalPedidos,
    }));

    res.json({
      productosMasVendidos,
      categoriasPopulares,
      horariosPico,
      diasPopulares: diasFormateados,
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener insights", error: error.message });
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