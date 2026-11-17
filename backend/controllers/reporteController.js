import mongoose from "mongoose";
import Reporte from "../models/Reporte.js";
import Usuario from "../models/Usuario.js";
import Pedido from "../models/Pedido.js";
import Local from "../models/Local.js";
import { aplicarFalta, evaluarReportePedido } from "../services/sanciones.js";

const MOTIVOS_GENERALES = [
  "mal_servicio",
  "producto_en_mal_estado",
  "cancelacion_injustificada",
  "comportamiento_inapropiado",
  "otro",
];

const limpiarDescripcion = (valor) => (typeof valor === "string" ? valor.trim().slice(0, 500) : "");

/** Reportes generales: vendedor -> estudiante y estudiante -> local. */
export const crearReporte = async (req, res) => {
  try {
    const { tipoReportado, localReportado, estudianteReportado, motivo, descripcion } = req.body;
    const reportante = req.usuario._id;

    if (!MOTIVOS_GENERALES.includes(motivo)) {
      return res.status(400).json({ mensaje: "Motivo inválido" });
    }

    if (tipoReportado === "local") {
      if (!mongoose.isValidObjectId(localReportado)) {
        return res.status(400).json({ mensaje: "Debes indicar el local reportado" });
      }
      const pidioAhi = await Pedido.exists({ estudiante: reportante, local: localReportado });
      if (!pidioAhi) return res.status(403).json({ mensaje: "Solo puedes reportar locales donde hiciste un pedido" });
    } else if (tipoReportado === "estudiante") {
      if (!mongoose.isValidObjectId(estudianteReportado)) {
        return res.status(400).json({ mensaje: "Debes indicar el estudiante reportado" });
      }
      if (String(estudianteReportado) === String(reportante)) {
        return res.status(400).json({ mensaje: "No puedes reportarte a ti mismo" });
      }
      const local = req.usuario.rol === "vendedor" ? await Local.findOne({ vendedor: reportante }).select("_id") : null;
      const atendido = local && (await Pedido.exists({ local: local._id, estudiante: estudianteReportado }));
      if (!atendido) {
        return res.status(403).json({ mensaje: "Para reportar a otro estudiante hazlo desde el pedido correspondiente" });
      }
    } else {
      return res.status(400).json({ mensaje: "Tipo de reporte inválido" });
    }

    const objetivo = tipoReportado === "local" ? { localReportado } : { estudianteReportado };
    const reciente = await Reporte.exists({
      reportante,
      ...objetivo,
      motivo,
      estado: "pendiente",
      createdAt: { $gte: new Date(Date.now() - 24 * 36e5) },
    });
    if (reciente) return res.status(409).json({ mensaje: "Ya enviaste un reporte igual; la administración lo revisará" });

    const reporte = await Reporte.create({
      reportante,
      tipoReportado,
      ...objetivo,
      motivo,
      descripcion: limpiarDescripcion(descripcion),
    });

    res.status(201).json({ mensaje: "Reporte enviado correctamente", reporte });
  } catch {
    res.status(500).json({ mensaje: "Error al crear reporte" });
  }
};

/** Reporte ligado a un pedido Favorcito: repartidor <-> cliente. */
export const crearReportePedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { motivo, descripcion } = req.body;
    if (!mongoose.isValidObjectId(pedidoId)) return res.status(400).json({ mensaje: "Pedido inválido" });

    const pedido = await Pedido.findById(pedidoId).select(
      "estudiante repartidor tipoEntrega estado historialEstados updatedAt"
    );
    const evaluacion = evaluarReportePedido({ pedido, usuarioId: req.usuario._id, motivo });
    if (!evaluacion.ok) return res.status(evaluacion.status).json({ mensaje: evaluacion.mensaje });

    const reporte = await Reporte.create({
      reportante: req.usuario._id,
      tipoReportado: "estudiante",
      estudianteReportado: evaluacion.reportadoId,
      pedido: pedido._id,
      contexto: evaluacion.contexto,
      motivo,
      descripcion: limpiarDescripcion(descripcion),
    });

    res.status(201).json({ mensaje: "Reporte enviado. La administración lo revisará.", reporteId: reporte._id });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ mensaje: "Ya reportaste este pedido" });
    res.status(500).json({ mensaje: "Error al crear reporte" });
  }
};

export const miReportePedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    if (!mongoose.isValidObjectId(pedidoId)) return res.status(400).json({ mensaje: "Pedido inválido" });
    const existe = await Reporte.exists({ pedido: pedidoId, reportante: req.usuario._id });
    res.json({ reportado: Boolean(existe) });
  } catch {
    res.status(500).json({ mensaje: "Error al consultar reporte" });
  }
};

export const obtenerReportes = async (req, res) => {
  try {
    const reportes = await Reporte.find()
      .populate("reportante", "nombre_completo email rol faltas reportesImprocedentes")
      .populate("localReportado", "nombre")
      .populate("estudianteReportado", "nombre_completo email faltas sospechoso activo bloqueoPorPago")
      .populate("pedido", "total tipoEntrega createdAt")
      .sort({ createdAt: -1 })
      .limit(500);

    res.json(reportes);
  } catch {
    res.status(500).json({ mensaje: "Error al obtener reportes" });
  }
};

/** El administrador decide si el reporte es procedente (suma falta) o improcedente. */
export const resolverReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ mensaje: "Reporte inválido" });
    if (!["procedente", "improcedente"].includes(decision)) {
      return res.status(400).json({ mensaje: "Decisión inválida" });
    }

    // Transición atómica: dos administradores no pueden resolver el mismo reporte.
    const reporte = await Reporte.findOneAndUpdate(
      { _id: id, estado: "pendiente" },
      { $set: { estado: decision, resueltoPor: req.usuario._id, resueltoEn: new Date() } },
      { new: true }
    );
    if (!reporte) return res.status(409).json({ mensaje: "El reporte no existe o ya fue resuelto" });

    let sancion = null;
    if (decision === "procedente" && reporte.tipoReportado === "estudiante" && reporte.estudianteReportado) {
      sancion = await aplicarFalta(reporte.estudianteReportado);
      if (reporte.motivo === "no_pago") {
        await Usuario.updateOne({ _id: reporte.estudianteReportado }, { $set: { bloqueoPorPago: true } });
      }
    }

    if (decision === "improcedente") {
      // Muchos reportes rechazados = posible abuso del sistema de reportes.
      const reportante = await Usuario.findByIdAndUpdate(
        reporte.reportante,
        { $inc: { reportesImprocedentes: 1 } },
        { new: true }
      );
      if (reportante && reportante.reportesImprocedentes >= 3 && !reportante.sospechoso) {
        await Usuario.updateOne({ _id: reportante._id }, { $set: { sospechoso: true } });
      }
    }

    res.json({ mensaje: `Reporte ${decision}`, sancion });
  } catch {
    res.status(500).json({ mensaje: "Error al resolver reporte" });
  }
};

/** El cliente ya pagó la deuda confirmada: se levanta el bloqueo para pedir. */
export const saldarReporte = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ mensaje: "Reporte inválido" });

    const reporte = await Reporte.findOneAndUpdate(
      { _id: id, motivo: "no_pago", estado: "procedente", saldado: { $ne: true } },
      { $set: { saldado: true, saldadoEn: new Date() } },
      { new: true }
    );
    if (!reporte) return res.status(409).json({ mensaje: "No hay un adeudo pendiente en este reporte" });

    const otros = await Reporte.exists({
      estudianteReportado: reporte.estudianteReportado,
      motivo: "no_pago",
      estado: "procedente",
      saldado: { $ne: true },
    });
    if (!otros) await Usuario.updateOne({ _id: reporte.estudianteReportado }, { $set: { bloqueoPorPago: false } });

    res.json({ mensaje: "Adeudo saldado", bloqueoLevantado: !otros });
  } catch {
    res.status(500).json({ mensaje: "Error al saldar adeudo" });
  }
};
