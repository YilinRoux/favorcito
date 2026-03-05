import Pedido from "../models/Pedido.js";
import Producto from "../models/Producto.js";
import Local from "../models/Local.js";
import Usuario from "../models/Usuario.js";

export const crearPedido = async (req, res) => {
  try {
    const { productos, tipoEntrega } = req.body;
    const estudianteId = req.usuario.id;

    if (!productos || productos.length === 0) {
      return res.status(400).json({ mensaje: "Debe agregar al menos un producto" });
    }

    let total = 0;
    let productosFinal = [];
    let localId = null;

    for (let item of productos) {
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
    // Descontar stock
    for (let item of productosFinal) {
      await Producto.findByIdAndUpdate(item.producto, {
        $inc: { stock: -item.cantidad }
      });
    }

   const nuevoPedido = await Pedido.create({
  estudiante: estudianteId,
  local: localId,
  productos: productosFinal,
  total,
  costoEnvio,
  tipoEntrega,
  promocionAplicada,
  historialEstados: [{ estado: "enviado" }],
});

    res.status(201).json({ mensaje: "Pedido creado correctamente", pedido: nuevoPedido });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear pedido", error: error.message });
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

    if (nuevoEstadoIndex <= estadoActualIndex) {
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

    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) return res.status(404).json({ mensaje: "Pedido no encontrado" });

    if (pedido.tipoEntrega !== "favorcito" || pedido.estado !== "listo" || pedido.repartidor) {
      return res.status(400).json({ mensaje: "Este pedido no está disponible" });
    }

    pedido.repartidor = estudianteId;
    pedido.estado = "en_camino";
    pedido.historialEstados.push({ estado: "en_camino" });
    await pedido.save();

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

    pedido.estado = "cancelado";
    pedido.historialEstados.push({ estado: "cancelado" });
    pedido.canceladoPor = "estudiante";
    await pedido.save();

    // Regresar stock
    for (let item of pedido.productos) {
      await Producto.findByIdAndUpdate(item.producto, {
        $inc: { stock: item.cantidad }
      });
    }

    const usuario = await Usuario.findById(estudianteId);
    usuario.cancelaciones += 1;
    if (usuario.cancelaciones >= 3) usuario.sospechoso = true;
    await usuario.save();

    const io = req.app.get("io");
    io.to(pedidoId).emit("estadoActualizado", { estado: "cancelado" });

    return res.json({
      mensaje: "Pedido cancelado",
      cancelaciones: usuario.cancelaciones,
      sospechoso: usuario.sospechoso,
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al cancelar pedido", error: error.message });
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