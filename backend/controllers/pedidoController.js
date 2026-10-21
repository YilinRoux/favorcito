import Pedido from "../models/Pedido.js";
import Producto from "../models/Producto.js";
import Local from "../models/Local.js";
import Usuario from "../models/Usuario.js";

export const crearPedido = async (req, res) => {
  try {
    const { productos, tipoEntrega } = req.body;
    const estudianteId = req.usuario.id;

    if (!Array.isArray(productos) || productos.length === 0 || productos.length > 50) {
      return res.status(400).json({ mensaje: "Debe agregar al menos un producto" });
    }

    let total = 0;
    let productosFinal = [];
    let localId = null;

    const idsUnicos = new Set();
    for (let item of productos) {
      if (!item || !Number.isSafeInteger(item.cantidad) || item.cantidad <= 0 || !item.producto || idsUnicos.has(String(item.producto))) return res.status(400).json({ mensaje: "Productos o cantidades inválidos" });
      idsUnicos.add(String(item.producto));
      const productoDB = await Producto.findById(item.producto);

      if (!productoDB || !productoDB.activo) {
        return res.status(400).json({ mensaje: "Producto inválido" });
      }

      // Validar stock suficiente
      if (productoDB.stock < item.cantidad) {
        return res.status(400).json({ mensaje: `Stock insuficiente para ${productoDB.nombre}` });
      }

      if (!localId) {
        localId = productoDB.local.toString();
      } else if (localId !== productoDB.local.toString()) {
        return res.status(400).json({ mensaje: "Todos los productos deben ser del mismo local" });
      }

      total += productoDB.precio * item.cantidad;

      productosFinal.push({
        producto: productoDB._id,
        nombre: productoDB.nombre,
        precio: productoDB.precio,
        cantidad: item.cantidad,
      });
    }

    if (!["favorcito", "recoger"].includes(tipoEntrega)) return res.status(400).json({ mensaje: "Tipo de entrega inválido" });
    const local = await Local.findById(localId);
    if (!local || !local.aprobado) {
      return res.status(400).json({ mensaje: "Local no válido" });
    }

    let promocionAplicada = false;

if (
  tipoEntrega === "favorcito" &&
  local.promocionActiva &&
  total >= local.montoMinimoPromocion
) {
  promocionAplicada = true;
}

// 🔥 COSTO DE ENVÍO
const costoEnvio = tipoEntrega === "favorcito" ? 15 : 0;

// 🔥 SUMAR ENVÍO AL TOTAL
total += costoEnvio;
    // Una transacción impide ventas sin existencias y pedidos sin descuento de stock.
    const session = await Pedido.startSession();
    let nuevoPedido;
    try {
      await session.withTransaction(async () => {
        for (const item of productosFinal) {
          const resultado = await Producto.updateOne(
            { _id: item.producto, activo: true, stock: { $gte: item.cantidad } },
            { $inc: { stock: -item.cantidad } },
            { session }
          );
          if (resultado.modifiedCount !== 1) throw new Error("STOCK_INSUFICIENTE");
        }
        const creados = await Pedido.create([{
          estudiante: estudianteId, local: localId, productos: productosFinal,
          total, costoEnvio, tipoEntrega, promocionAplicada,
          historialEstados: [{ estado: "enviado" }],
        }], { session });
        nuevoPedido = creados[0];
      });
    } finally {
      await session.endSession();
    }

    res.status(201).json({ mensaje: "Pedido creado correctamente", pedido: nuevoPedido });
  } catch (error) {
    if (error.message === "STOCK_INSUFICIENTE") return res.status(409).json({ mensaje: "Stock insuficiente" });
    res.status(500).json({ mensaje: "Error al crear pedido" });
  }
};

export const obtenerPedidosVendedor = async (req, res) => {
  try {
    const vendedorId = req.usuario.id;
    const locales = await Local.find({ vendedor: vendedorId });
    const localesIds = locales.map((l) => l._id);

    const pedidos = await Pedido.find({ local: { $in: localesIds } })
      .populate("estudiante", "nombre_completo email cancelaciones sospechoso")
      .sort({ createdAt: -1 });

    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener pedidos", error: error.message });
  }
};

export const aceptarPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { tiempoEstimado } = req.body;
    const vendedorId = req.usuario.id;

    const pedido = await Pedido.findById(pedidoId).populate("local");
    if (!pedido) return res.status(404).json({ mensaje: "Pedido no encontrado" });

    if (pedido.local.vendedor.toString() !== vendedorId) {
      return res.status(403).json({ mensaje: "No autorizado" });
    }

    if (pedido.estado !== "enviado") {
      return res.status(400).json({ mensaje: "El pedido ya fue procesado" });
    }

    pedido.estado = "aceptado";
    pedido.tiempoEstimado = tiempoEstimado;
    pedido.historialEstados.push({ estado: "aceptado" });
    await pedido.save();

    const io = req.app.get("io");
    io.to(pedidoId).emit("estadoActualizado", { estado: "aceptado" });

    res.json({ mensaje: "Pedido aceptado correctamente", pedido });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al aceptar pedido", error: error.message });
  }
};

export const cambiarEstadoPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { nuevoEstado } = req.body;
    const vendedorId = req.usuario.id;

    const pedido = await Pedido.findById(pedidoId).populate("local");
    if (!pedido) return res.status(404).json({ mensaje: "Pedido no encontrado" });

    if (pedido.local.vendedor.toString() !== vendedorId) {
      return res.status(403).json({ mensaje: "No autorizado" });
    }

    if (["cancelado", "entregado"].includes(pedido.estado)) {
      return res.status(400).json({ mensaje: "No se puede modificar este pedido" });
    }

    const flujo = ["aceptado", "en_preparacion", "listo", "entregado"];
    const estadoActualIndex = flujo.indexOf(pedido.estado);
    const nuevoEstadoIndex = flujo.indexOf(nuevoEstado);

    if (nuevoEstadoIndex === -1 || nuevoEstadoIndex !== estadoActualIndex + 1) {
      return res.status(400).json({ mensaje: "Transición de estado inválida" });
    }

    pedido.estado = nuevoEstado;
    pedido.historialEstados.push({ estado: nuevoEstado });
    await pedido.save();

    const io = req.app.get("io");
    io.to(pedidoId).emit("estadoActualizado", { estado: nuevoEstado });

    res.json({ mensaje: "Estado actualizado", pedido });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al cambiar estado", error: error.message });
  }
};

export const verPedidosDisponiblesFavorcito = async (req, res) => {
  try {
    const pedidos = await Pedido.find({
      tipoEntrega: "favorcito",
      estado: "listo",
      repartidor: null,
    })
      .populate("local", "nombre direccion")
      .sort({ createdAt: -1 });

    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener pedidos disponibles", error: error.message });
  }
};

export const aceptarFavorcito = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const estudianteId = req.usuario.id;

    const pedido = await Pedido.findOneAndUpdate(
      { _id: pedidoId, tipoEntrega: "favorcito", estado: "listo", repartidor: null, estudiante: { $ne: estudianteId } },
      { $set: { repartidor: estudianteId, estado: "en_camino" }, $push: { historialEstados: { estado: "en_camino" } } },
      { new: true }
    );
    if (!pedido) return res.status(409).json({ mensaje: "Este pedido ya no está disponible" });

    const io = req.app.get("io");
    io.to(pedidoId).emit("estadoActualizado", { estado: "en_camino" });

    res.json({ mensaje: "Pedido aceptado como favorcito", pedido });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al aceptar pedido", error: error.message });
  }
};

export const confirmarEntrega = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const estudianteId = req.usuario.id;

    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) return res.status(404).json({ mensaje: "Pedido no encontrado" });

    if (pedido.repartidor?.toString() !== estudianteId || pedido.estado !== "en_camino") {
      return res.status(403).json({ mensaje: "No autorizado" });
    }

    pedido.estado = "entregado";
    pedido.historialEstados.push({ estado: "entregado" });
    await pedido.save();

    const io = req.app.get("io");
    io.to(pedidoId.toString()).emit("estadoActualizado", { estado: "entregado" });

    res.json({ mensaje: "Pedido entregado correctamente", pedido });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al confirmar entrega", error: error.message });
  }
};

export const cancelarPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const estudianteId = req.usuario.id;

    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) return res.status(404).json({ mensaje: "Pedido no encontrado" });

    if (pedido.estudiante.toString() !== estudianteId) {
      return res.status(403).json({ mensaje: "No autorizado" });
    }

    if (pedido.estado !== "enviado") {
      return res.status(400).json({
        mensaje: "Ya no puedes cancelar este pedido. Contacta al vendedor por el chat.",
      });
    }

    const session = await Pedido.startSession();
    let usuario;
    try {
      await session.withTransaction(async () => {
        const actualizado = await Pedido.findOneAndUpdate(
          { _id: pedidoId, estudiante: estudianteId, estado: "enviado" },
          { $set: { estado: "cancelado", canceladoPor: "estudiante" },
            $push: { historialEstados: { estado: "cancelado" } } },
          { new: true, session }
        );
        if (!actualizado) throw new Error("CANCELACION_NO_DISPONIBLE");
        for (const item of actualizado.productos) {
          await Producto.updateOne({ _id: item.producto }, { $inc: { stock: item.cantidad } }, { session });
        }
        usuario = await Usuario.findByIdAndUpdate(
          estudianteId, { $inc: { cancelaciones: 1 } }, { new: true, session }
        );
        if (usuario.cancelaciones >= 3) {
          await Usuario.updateOne({ _id: estudianteId }, { $set: { sospechoso: true } }, { session });
          usuario.sospechoso = true;
        }
      });
    } finally {
      await session.endSession();
    }

    const io = req.app.get("io");
    io.to(pedidoId).emit("estadoActualizado", { estado: "cancelado" });

    return res.json({
      mensaje: "Pedido cancelado",
      cancelaciones: usuario.cancelaciones,
      sospechoso: usuario.sospechoso,
    });
  } catch (error) {
    if (error.message === "CANCELACION_NO_DISPONIBLE") return res.status(409).json({ mensaje: "El pedido ya no se puede cancelar" });
    res.status(500).json({ mensaje: "Error al cancelar pedido" });
  }
};

export const obtenerMisPedidos = async (req, res) => {
  try {
    const estudianteId = req.usuario.id;
    const pedidos = await Pedido.find({ estudiante: estudianteId })
      .populate("local", "nombre")
      .sort({ createdAt: -1 });

    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener pedidos", error: error.message });
  }
};

export const obtenerPedidosFavorcito = async (req, res) => {
  try {
    const repartidorId = req.usuario.id;
    const pedidos = await Pedido.find({ repartidor: repartidorId })
      .populate("local", "nombre")
      .sort({ createdAt: -1 });

    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener entregas", error: error.message });
  }
};

export const obtenerPedidoPorId = async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id)
      .populate("local", "nombre direccion")
      .populate("estudiante", "nombre_completo");

    if (!pedido) return res.status(404).json({ mensaje: "Pedido no encontrado" });

    const id = String(req.usuario._id);
    const esEstudiante = String(pedido.estudiante?._id || pedido.estudiante) === id;
    const esRepartidor = pedido.repartidor && String(pedido.repartidor) === id;
    const local = await Local.findById(pedido.local?._id || pedido.local).select("vendedor");
    const esVendedor = local && String(local.vendedor) === id;
    if (!esEstudiante && !esRepartidor && !esVendedor && req.usuario.rol !== "admin") return res.status(403).json({ mensaje: "No autorizado" });
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener pedido", error: error.message });
  }
};

export const cancelarPedidoVendedor = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const vendedorId = req.usuario.id;

    const pedido = await Pedido.findById(pedidoId).populate("local");
    if (!pedido) return res.status(404).json({ mensaje: "Pedido no encontrado" });

    if (pedido.local.vendedor.toString() !== vendedorId) {
      return res.status(403).json({ mensaje: "No autorizado" });
    }

    if (["cancelado", "entregado"].includes(pedido.estado)) {
      return res.status(400).json({ mensaje: "No se puede cancelar este pedido" });
    }

    pedido.estado = "cancelado";
    pedido.historialEstados.push({ estado: "cancelado" });
    pedido.canceladoPor = "vendedor";
    await pedido.save();

    // Regresar stock
    for (let item of pedido.productos) {
      await Producto.findByIdAndUpdate(item.producto, {
        $inc: { stock: item.cantidad }
      });
    }

    const usuario = await Usuario.findById(pedido.estudiante);
    usuario.cancelaciones += 1;
    if (usuario.cancelaciones >= 3) usuario.sospechoso = true;
    await usuario.save();

    const io = req.app.get("io");
    io.to(pedidoId).emit("estadoActualizado", { estado: "cancelado" });

    res.json({ mensaje: "Pedido cancelado por vendedor", pedido });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al cancelar pedido", error: error.message });
  }
};