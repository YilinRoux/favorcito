import Producto from "../models/Producto.js";
import Local from "../models/Local.js";
import Pedido from "../models/Pedido.js";
import { CATEGORIAS } from "../config/categorias.js";

export const crearProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, localId, categoria } = req.body;

    const local = await Local.findById(localId);

    if (!local) {
      return res.status(404).json({ mensaje: "Local no encontrado" });
    }

    if (!local.aprobado) {
      return res.status(400).json({
        mensaje: "El local aún no está aprobado",
      });
    }

    if (local.vendedor.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        mensaje: "No puedes agregar productos a este local",
      });
    }

    const imagen = req.file ? `/uploads/${req.file.filename}` : "";

    const nuevoProducto = new Producto({
      nombre,
      descripcion,
      precio,
      stock,
      imagen,
      local: localId,
      categoria, // si no se manda, usa el default "Otro"
    });

    await nuevoProducto.save();

    res.status(201).json({
      mensaje: "Producto creado correctamente",
      producto: nuevoProducto,
    });

  } catch (error) {
    res.status(500).json({
      mensaje: "Error al crear producto",
      error: error.message,
    });
  }
};

export const obtenerProductosPorLocal = async (req, res) => {
  try {
    const { localId } = req.params;

    const productos = await Producto.find({
      local: localId,
      activo: true,
    });

    res.json(productos);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener productos",
      error: error.message,
    });
  }
};

export const editarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, categoria } = req.body;

    const producto = await Producto.findById(id).populate("local");

    if (!producto) return res.status(404).json({ mensaje: "Producto no encontrado" });

    if (producto.local.vendedor.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ mensaje: "No autorizado" });
    }

    if (nombre) producto.nombre = nombre;
    if (descripcion) producto.descripcion = descripcion;
    if (precio) producto.precio = precio;
    if (stock) producto.stock = stock;
    if (req.file) producto.imagen = `/uploads/${req.file.filename}`;
    if (categoria) producto.categoria = categoria;

    await producto.save();

    res.json({ mensaje: "Producto actualizado", producto });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al editar producto", error: error.message });
  }
};

export const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findById(id).populate("local");

    if (!producto) return res.status(404).json({ mensaje: "Producto no encontrado" });

    if (producto.local.vendedor.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ mensaje: "No autorizado" });
    }

    producto.activo = false;
    await producto.save();

    res.json({ mensaje: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar producto", error: error.message });
  }
};

export const toggleProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findById(id).populate("local");

    if (!producto) return res.status(404).json({ mensaje: "Producto no encontrado" });

    if (producto.local.vendedor.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ mensaje: "No autorizado" });
    }

    producto.activo = !producto.activo;
    await producto.save();

    res.json({ mensaje: `Producto ${producto.activo ? "activado" : "desactivado"}`, producto });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al cambiar estado", error: error.message });
  }
};

export const obtenerCategorias = (req, res) => {
  res.json({ categorias: CATEGORIAS });
};

export const obtenerProductosRecomendados = async (req, res) => {
  try {
    const preferencias = req.usuario.preferencias || [];

    // Data Mining: contar cuántas veces se ha pedido cada producto
    const popularidad = await Pedido.aggregate([
      { $unwind: "$productos" },
      {
        $group: {
          _id: "$productos.producto",
          totalPedido: { $sum: "$productos.cantidad" },
        },
      },
    ]);

    const mapaPopularidad = {};
    popularidad.forEach((p) => {
      mapaPopularidad[p._id.toString()] = p.totalPedido;
    });

    const productos = await Producto.find({ activo: true }).populate("local");

    const productosConScore = productos.map((producto) => {
      const esFavorito = preferencias.includes(producto.categoria);
      const popularidadProducto = mapaPopularidad[producto._id.toString()] || 0;
      // Bonus fuerte si coincide con preferencia + suma de popularidad real
      const score = (esFavorito ? 1000 : 0) + popularidadProducto;
      return { producto, score };
    });

    productosConScore.sort((a, b) => b.score - a.score);

    res.json(productosConScore.map((p) => p.producto));
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener recomendaciones",
      error: error.message,
    });
  }
};