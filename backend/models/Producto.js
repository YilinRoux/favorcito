import mongoose from "mongoose";

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