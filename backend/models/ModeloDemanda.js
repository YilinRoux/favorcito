import mongoose from "mongoose";

const participacionProductoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    participacion: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
  },
  { _id: false }
);

const modeloDemandaSchema = new mongoose.Schema(
  {
    local: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Local",
      required: true,
      unique: true,
      index: true,
    },
    tipo: {
      type: String,
      default: "regresion_lineal",
    },
    promedio: {
      type: Number,
      required: true,
      min: 0,
    },
    diasSemanaVistos: {
      type: [Number],
      default: [],
    },
    muestras: {
      type: Number,
      required: true,
      min: 0,
    },
    participacionProductos: {
      type: [participacionProductoSchema],
      default: [],
    },
    entrenadoEn: {
      type: Date,
      default: Date.now,
    },
    regresionDisponible: {
      type: Boolean,
      default: false,
    },
    r2: {
      type: Number,
      default: null,
    },
    columnas: {
      type: [String],
      default: [],
    },
    coeficientes: {
      type: [Number],
      default: [],
    },
    trendSiguiente: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const ModeloDemanda = mongoose.model("ModeloDemanda", modeloDemandaSchema);

export default ModeloDemanda;
