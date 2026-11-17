import mongoose from "mongoose";

const productoPedidoSchema = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Producto",
    required: true,
  },
  nombre: String,
  precio: { type: Number, required: true, min: 0 },
  cantidad: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
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
      min: 0,
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

    // Identificación para llamar y entregar: número del día por local + alias hablado (ej. "Ana12").
    numero: { type: Number, min: 1 },
    dia: { type: String },
    alias: { type: String, trim: true, maxlength: 24 },
    notas: { type: String, trim: true, maxlength: 140 },
    // Quién del equipo del local lo está preparando (texto libre, el local comparte una sola cuenta).
    atendidoPor: { type: String, trim: true, maxlength: 20 },

    historialEstados: [historialEstadoSchema],

    canceladoPor: String,
    devolucion: {
      type: new mongoose.Schema({
        estado: { type: String, enum: ["pendiente", "recibida"], required: true },
        motivo: { type: String, enum: ["cliente_ausente", "no_recibio_pedido", "no_pago"], required: true },
        solicitadaEn: Date,
        recibidaEn: Date,
        recibidaPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
      }, { _id: false }),
      default: undefined,
    },
    // Ausente en pedidos antiguos: su cancelación ya devolvía stock automáticamente.
    reposicionStock: {
      type: new mongoose.Schema({
        estado: { type: String, enum: ["pendiente", "resuelta"], required: true },
        cantidades: [{ type: Number, min: 0, validate: Number.isSafeInteger }],
        revisadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
        revisadoEn: Date,
      }, { _id: false }),
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

pedidoSchema.index(
  { local: 1, dia: 1, numero: 1 },
  { unique: true, partialFilterExpression: { numero: { $exists: true } } }
);

pedidoSchema.index({ local: 1, estado: 1, "reposicionStock.estado": 1 });

const Pedido = mongoose.model("Pedido", pedidoSchema);

export default Pedido;
