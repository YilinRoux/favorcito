import mongoose from "mongoose";

const productoPedidoSchema = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Producto",
    required: true,
  },
  nombre: String,
  precio: Number,
  cantidad: Number,
});

const historialEstadoSchema = new mongoose.Schema({
  estado: String,
  fecha: {
    type: Date,
    default: Date.now,
  },
});

const pedidoSchema = new mongoose.Schema(
  {
    estudiante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },

    local: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Local",
      required: true,
    },

    productos: [productoPedidoSchema],

    total: {
      type: Number,
      required: true,
    },

    costoEnvio: {
      type: Number,
      default: 0,
    },

    tipoEntrega: {
      type: String,
      enum: ["recoger", "favorcito"],
      required: true,
    },

    estado: {
      type: String,
      enum: [
        "enviado",
        "aceptado",
        "en_preparacion",
        "listo",
        "en_camino",
        "entregado",
        "cancelado",
      ],
      default: "enviado",
    },

    repartidor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },

    tiempoEstimado: Number,

    promocionAplicada: {
      type: Boolean,
      default: false,
    },

    costoEnvio: {
      type: Number,
      default: 0,
    },

    historialEstados: [historialEstadoSchema],

    canceladoPor: String,
  },
  {
    timestamps: true,
  }
);

const Pedido = mongoose.model("Pedido", pedidoSchema);

export default Pedido;