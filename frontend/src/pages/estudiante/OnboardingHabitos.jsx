import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/estudiante/Onboarding.css";

const HORARIOS = [
  { value: "manana", label: "Mañana" },
  { value: "mediodia", label: "Mediodía" },
  { value: "tarde", label: "Tarde" },
];

const PRESUPUESTOS = [
  { value: "menos_30", label: "Menos $30" },
  { value: "30_60", label: "$30 - $60" },
  { value: "mas_60", label: "Más $60" },
];

const RESTRICCIONES = [
  { value: "vegetariano", label: "Vegetariano" },
  { value: "sin_picante", label: "Sin picante" },
  { value: "ninguna", label: "Ninguna" },
];

export default function OnboardingHabitos() {
  const [horario, setHorario] = useState(null);
  const [presupuesto, setPresupuesto] = useState(null);
  const [restricciones, setRestricciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const { actualizarUsuario } = useContext(AuthContext);
  const navigate = useNavigate();

  const toggleRestriccion = (valor) => {
    setRestricciones((prev) =>
      prev.includes(valor) ? prev.filter((r) => r !== valor) : [...prev, valor]
    );
  };

  const handleContinuar = async () => {
    if (!horario || !presupuesto) {
      setError("Selecciona tu horario habitual y tu presupuesto");
      return;
    }
    setCargando(true);
    setError("");
    try {
      const res = await api.put("/usuarios/habitos", {
        horario,
        presupuesto,
        restricciones,
      });
      actualizarUsuario({
        onboardingCompletado: true,
        habitosCompra: res.data.habitosCompra,
      });
      navigate("/onboarding/confirmacion");
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al guardar tus hábitos");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="ob-wrap">
      <div className="ob-orb ob-orb-1" />
      <div className="ob-orb ob-orb-2" />

      <div className="ob-card">
        <div className="ob-logo">
          <div className="ob-logo-icon">
            <svg className="ob-logo-svg" viewBox="0 0 24 24">
              <circle cx="5.5" cy="17.5" r="2.5" />
              <circle cx="18.5" cy="17.5" r="2.5" />
              <path d="M3 5h11l2 7H5L3 5z" />
              <path d="M15 12h4l2 5" />
            </svg>
          </div>
          <span className="ob-logo-text">Favorcito</span>
        </div>

        <p className="ob-paso">Paso 2 de 3</p>
        <h2 className="ob-title">¿Cuándo sueles pedir?</h2>
        <p className="ob-subtitle">Ayúdanos a anticipar lo que necesitas</p>

        {error && <div className="ob-error">{error}</div>}

        <div className="ob-section">
          <p className="ob-section-label">Horario habitual</p>
          <div className="ob-grid">
            {HORARIOS.map((h) => (
              <button
                key={h.value}
                type="button"
                onClick={() => setHorario(h.value)}
                className={`ob-chip ${horario === h.value ? "ob-chip-activa" : ""}`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ob-section">
          <p className="ob-section-label">Presupuesto por pedido</p>
          <div className="ob-grid">
            {PRESUPUESTOS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPresupuesto(p.value)}
                className={`ob-chip ${presupuesto === p.value ? "ob-chip-activa" : ""}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ob-section">
          <p className="ob-section-label">Restricciones</p>
          <div className="ob-grid">
            {RESTRICCIONES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => toggleRestriccion(r.value)}
                className={`ob-chip ${restricciones.includes(r.value) ? "ob-chip-activa" : ""}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <button className="ob-btn" disabled={cargando} onClick={handleContinuar}>
          {cargando ? "Guardando..." : "Continuar"}
        </button>
      </div>
    </div>
  );
}
