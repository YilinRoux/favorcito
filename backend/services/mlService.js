// Puente entre el backend Node y el microservicio de Machine Learning (Python).
// El backend nunca entrena ni predice directamente: solo le pide al
// microservicio, igual que le pediría a cualquier otra API externa.

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

export const entrenarModeloLocal = async (localId) => {
  const res = await fetch(`${ML_SERVICE_URL}/entrenar/${localId}`, { method: "POST" });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.detail || "Error al entrenar el modelo");
    error.status = res.status;
    throw error;
  }
  return data;
};

export const obtenerPrediccionLocal = async (localId) => {
  const res = await fetch(`${ML_SERVICE_URL}/prediccion/${localId}`);
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.detail || "Error al obtener la predicción");
    error.status = res.status;
    throw error;
  }
  return data;
};
