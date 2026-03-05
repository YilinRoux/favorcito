import mongoose from "mongoose";

const mensajeSchema = new mongoose.Schema(
  {
    pedido: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pedido",
      required: true,
    },
    emisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    rol: {
      type: String,
      enum: ["estudiante", "vendedor"],
      required: true,
    },
    mensaje: {
      type: String,
      required: true,
      trim: true,
    },
    leidoPorEstudiante: {
      type: Boolean,
      default: false,
},
    leidoPorVendedor: {
      type: Boolean,
      default: false,
},
  },
  {
    timestamps: true,
  }
);

const Mensaje = mongoose.model("Mensaje", mensajeSchema);

export default Mensaje;