import Apelacion from "../models/Apelacion.js";
import Usuario from "../models/Usuario.js";

export const crearApelacion = async (req, res) => {
  try {
    const { email, nombre, motivo } = req.body;

    if (!email || !nombre || !motivo) {
      return res.status(400).json({ mensaje: "Todos los campos son requeridos" });
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    if (usuario.activo) {
      return res.status(400).json({ mensaje: "Tu cuenta no está suspendida" });
    }

    // Verificar que no tenga apelación pendiente
    const apelacionExistente = await Apelacion.findOne({ email, estado: "pendiente" });
    if (apelacionExistente) {
      return res.status(400).json({ mensaje: "Ya tienes una apelación pendiente" });
    }

    const apelacion = await Apelacion.create({ email, nombre, motivo, usuario: usuario._id });

    res.status(201).json({ mensaje: "Apelación enviada correctamente", apelacion });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear apelación", error: error.message });
  }
};

export const obtenerApelaciones = async (req, res) => {
  try {
    const apelaciones = await Apelacion.find()
      .populate("usuario", "nombre_completo email activo cancelaciones")
      .sort({ createdAt: -1 });
    res.json(apelaciones);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener apelaciones", error: error.message });
  }
};

export const resolverApelacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body; // "aprobada" o "rechazada"

    const apelacion = await Apelacion.findById(id);
    if (!apelacion) return res.status(404).json({ mensaje: "Apelación no encontrada" });

    apelacion.estado = decision;
    await apelacion.save();

    // Si se aprueba, reactivar usuario
    if (decision === "aprobada") {
      await Usuario.findByIdAndUpdate(apelacion.usuario, {
        activo: true,
        sospechoso: false,
        cancelaciones: 0,
      });
    }

    res.json({ mensaje: `Apelación ${decision}` });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al resolver apelación", error: error.message });
  }
};