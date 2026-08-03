"""
Entrena el modelo de predicción de demanda de TODOS los locales aprobados.

Uso:
    python entrenamiento/entrenar_modelo.py

Pensado para correrse periódicamente (ej. una vez al día con un cron job),
para que las predicciones se mantengan al día con los pedidos más recientes.
Reutiliza la misma lógica de entrenamiento que expone el endpoint
POST /entrenar/{local_id} del microservicio (ver app.py), llamándolo por HTTP
para no duplicar código.
"""

import os
import sys

import requests
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/miapp")
ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8000")


def main():
    cliente = MongoClient(MONGO_URI)
    db = cliente.get_default_database()

    locales = list(db.locals.find({"aprobado": True, "activo": True}, {"_id": 1, "nombre": 1}))
    print(f"Entrenando modelo para {len(locales)} locales activos...\n")

    exitosos, fallidos = 0, 0
    for local in locales:
        local_id = str(local["_id"])
        nombre = local.get("nombre", local_id)
        try:
            resp = requests.post(f"{ML_SERVICE_URL}/entrenar/{local_id}", timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                print(f"✅ {nombre}: {data['muestras_usadas']} muestras, r2={data['r2']}")
                exitosos += 1
            else:
                print(f"⏭️  {nombre}: {resp.json().get('detail', 'sin datos suficientes')}")
                fallidos += 1
        except requests.RequestException as e:
            print(f"❌ {nombre}: error de conexión con el microservicio ({e})")
            fallidos += 1

    print(f"\nListo. Entrenados: {exitosos} | Sin suficientes datos o con error: {fallidos}")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ("-h", "--help"):
        print(__doc__)
        sys.exit(0)
    main()
