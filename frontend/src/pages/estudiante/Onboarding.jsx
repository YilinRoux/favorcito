import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/estudiante/Onboarding.css";

export default function Onboarding() {
  const [categorias, setCategorias] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const { actualizarUsuario } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const res = await api.get("/productos/categorias");
        setCategorias(res.data.categorias);
      } catch (err) {
        setError("No se pudieron cargar las categorías");
      }
    };
    cargarCategorias();
  }, []);

  const toggleCategoria = (cat) => {
    setSeleccionadas((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleContinuar = async () => {
    if (seleccionadas.length === 0) {
      setError("Selecciona al menos una categoría");
      return;
    }
    setCargando(true);
    setError("");
    try {
      await api.put("/usuarios/preferencias", { preferencias: seleccionadas });
      actualizarUsuario({ onboardingCompletado: true, preferencias: seleccionadas });
      navigate("/perfil");
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al guardar tus preferencias");
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

        <h2 className="ob-title">¿Qué te gusta pedir?</h2>
        <p className="ob-subtitle">
          Elige tus favoritos para mostrarte mejores recomendaciones
        </p>

        {error && <div className="ob-error">{error}</div>}

        <div className="ob-grid">
          {categorias.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategoria(cat)}
              className={`ob-chip ${seleccionadas.includes(cat) ? "ob-chip-activa" : ""}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button className="ob-btn" disabled={cargando} onClick={handleContinuar}>
          {cargando ? "Guardando..." : `Continuar (${seleccionadas.length})`}
        </button>
      </div>
    </div>
  );
}