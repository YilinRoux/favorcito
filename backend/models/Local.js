import mongoose from "mongoose";

const localSchema = new mongoose.Schema(
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

    direccion: {
      type: String,
      required: true,
    },

    fotos: [
      {
        type: String, // guardaremos rutas de imagen
      },
    ],

    aprobado: {
      type: Boolean,
      default: false, // admin debe aprobar
    },

    promocionActiva: {
      type: Boolean,
      default: false,
    },

    montoMinimoPromocion: {
      type: Number,
      default: 200,
    },

    vendedor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },

    activo: {
      type: Boolean,
      default: true,
    },

    anuncio: {
      type: String,
      default: "",
    },

    imagenesAnuncios: [
      {
        type: String,
      },
    ],

    // ⭐ NUEVOS CAMPOS

   calificacionPromedio: {
  type: Number,
  default: 0,
},

    totalCalificaciones: {
      type: Number,
      default: 0,
    },

    calificaciones: [
      {
        usuario: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Usuario",
        },
        estrellas: {
          type: Number,
          min: 1,
          max: 5,
        },
      },
    ],

    comentarios: [
      {
        usuario: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Usuario",
        },
        texto: {
          type: String,
          trim: true,
        },
        fecha: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Local = mongoose.model("Local", localSchema);

export default Local;