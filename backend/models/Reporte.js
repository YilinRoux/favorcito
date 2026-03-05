import mongoose from "mongoose";

const reporteSchema = new mongoose.Schema(
  {
    reportante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    tipoReportado: {
      type: String,
      enum: ["local", "estudiante"],
      required: true,
    },
    localReportado: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Local",
    },
    estudianteReportado: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    motivo: {
      type: String,
      enum: [
        "mal_servicio",
        "producto_en_mal_estado",
        "cancelacion_injustificada",
        "comportamiento_inapropiado",
        "otro"
      ],
      required: true,
    },
    descripcion: {
      type: String,
      trim: true,
    },
    estado: {
      type: String,
      enum: ["pendiente", "resuelto"],
      default: "pendiente",
    },
  },
  { timestamps: true }
);

const Reporte = mongoose.model("Reporte", reporteSchema);
export default Reporte;