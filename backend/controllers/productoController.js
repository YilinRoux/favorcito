import Producto from "../models/Producto.js";
import Local from "../models/Local.js";

export const crearProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, localId } = req.body;

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
    const { nombre, descripcion, precio, stock } = req.body;

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