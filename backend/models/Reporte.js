import mongoose from "mongoose";

export const MOTIVOS_REPORTE = [
  // Reportes generales (locales / cancelaciones)
  "mal_servicio",
  "producto_en_mal_estado",
  "cancelacion_injustificada",
  "comportamiento_inapropiado",
  "otro",
  // Repartidor -> cliente
  "no_pago",
  "no_recibio_pedido",
  "cliente_ausente",
  // Cliente -> repartidor
  "pedido_incompleto",
  "pedido_sucio_danado",
  "pedido_equivocado",
  "mal_trato",
  "no_entrego",
];

const reporteSchema = new mongoose.Schema(
  {
    reportante: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    tipoReportado: { type: String, enum: ["local", "estudiante"], required: true },
    localReportado: { type: mongoose.Schema.Types.ObjectId, ref: "Local" },
    estudianteReportado: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },

    // Pedido que originó el reporte (obligatorio en los reportes cliente <-> repartidor).
    pedido: { type: mongoose.Schema.Types.ObjectId, ref: "Pedido" },
    contexto: {
      type: String,
      enum: ["general", "repartidor_a_cliente", "cliente_a_repartidor"],
      default: "general",
    },

    motivo: { type: String, enum: MOTIVOS_REPORTE, required: true },
    descripcion: { type: String, trim: true, maxlength: 500 },

    // "resuelto" se conserva solo para reportes antiguos.
    estado: {
      type: String,
      enum: ["pendiente", "procedente", "improcedente", "resuelto"],
      default: "pendiente",
    },
    resueltoPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    resueltoEn: Date,
    saldado: { type: Boolean, default: false },
    saldadoEn: Date,
  },
  { timestamps: true }
);

// Un reporte por persona y por pedido.
reporteSchema.index(
  { pedido: 1, reportante: 1 },
  { unique: true, partialFilterExpression: { pedido: { $exists: true } } }
);
reporteSchema.index({ estado: 1, createdAt: -1 });

const Reporte = mongoose.model("Reporte", reporteSchema);
export default Reporte;
