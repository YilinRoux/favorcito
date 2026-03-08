import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import "../../styles/auth/Login.css";
import "../../styles/auth/Registro.css";

function Registro() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const rol = searchParams.get("rol");

  const [nombre_completo, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [año_academico, setAñoAcademico] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    if (!nombre_completo.trim() || !email.trim() || !password.trim()) {
      setError("Todos los campos son obligatorios");
      setCargando(false);
      return;
    }

    if (!rol) {
      setError("Debes seleccionar un tipo de usuario");
      setCargando(false);
      return;
    }

    if (rol === "estudiante") {
      const regexInstitucional = /^a\d+@alumno\.uttehuacan\.edu\.mx$/;
      if (!regexInstitucional.test(email)) {
        setError("Debe usar un correo institucional válido (@alumno.uttehuacan.edu.mx)");
        setCargando(false);
        return;
      }
      if (!año_academico) {
        setError("El año académico es obligatorio para estudiantes");
        setCargando(false);
        return;
      }
    }

    try {
      // eslint-disable-next-line no-unused-vars
      const res = await api.post("/auth/registro", {
        nombre_completo,
        email,
        password,
        rol,
        año_academico: rol === "estudiante" ? año_academico : undefined,
      });

      navigate("/verificar-codigo", { state: { email } });
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al registrarse");
    } finally {
      setCargando(false);
    }
  };

  /* ── Pantalla de selección de rol ── */
  if (!rol) {
    return (
      <div className="auth-wrapper">
        <div className="auth-particles">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="auth-particle" />
          ))}
        </div>

        <div className="auth-card reg-role-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">🛵</div>
            <span className="auth-logo-text">Favorcito</span>
          </div>

          <h2 className="auth-title">Crear cuenta</h2>
          <p className="auth-subtitle">¿Cómo quieres unirte a Favorcito?</p>

          <div className="reg-role-grid">
            <Link to="/registro?rol=estudiante" className="reg-role-btn">
              <span className="reg-role-btn-icon">🎓</span>
              <span className="reg-role-btn-label">Estudiante</span>
              <span className="reg-role-btn-desc">Pide favores y recibe pedidos</span>
              <span className="reg-role-btn-arrow">→</span>
            </Link>

            <Link to="/registro?rol=vendedor" className="reg-role-btn">
              <span className="reg-role-btn-icon">🏪</span>
              <span className="reg-role-btn-label">Vendedor</span>
              <span className="reg-role-btn-desc">Publica tu local y vende</span>
              <span className="reg-role-btn-arrow">→</span>
            </Link>
          </div>

          <p className="auth-footer">
            ¿Ya tienes cuenta?
            <Link to="/login" className="auth-link"> Inicia sesión</Link>
          </p>
        </div>
      </div>
    );
  }

  /* ── Formulario de registro ── */
  return (
    <div className="auth-wrapper">
      <div className="auth-particles">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="auth-particle" />
        ))}
      </div>

      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🛵</div>
          <span className="auth-logo-text">Favorcito</span>
        </div>

        {/* Chip de rol */}
        <div className="reg-rol-chip">
          {rol === "estudiante" ? "🎓" : "🏪"} Registro como{" "}
          <strong>{rol}</strong>
        </div>

        <h2 className="auth-title">Crea tu cuenta</h2>
        <p className="auth-subtitle">Completa tus datos para empezar</p>

        <form className="auth-form" onSubmit={handleRegistro}>

          {error && (
            <div className="auth-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Nombre */}
          <div className="auth-field">
            <label className="auth-label">Nombre completo</label>
            <input
              type="text"
              value={nombre_completo}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="auth-input"
              placeholder="Juan Pérez García"
            />
          </div>

          {/* Email */}
          <div className="auth-field">
            <label className="auth-label">
              Email {rol === "estudiante" && "institucional"}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder={
                rol === "estudiante"
                  ? "a123456@alumno.uttehuacan.edu.mx"
                  : "tu@email.com"
              }
            />
            {rol === "estudiante" && (
              <p className="reg-input-hint">
                📧 Debes usar tu correo institucional
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div className="auth-field">
            <label className="auth-label">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {/* Año académico — solo estudiantes */}
          {rol === "estudiante" && (
            <div className="auth-field reg-field-animate">
              <label className="auth-label">Año académico</label>
              <select
                value={año_academico}
                onChange={(e) => setAñoAcademico(e.target.value)}
                className="auth-select"
              >
                <option value="">Selecciona tu cuatrimestre</option>
                <option value="1">1°</option>
                <option value="2">2°</option>
                <option value="3">3°</option>
                <option value="4">4°</option>
                <option value="5">5°</option>
                <option value="6">6°</option>
                <option value="7">7°</option>
                <option value="8">8°</option>
                <option value="9">9°</option>
                <option value="10">10°</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="auth-btn-submit"
          >
            {cargando ? "Registrando..." : "Crear cuenta"}
          </button>

          <p className="auth-footer">
            ¿Ya tienes cuenta?
            <Link to="/login" className="auth-link"> Inicia sesión</Link>
          </p>

        </form>
      </div>
    </div>
  );
}

export default Registro;