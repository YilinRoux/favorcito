import Local from "../models/Local.js";
import { enviarNotificacionLocal } from "../services/emailService.js";

// Crear solicitud de local (solo vendedor)
export const crearLocal = async (req, res) => {
  try {
    const { nombre, descripcion, direccion } = req.body;

    const fotos = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    const nuevoLocal = new Local({
      nombre,
      descripcion,
      direccion,
      fotos,
      vendedor: req.usuario._id,
    });

    await nuevoLocal.save();

    res.status(201).json({
      mensaje: "Solicitud de local enviada para aprobación",
      local: nuevoLocal,
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear local", error: error.message });
  }
};

// ⭐ CALIFICAR LOCAL
export const calificarLocal = async (req, res) => {
  try {
    const { estrellas } = req.body;

    if (estrellas < 1 || estrellas > 5) {
      return res.status(400).json({ mensaje: "Las estrellas deben estar entre 1 y 5" });
    }

    const local = await Local.findById(req.params.id);
    if (!local) return res.status(404).json({ mensaje: "Local no encontrado" });

    const yaCalifico = local.calificaciones.find(
      (c) => c.usuario.toString() === req.usuario.id
    );

    if (yaCalifico) {
      yaCalifico.estrellas = estrellas;
    } else {
      local.calificaciones.push({
        usuario: req.usuario.id,
        estrellas,
      });
    }

    local.totalCalificaciones = local.calificaciones.length;

    // FIX: typo corregido (era "jscalificacionPromedio")
    local.calificacionPromedio =
      local.calificaciones.reduce((acc, item) => acc + item.estrellas, 0) /
      local.totalCalificaciones;

    await local.save();

    res.json({ mensaje: "Calificación guardada correctamente" });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al calificar",
      error: error.message,
    });
  }
};

// ⭐ COMENTAR LOCAL
export const comentarLocal = async (req, res) => {
  try {
    const { texto } = req.body;

    if (!texto || texto.trim() === "") {
      return res.status(400).json({ mensaje: "El comentario no puede estar vacío" });
    }

    const local = await Local.findById(req.params.id);
    if (!local) return res.status(404).json({ mensaje: "Local no encontrado" });

    local.comentarios.push({
      usuario: req.usuario.id,
      texto,
    });

    await local.save();

    res.json({ mensaje: "Comentario agregado correctamente" });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al comentar",
      error: error.message,
    });
  }
};

// Aprobar o rechazar local (solo admin)
export const aprobarLocal = async (req, res) => {
  try {
    const { id } = req.params;
    const { aprobado } = req.body;

    const local = await Local.findById(id).populate("vendedor", "email nombre_completo");
    if (!local) return res.status(404).json({ mensaje: "Local no encontrado" });

    local.aprobado = aprobado;
    // Si se rechaza guardamos el estado explícitamente para distinguirlo de "pendiente"
    local.rechazado = !aprobado && aprobado !== undefined ? true : false;
    await local.save();

    // Enviar correo al vendedor
    try {
      await enviarNotificacionLocal(local.vendedor.email, local.nombre, aprobado);
    } catch (emailErr) {
      console.error("❌ Error enviando correo al vendedor:", emailErr.message);
      // No detenemos el flujo si el correo falla
    }

    res.json({
      mensaje: aprobado ? "Local aprobado correctamente" : "Local rechazado",
      local,
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar local", error: error.message });
  }
};
// Obtener locales aprobados (público)
export const obtenerLocales = async (req, res) => {
  try {
    const locales = await Local.find({
      aprobado: true,
      activo: true,
    }).populate("vendedor", "nombre_completo");

    res.json(locales);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener locales",
      error: error.message,
    });
  }
};

// Obtener local del vendedor logueado
export const obtenerMiLocal = async (req, res) => {
  try {
    const local = await Local.findOne({ vendedor: req.usuario._id });

    if (!local) {
      return res.status(404).json({ mensaje: "No tienes un local registrado" });
    }

    res.json(local);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener local", error: error.message });
  }
};

export const obtenerPendientes = async (req, res) => {
  try {
    const locales = await Local.find({ aprobado: false })
      .populate("vendedor", "nombre_completo email");

    res.json(locales);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener pendientes", error: error.message });
  }
};

export const obtenerLocalPorId = async (req, res) => {
  try {
    const local = await Local.findById(req.params.id)
      .populate("vendedor", "nombre_completo email")
      .populate("comentarios.usuario", "nombre_completo")
      .populate("calificaciones.usuario", "nombre_completo");

    if (!local) return res.status(404).json({ mensaje: "Local no encontrado" });

    res.json(local);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener local", error: error.message });
  }
};

export const actualizarPromocion = async (req, res) => {
  try {
    const { promocionActiva, montoMinimoPromocion, anuncio } = req.body;

    const local = await Local.findOne({ vendedor: req.usuario._id });
    if (!local) return res.status(404).json({ mensaje: "Local no encontrado" });

    if (promocionActiva !== undefined) local.promocionActiva = promocionActiva;
    if (montoMinimoPromocion !== undefined) local.montoMinimoPromocion = montoMinimoPromocion;
    if (anuncio !== undefined) local.anuncio = anuncio;

    if (req.files && req.files.length > 0) {
      const nuevasImagenes = req.files.map((f) => `/uploads/${f.filename}`);
      local.imagenesAnuncios = [...(local.imagenesAnuncios || []), ...nuevasImagenes];
    }

    await local.save();

    res.json({ mensaje: "Configuración actualizada", local });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar", error: error.message });
  }
};

export const eliminarImagenAnuncio = async (req, res) => {
  try {
    const { imagen } = req.body;

    const local = await Local.findOne({ vendedor: req.usuario._id });
    if (!local) return res.status(404).json({ mensaje: "Local no encontrado" });

    local.imagenesAnuncios = local.imagenesAnuncios.filter((img) => img !== imagen);
    await local.save();

    res.json({ mensaje: "Imagen eliminada", local });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar imagen", error: error.message });
  }
};

export const obtenerLocalPublico = async (req, res) => {
  try {
    const local = await Local.findById(req.params.id);
    if (!local || !local.aprobado) return res.status(404).json({ mensaje: "Local no encontrado" });
    res.json(local);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener local", error: error.message });
  }
};