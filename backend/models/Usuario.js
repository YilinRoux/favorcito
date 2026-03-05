import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema(
  {
    nombre_completo: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    rol: {
      type: String,
      enum: ["estudiante", "vendedor", "admin"],
      default: "estudiante",
    },

    año_academico: {
      type: Number,
      min: 1,
      max: 5,
    },

    activo: {
      type: Boolean,
      default: true,
    },

    matricula: {
      type: String,
      unique: true,
      sparse: true,
    },

    cancelaciones: {
      type: Number,
      default: 0,
    },

    sospechoso: {
      type: Boolean,
      default: false,
    },

    local: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Local",
    },

    verificado: {
      type: Boolean,
      default: false,
    },

    codigoVerificacion: {
      type: String,
      select: false,
    },

    codigoExpiracion: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

const Usuario = mongoose.model("Usuario", usuarioSchema);

export default Usuario;