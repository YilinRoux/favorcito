import Usuario from "../models/Usuario.js";
import { CATEGORIAS } from "../config/categorias.js";

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
    res.status(500).json({ mensaje: "Error al obtener usuarios sospechosos", error: error.message });
  }
};

export const suspenderUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    usuario.activo = false;
    await usuario.save();

    res.json({ mensaje: "Usuario suspendido correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al suspender usuario", error: error.message });
  }
};

export const reactivarUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    usuario.activo = true;
    usuario.sospechoso = false;
    usuario.cancelaciones = 0;
    await usuario.save();

    res.json({ mensaje: "Usuario reactivado correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al reactivar usuario", error: error.message });
  }
};

export const guardarPreferencias = async (req, res) => {
  try {
    const { preferencias } = req.body;

    if (!Array.isArray(preferencias) || preferencias.length === 0) {
      return res.status(400).json({ mensaje: "Debes seleccionar al menos una categoría" });
    }

    const invalidas = preferencias.filter((c) => !CATEGORIAS.includes(c));
    if (invalidas.length > 0) {
      return res.status(400).json({ mensaje: "Categorías inválidas", invalidas });
    }

    const usuario = await Usuario.findById(req.usuario._id);
    usuario.preferencias = preferencias;
    usuario.onboardingCompletado = true;
    await usuario.save();

    res.json({ mensaje: "Preferencias guardadas correctamente", preferencias: usuario.preferencias });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al guardar preferencias", error: error.message });
  }
};

export const obtenerPreferencias = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id);
    res.json({
      preferencias: usuario.preferencias,
      onboardingCompletado: usuario.onboardingCompletado,
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener preferencias", error: error.message });
  }
};