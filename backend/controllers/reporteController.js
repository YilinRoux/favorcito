import Reporte from "../models/Reporte.js";
import Usuario from "../models/Usuario.js";

export const crearReporte = async (req, res) => {
  try {
    const { tipoReportado, localReportado, estudianteReportado, motivo, descripcion } = req.body;
    const reportante = req.usuario._id;

    if (tipoReportado === "local" && !localReportado) {
      return res.status(400).json({ mensaje: "Debes indicar el local reportado" });
    }

    if (tipoReportado === "estudiante" && !estudianteReportado) {
      return res.status(400).json({ mensaje: "Debes indicar el estudiante reportado" });
    }

    const reporte = await Reporte.create({
      reportante,
      tipoReportado,
      localReportado: tipoReportado === "local" ? localReportado : undefined,
      estudianteReportado: tipoReportado === "estudiante" ? estudianteReportado : undefined,
      motivo,
      descripcion,
    });

    res.status(201).json({ mensaje: "Reporte enviado correctamente", reporte });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear reporte", error: error.message });
  }
};

export const obtenerReportes = async (req, res) => {
  try {
    const reportes = await Reporte.find()
      .populate("reportante", "nombre_completo email rol")
      .populate("localReportado", "nombre")
      .populate("estudianteReportado", "nombre_completo email")
      .sort({ createdAt: -1 });

    res.json(reportes);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener reportes", error: error.message });
  }
};

export const resolverReporte = async (req, res) => {
  try {
    const { id } = req.params;

    const reporte = await Reporte.findById(id);
    if (!reporte) return res.status(404).json({ mensaje: "Reporte no encontrado" });

    reporte.estado = "resuelto";
    await reporte.save();

    // Si el reportado es estudiante, sumar cancelacion y marcar sospechoso
    if (reporte.tipoReportado === "estudiante" && reporte.estudianteReportado) {
      const usuario = await Usuario.findById(reporte.estudianteReportado);
      if (usuario) {
        usuario.cancelaciones += 1;
        if (usuario.cancelaciones >= 3) {
          usuario.sospechoso = true;
        }
        await usuario.save();
      }
    }

    res.json({ mensaje: "Reporte resuelto" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al resolver reporte", error: error.message });
  }
};