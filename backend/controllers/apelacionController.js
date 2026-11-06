import Apelacion from "../models/Apelacion.js";
import Usuario from "../models/Usuario.js";

export const crearApelacion = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const nombre = String(req.body?.nombre || "").trim();
    const motivo = String(req.body?.motivo || "").trim();

    if (!email || !nombre || !motivo) {
      return res.status(400).json({ mensaje: "Todos los campos son requeridos" });
    }
    if (nombre.length > 100 || motivo.length > 2000) {
      return res.status(400).json({ mensaje: "Datos de apelación inválidos" });
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    if (usuario.activo) return res.status(400).json({ mensaje: "Tu cuenta no está suspendida" });

    const apelacionExistente = await Apelacion.findOne({ email, estado: "pendiente" });
    if (apelacionExistente) return res.status(400).json({ mensaje: "Ya tienes una apelación pendiente" });

    const apelacion = await Apelacion.create({ email, nombre, motivo, usuario: usuario._id });
    res.status(201).json({ mensaje: "Apelación enviada correctamente", apelacion });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear apelación" });
  }
};

export const obtenerApelaciones = async (req, res) => {
  try {
    const apelaciones = await Apelacion.find().populate("usuario", "nombre_completo email activo cancelaciones").sort({ createdAt: -1 });
    res.json(apelaciones);
  } catch {
    res.status(500).json({ mensaje: "Error al obtener apelaciones" });
  }
};

export const resolverApelacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body;
    if (!["aprobada", "rechazada"].includes(decision)) {
      return res.status(400).json({ mensaje: "Decisión inválida" });
    }
    const apelacion = await Apelacion.findById(id);
    if (!apelacion) return res.status(404).json({ mensaje: "Apelación no encontrada" });

    apelacion.estado = decision;
    await apelacion.save();

    if (decision === "aprobada") {
      await Usuario.findByIdAndUpdate(apelacion.usuario, { activo: true, sospechoso: false, cancelaciones: 0 });
    }
    res.json({ mensaje: `Apelación ${decision}` });
  } catch {
    res.status(500).json({ mensaje: "Error al resolver apelación" });
  }
};
