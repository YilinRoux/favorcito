import mongoose from "mongoose";
import Pedido from "../models/Pedido.js";
import ModeloDemanda from "../models/ModeloDemanda.js";

const DIAS_MINIMOS_PARA_ENTRENAR = 3;
const MUESTRAS_MINIMAS_PARA_REGRESION = 5;
const FEATURE_COLUMNS = ["trend", "dow_1", "dow_2", "dow_3", "dow_4", "dow_5", "dow_6", "dow_7"];
const EPSILON_RIDGE = 1e-6;

const crearError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const normalizarLocalId = (localId) => {
  if (!mongoose.Types.ObjectId.isValid(localId)) {
    throw crearError(400, "local_id inválido");
  }

  return new mongoose.Types.ObjectId(localId);
};

const dowMongoDeManana = () => {
  const manana = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return manana.getUTCDay() + 1;
};

const obtenerDatosDiarios = async (localId) => {
  const pipeline = [
    { $match: { local: localId } },
    { $unwind: "$productos" },
    {
      $project: {
        fecha: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        diaSemana: { $dayOfWeek: "$createdAt" },
        cantidad: "$productos.cantidad",
      },
    },
    {
      $group: {
        _id: { fecha: "$fecha", diaSemana: "$diaSemana" },
        totalUnidades: { $sum: "$cantidad" },
      },
    },
    { $sort: { "_id.fecha": 1 } },
  ];

  const filas = await Pedido.aggregate(pipeline);

  return filas.map((fila) => ({
    fecha: fila._id.fecha,
    dia_semana: fila._id.diaSemana,
    total_unidades: fila.totalUnidades,
  }));
};

const obtenerParticipacionProductos = async (localId, topN = 5) => {
  const pipeline = [
    { $match: { local: localId } },
    { $unwind: "$productos" },
    {
      $group: {
        _id: "$productos.producto",
        nombre: { $first: "$productos.nombre" },
        unidades: { $sum: "$productos.cantidad" },
      },
    },
    { $sort: { unidades: -1 } },
    { $limit: topN },
  ];

  const filas = await Pedido.aggregate(pipeline);
  const total = filas.reduce((acc, fila) => acc + fila.unidades, 0) || 1;

  return filas.map((fila) => ({
    nombre: fila.nombre,
    participacion: Math.round((fila.unidades / total) * 10000) / 10000,
  }));
};

const construirFeatures = (filas) => {
  return filas.map((fila, index) => {
    const row = [index];
    for (let i = 1; i <= 7; i += 1) {
      row.push(fila.dia_semana === i ? 1 : 0);
    }
    return row;
  });
};

const productoPunto = (a, b) => a.reduce((acc, valor, index) => acc + valor * b[index], 0);

const resolverSistemaLineal = (matriz, vector) => {
  const n = matriz.length;
  const aumentada = matriz.map((fila, i) => [...fila, vector[i]]);

  for (let col = 0; col < n; col += 1) {
    let pivote = col;
    for (let fila = col + 1; fila < n; fila += 1) {
      if (Math.abs(aumentada[fila][col]) > Math.abs(aumentada[pivote][col])) {
        pivote = fila;
      }
    }

    if (Math.abs(aumentada[pivote][col]) < 1e-12) {
      throw crearError(500, "No se pudo ajustar el modelo de demanda");
    }

    if (pivote !== col) {
      [aumentada[col], aumentada[pivote]] = [aumentada[pivote], aumentada[col]];
    }

    const divisor = aumentada[col][col];
    for (let j = col; j <= n; j += 1) {
      aumentada[col][j] /= divisor;
    }

    for (let fila = 0; fila < n; fila += 1) {
      if (fila === col) continue;
      const factor = aumentada[fila][col];
      for (let j = col; j <= n; j += 1) {
        aumentada[fila][j] -= factor * aumentada[col][j];
      }
    }
  }

  return aumentada.map((fila) => fila[n]);
};

const ajustarRegresionLineal = (X, y) => {
  const m = X[0].length;
  const xtx = Array.from({ length: m }, () => Array(m).fill(0));
  const xty = Array(m).fill(0);

  for (let i = 0; i < X.length; i += 1) {
    const fila = X[i];
    for (let j = 0; j < m; j += 1) {
      xty[j] += fila[j] * y[i];
      for (let k = 0; k < m; k += 1) {
        xtx[j][k] += fila[j] * fila[k];
      }
    }
  }

  for (let i = 0; i < m; i += 1) {
    xtx[i][i] += EPSILON_RIDGE;
  }

  const coeficientes = resolverSistemaLineal(xtx, xty);
  const predicciones = X.map((fila) => productoPunto(fila, coeficientes));
  const media = y.reduce((acc, valor) => acc + valor, 0) / y.length;
  const ssRes = y.reduce((acc, valor, index) => acc + (valor - predicciones[index]) ** 2, 0);
  const ssTot = y.reduce((acc, valor) => acc + (valor - media) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { coeficientes, r2 };
};

export const entrenarModeloLocal = async (localId) => {
  const localObjectId = normalizarLocalId(localId);
  const datosDiarios = await obtenerDatosDiarios(localObjectId);

  if (datosDiarios.length < DIAS_MINIMOS_PARA_ENTRENAR) {
    throw crearError(
      400,
      `No hay suficiente historial para entrenar un modelo confiable. Se necesitan al menos ${DIAS_MINIMOS_PARA_ENTRENAR} días con pedidos y este local tiene ${datosDiarios.length}.`
    );
  }

  const diasSemanaVistos = [...new Set(datosDiarios.map((dato) => dato.dia_semana))].sort(
    (a, b) => a - b
  );
  const promedio =
    datosDiarios.reduce((acc, dato) => acc + dato.total_unidades, 0) / datosDiarios.length;
  const participacionProductos = await obtenerParticipacionProductos(localObjectId);

  const datosModelo = {
    local: localObjectId,
    promedio,
    diasSemanaVistos,
    muestras: datosDiarios.length,
    participacionProductos,
    entrenadoEn: new Date(),
    regresionDisponible: false,
    r2: null,
    columnas: FEATURE_COLUMNS,
    coeficientes: [],
    trendSiguiente: datosDiarios.length,
  };

  let regresionDisponible = false;
  if (datosDiarios.length >= MUESTRAS_MINIMAS_PARA_REGRESION) {
    try {
      const X = construirFeatures(datosDiarios);
      const y = datosDiarios.map((dato) => dato.total_unidades);
      const ajuste = ajustarRegresionLineal(X, y);
      datosModelo.coeficientes = ajuste.coeficientes;
      datosModelo.r2 = ajuste.r2;
      datosModelo.regresionDisponible = true;
      regresionDisponible = true;
    } catch (error) {
      datosModelo.regresionDisponible = false;
      datosModelo.coeficientes = [];
      datosModelo.r2 = null;
    }
  }

  await ModeloDemanda.findOneAndUpdate(
    { local: localObjectId },
    datosModelo,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    mensaje: "Modelo entrenado correctamente",
    muestras_usadas: datosDiarios.length,
    dias_semana_vistos: diasSemanaVistos,
    regresion_disponible: regresionDisponible,
    r2: regresionDisponible ? Math.round(datosModelo.r2 * 1000) / 1000 : null,
    nota: regresionDisponible
      ? null
      : `Con menos de ${MUESTRAS_MINIMAS_PARA_REGRESION} muestras se usa un promedio simple en vez de regresión, para evitar sobreajuste.`,
  };
};

export const obtenerPrediccionLocal = async (localId) => {
  const localObjectId = normalizarLocalId(localId);
  const modelo = await ModeloDemanda.findOne({ local: localObjectId });

  if (!modelo) {
    throw crearError(
      404,
      "Este local no tiene un modelo entrenado. Llama primero a /entrenar/{local_id}."
    );
  }

  const dowManana = dowMongoDeManana();
  const usarRegresion =
    modelo.regresionDisponible &&
    Array.isArray(modelo.coeficientes) &&
    modelo.coeficientes.length === modelo.columnas.length &&
    modelo.diasSemanaVistos.includes(dowManana);

  let prediccionTotal;
  let modo;
  let confianzaR2 = null;

  if (usarRegresion) {
    const fila = [modelo.trendSiguiente || 0];
    for (let i = 1; i <= 7; i += 1) {
      fila.push(i === dowManana ? 1 : 0);
    }
    prediccionTotal = Math.max(0, Math.round(productoPunto(fila, modelo.coeficientes)));
    modo = "regresion_lineal";
    confianzaR2 = typeof modelo.r2 === "number" ? Math.round(modelo.r2 * 1000) / 1000 : null;
  } else {
    prediccionTotal = Math.max(0, Math.round(modelo.promedio));
    modo = "promedio_simple";
  }

  const desglose = (modelo.participacionProductos || []).map((producto) => ({
    producto: producto.nombre,
    unidades_estimadas: Math.round(prediccionTotal * producto.participacion),
  }));

  return {
    local_id: localId,
    modo,
    unidades_estimadas_manana: prediccionTotal,
    desglose_por_producto: desglose,
    modelo_entrenado_en: modelo.entrenadoEn,
    confianza_r2: confianzaR2,
  };
};
