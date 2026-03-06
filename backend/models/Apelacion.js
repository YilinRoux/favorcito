import mongoose from "mongoose";

const apelacionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    nombre: {
      type: String,
      required: true,
    },
    motivo: {
      type: String,
      required: true,
    },
    estado: {
      type: String,
      enum: ["pendiente", "aprobada", "rechazada"],
      default: "pendiente",
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
  },
  { timestamps: true }
);

const Apelacion = mongoose.model("Apelacion", apelacionSchema);
export default Apelacion;