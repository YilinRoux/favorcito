import mongoose from "mongoose";
import { CATEGORIAS } from "../config/categorias.js";

const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },

    descripcion: {
      type: String,
      required: true,
    },

    precio: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
    },

    imagen: {
      type: String,
    },

    categoria: {
      type: String,
      enum: CATEGORIAS,
      default: "Otro",
    },

    local: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Local",
      required: true,
    },

    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Producto = mongoose.model("Producto", productoSchema);

export default Producto;