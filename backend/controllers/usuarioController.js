import Usuario from "../models/Usuario.js";

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