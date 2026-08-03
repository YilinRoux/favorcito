"""
Microservicio de Machine Learning para Favorcito.

Entrena y sirve un modelo de REGRESIÓN LINEAL (aprendizaje supervisado) que
predice cuántas unidades venderá un local al día siguiente, usando como
variables de entrada el día de la semana y una variable de tendencia
(qué tan lejos está esa fecha del inicio del historial).

Este servicio vive separado del backend Node porque el ecosistema de
Machine Learning en Python (scikit-learn, pandas) es mucho más maduro que
el de Node para este tipo de tareas. El backend Node le pide predicciones
a este servicio vía HTTP, igual que le pediría a cualquier otra API.
"""

import os
from datetime import datetime, timedelta, timezone

import joblib
import pandas as pd
from bson import ObjectId
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from sklearn.linear_model import LinearRegression

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/miapp")
MODELOS_DIR = os.path.join(os.path.dirname(__file__), "modelos")
os.makedirs(MODELOS_DIR, exist_ok=True)

DIAS_MINIMOS_PARA_ENTRENAR = 3  # menos que esto, ni el promedio es confiable
MUESTRAS_MINIMAS_PARA_REGRESION = 5  # menos que esto, la regresión sobreajusta (más variables que datos)

cliente = MongoClient(MONGO_URI)
db = cliente.get_default_database()

app = FastAPI(title="Favorcito ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # este servicio solo lo consume el backend Node, no el navegador
    allow_methods=["*"],
    allow_headers=["*"],
)


def _dow_mongo_de_manana() -> int:
    """
    Convierte el día de la semana de Python (lunes=0..domingo=6) al mismo
    formato que usa el operador $dayOfWeek de MongoDB (domingo=1..sábado=7),
    para el día de MAÑANA respecto a ahorita.
    """
    manana = datetime.now(timezone.utc) + timedelta(days=1)
    python_dow = manana.weekday()  # lunes=0 .. domingo=6
    return ((python_dow + 1) % 7) + 1


def _obtener_datos_diarios(local_id: str) -> pd.DataFrame:
    """Unidades vendidas por día para un local, agrupadas y ordenadas por fecha."""
    pipeline = [
        {"$match": {"local": ObjectId(local_id)}},
        {"$unwind": "$productos"},
        {
            "$project": {
                "fecha": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
                "diaSemana": {"$dayOfWeek": "$createdAt"},
                "cantidad": "$productos.cantidad",
            }
        },
        {
            "$group": {
                "_id": {"fecha": "$fecha", "diaSemana": "$diaSemana"},
                "totalUnidades": {"$sum": "$cantidad"},
            }
        },
        {"$sort": {"_id.fecha": 1}},
    ]
    filas = list(db.pedidos.aggregate(pipeline))
    if not filas:
        return pd.DataFrame(columns=["fecha", "dia_semana", "total_unidades"])

    return pd.DataFrame(
        [
            {
                "fecha": f["_id"]["fecha"],
                "dia_semana": f["_id"]["diaSemana"],
                "total_unidades": f["totalUnidades"],
            }
            for f in filas
        ]
    )


def _obtener_participacion_productos(local_id: str, top_n: int = 5) -> list[dict]:
    """
    Qué porcentaje de las unidades históricas corresponde a cada producto.
    Se usa para repartir la predicción total del local entre sus productos.
    """
    pipeline = [
        {"$match": {"local": ObjectId(local_id)}},
        {"$unwind": "$productos"},
        {
            "$group": {
                "_id": "$productos.producto",
                "nombre": {"$first": "$productos.nombre"},
                "unidades": {"$sum": "$productos.cantidad"},
            }
        },
        {"$sort": {"unidades": -1}},
        {"$limit": top_n},
    ]
    filas = list(db.pedidos.aggregate(pipeline))
    total = sum(f["unidades"] for f in filas) or 1
    return [
        {"nombre": f["nombre"], "participacion": round(f["unidades"] / total, 4)}
        for f in filas
    ]


def _construir_features(df: pd.DataFrame) -> pd.DataFrame:
    """Convierte día_semana en columnas one-hot (dow_1..dow_7) + variable de tendencia."""
    df = df.copy()
    df["trend"] = range(len(df))
    dow_dummies = pd.get_dummies(df["dia_semana"], prefix="dow")
    for i in range(1, 8):
        col = f"dow_{i}"
        if col not in dow_dummies.columns:
            dow_dummies[col] = 0
    dow_dummies = dow_dummies[[f"dow_{i}" for i in range(1, 8)]]
    return pd.concat([df[["trend"]], dow_dummies], axis=1)


def _ruta_modelo(local_id: str) -> str:
    return os.path.join(MODELOS_DIR, f"{local_id}.pkl")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/entrenar/{local_id}")
def entrenar(local_id: str):
    try:
        ObjectId(local_id)
    except Exception:
        raise HTTPException(status_code=400, detail="local_id inválido")

    df = _obtener_datos_diarios(local_id)

    if len(df) < DIAS_MINIMOS_PARA_ENTRENAR:
        raise HTTPException(
            status_code=400,
            detail=(
                f"No hay suficiente historial para entrenar un modelo confiable. "
                f"Se necesitan al menos {DIAS_MINIMOS_PARA_ENTRENAR} días con pedidos "
                f"y este local tiene {len(df)}."
            ),
        )

    dias_semana_vistos = sorted(int(d) for d in df["dia_semana"].unique())
    promedio = float(df["total_unidades"].mean())
    participacion_productos = _obtener_participacion_productos(local_id)

    datos_modelo = {
        "promedio": promedio,
        "dias_semana_vistos": dias_semana_vistos,
        "muestras": len(df),
        "participacion_productos": participacion_productos,
        "entrenado_en": datetime.now(timezone.utc).isoformat(),
        "modelo": None,
        "columnas": None,
        "trend_siguiente": None,
        "r2": None,
    }

    regresion_entrenada = False
    if len(df) >= MUESTRAS_MINIMAS_PARA_REGRESION:
        X = _construir_features(df)
        y = df["total_unidades"]
        modelo = LinearRegression()
        modelo.fit(X, y)
        datos_modelo["modelo"] = modelo
        datos_modelo["columnas"] = list(X.columns)
        datos_modelo["trend_siguiente"] = len(df)
        datos_modelo["r2"] = modelo.score(X, y)
        regresion_entrenada = True

    joblib.dump(datos_modelo, _ruta_modelo(local_id))

    return {
        "mensaje": "Modelo entrenado correctamente",
        "muestras_usadas": len(df),
        "dias_semana_vistos": dias_semana_vistos,
        "regresion_disponible": regresion_entrenada,
        "r2": round(datos_modelo["r2"], 3) if regresion_entrenada else None,
        "nota": (
            None
            if regresion_entrenada
            else f"Con menos de {MUESTRAS_MINIMAS_PARA_REGRESION} muestras se usa un "
            "promedio simple en vez de regresión, para evitar sobreajuste."
        ),
    }


@app.get("/prediccion/{local_id}")
def prediccion(local_id: str):
    ruta = _ruta_modelo(local_id)
    if not os.path.exists(ruta):
        raise HTTPException(
            status_code=404,
            detail="Este local no tiene un modelo entrenado. Llama primero a /entrenar/{local_id}.",
        )

    datos = joblib.load(ruta)
    dow_manana = _dow_mongo_de_manana()

    # Solo confiamos en la regresión si: (a) se entrenó, y (b) el día de la semana
    # de mañana SÍ apareció en el historial de entrenamiento. Si mañana cae en un
    # día que el modelo nunca vio, extrapolar sería una apuesta, no una predicción;
    # en ese caso preferimos el promedio simple, que es más honesto.
    usar_regresion = datos["modelo"] is not None and dow_manana in datos["dias_semana_vistos"]

    if usar_regresion:
        modelo: LinearRegression = datos["modelo"]
        fila = {"trend": datos["trend_siguiente"]}
        for i in range(1, 8):
            fila[f"dow_{i}"] = 1 if i == dow_manana else 0
        X_manana = pd.DataFrame([fila])[datos["columnas"]]
        prediccion_total = max(0, round(float(modelo.predict(X_manana)[0])))
        modo = "regresion_lineal"
        confianza_r2 = round(datos["r2"], 3)
    else:
        prediccion_total = max(0, round(datos["promedio"]))
        modo = "promedio_simple"
        confianza_r2 = None

    desglose = [
        {
            "producto": p["nombre"],
            "unidades_estimadas": round(prediccion_total * p["participacion"]),
        }
        for p in datos["participacion_productos"]
    ]

    return {
        "local_id": local_id,
        "modo": modo,
        "unidades_estimadas_manana": prediccion_total,
        "desglose_por_producto": desglose,
        "modelo_entrenado_en": datos["entrenado_en"],
        "confianza_r2": confianza_r2,
    }