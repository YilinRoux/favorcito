import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/estudiante/Onboarding.css";

const ETIQUETAS_HORARIO = {
  manana: "Mañana",
  mediodia: "Mediodía",
  tarde: "Tarde",
};

const ETIQUETAS_PRESUPUESTO = {
  menos_30: "Menos $30",
  "30_60": "$30 - $60",
  mas_60: "Más $60",
};

const ETIQUETAS_RESTRICCION = {
  vegetariano: "Vegetariano",
  sin_picante: "Sin picante",
  ninguna: "Ninguna",
};

export default function OnboardingConfirmacion() {
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const res = await api.get("/usuarios/preferencias");
        setPerfil(res.data);
      } catch {
        setError("No se pudo cargar tu perfil");
      } finally {
        setCargando(false);
      }
    };
    cargarPerfil();
  }, []);

  const preferencias = perfil?.preferencias || [];
  const horario = perfil?.habitosCompra?.horario;
  const presupuesto = perfil?.habitosCompra?.presupuesto;
  const restricciones = perfil?.habitosCompra?.restricciones || [];

  if (cargando) {
    return (
      <div className="ob-wrap">
        <div className="ob-card">
          <p className="ob-subtitle">Cargando tu perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ob-wrap">
      <div className="ob-orb ob-orb-1" />
      <div className="ob-orb ob-orb-2" />

      <div className="ob-card">
        <div className="ob-check-icono">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <p className="ob-paso">Paso 3 de 3</p>
        <h2 className="ob-title">¡Listo!</h2>
        <p className="ob-subtitle">
          Tus preferencias fueron guardadas. Recibirás recomendaciones personalizadas desde ahora.
        </p>

        {error && <div className="ob-error">{error}</div>}

        <div className="ob-resumen">
          <p><strong>Gustos:</strong> {preferencias.length > 0 ? preferencias.join(", ") : "Sin especificar"}</p>
          <p><strong>Horario:</strong> {ETIQUETAS_HORARIO[horario] || "Sin especificar"}</p>
          <p><strong>Presupuesto:</strong> {ETIQUETAS_PRESUPUESTO[presupuesto] || "Sin especificar"}</p>
          <p>
            <strong>Restricciones:</strong>{" "}
            {restricciones.length > 0
              ? restricciones.map((r) => ETIQUETAS_RESTRICCION[r] || r).join(", ")
              : "Ninguna"}
          </p>
        </div>

        <button className="ob-btn" onClick={() => navigate("/menu")}>
          Ir al menú
        </button>
      </div>
    </div>
  );
}
