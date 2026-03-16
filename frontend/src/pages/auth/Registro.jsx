import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import "../../styles/auth/Registro.css";

function Registro() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rol = searchParams.get("rol");

  const [nombre_completo, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
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

  /* ── Pantalla selector de rol ── */
  if (!rol) {
    return (
      <div className="rg-wrap">
        <div className="rg-particles">
          {[...Array(7)].map((_, i) => <div key={i} className="rg-p" />)}
        </div>
        <div className="rg-orb rg-orb-1" />
        <div className="rg-orb rg-orb-2" />

        <div className="rg-card">
          <div className="rg-logo">
            <div className="rg-logo-icon">
              <svg className="rg-logo-svg" viewBox="0 0 24 24">
                <circle cx="5.5" cy="17.5" r="2.5"/>
                <circle cx="18.5" cy="17.5" r="2.5"/>
                <path d="M3 5h11l2 7H5L3 5z"/>
                <path d="M15 12h4l2 5"/>
              </svg>
            </div>
            <span className="rg-logo-text">Favorcito</span>
          </div>

          <h2 className="rg-title">Crear cuenta</h2>
          <p className="rg-subtitle">¿Cómo quieres unirte a Favorcito?</p>

          <div className="rg-role-grid">
            <Link to="/registro?rol=estudiante" className="rg-role-btn rg-role-est">
              <div className="rg-role-icon rg-role-icon-est">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <div className="rg-role-content">
                <span className="rg-role-label">Estudiante</span>
                <span className="rg-role-desc">Pide favores y recibe pedidos</span>
              </div>
              <svg className="rg-role-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>

            <Link to="/registro?rol=vendedor" className="rg-role-btn rg-role-vend">
              <div className="rg-role-icon rg-role-icon-vend">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div className="rg-role-content">
                <span className="rg-role-label">Vendedor</span>
                <span className="rg-role-desc">Publica tu local y vende</span>
              </div>
              <svg className="rg-role-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          </div>

          <p className="rg-footer">
            ¿Ya tienes cuenta?
            <Link to="/login" className="rg-link"> Inicia sesión</Link>
          </p>
        </div>
      </div>
    );
  }

  /* ── Formulario de registro ── */
  return (
    <div className="rg-wrap">
      <div className="rg-particles">
        {[...Array(7)].map((_, i) => <div key={i} className="rg-p" />)}
      </div>
      <div className="rg-orb rg-orb-1" />
      <div className="rg-orb rg-orb-2" />

      <div className="rg-card">
        <div className="rg-logo">
          <div className="rg-logo-icon">
            <svg className="rg-logo-svg" viewBox="0 0 24 24">
              <circle cx="5.5" cy="17.5" r="2.5"/>
              <circle cx="18.5" cy="17.5" r="2.5"/>
              <path d="M3 5h11l2 7H5L3 5z"/>
              <path d="M15 12h4l2 5"/>
            </svg>
          </div>
          <span className="rg-logo-text">Favorcito</span>
        </div>

        {/* Chip de rol */}
        <div className={`rg-rol-chip ${rol === "vendedor" ? "rg-rol-chip--vend" : ""}`}>
          {rol === "estudiante" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          )}
          Registro como <strong>{rol}</strong>
        </div>

        <h2 className="rg-title">Crea tu cuenta</h2>
        <p className="rg-subtitle">Completa tus datos para empezar</p>

        <form className="rg-form" onSubmit={handleRegistro}>

          {error && (
            <div className="rg-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" width="15" height="15">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Nombre */}
          <div className="rg-field">
            <label className="rg-label">Nombre completo</label>
            <input
              type="text"
              value={nombre_completo}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="rg-input"
              placeholder="Juan Pérez García"
            />
          </div>

          {/* Email */}
          <div className="rg-field">
            <label className="rg-label">
              Email {rol === "estudiante" && "institucional"}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rg-input"
              placeholder={rol === "estudiante" ? "a123456@alumno.uttehuacan.edu.mx" : "tu@email.com"}
            />
            {rol === "estudiante" && (
              <p className="rg-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="12" height="12">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                Debes usar tu correo institucional
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div className="rg-field">
            <label className="rg-label">Contraseña</label>
            <div className="rg-input-wrap">
              <input
                type={verPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rg-input rg-input--pr"
                placeholder="Mínimo 6 caracteres"
              />
              <button type="button" onClick={() => setVerPassword(!verPassword)} className="rg-pw-toggle">
                {verPassword ? (
                  <svg className="rg-toggle-svg" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg className="rg-toggle-svg" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Año académico */}
          {rol === "estudiante" && (
            <div className="rg-field rg-field-animate">
              <label className="rg-label">Año académico</label>
              <select
                value={año_academico}
                onChange={(e) => setAñoAcademico(e.target.value)}
                className="rg-select"
              >
                <option value="">Selecciona tu año</option>
                <option value="1">1er año</option>
                <option value="2">2do año</option>
                <option value="3">3er año</option>
                <option value="4">4to año</option>
              </select>
            </div>
          )}

          <button type="submit" disabled={cargando} className="rg-btn">
            {cargando ? "Registrando..." : "Crear cuenta"}
          </button>

          <p className="rg-footer">
            ¿Ya tienes cuenta?
            <Link to="/login" className="rg-link"> Inicia sesión</Link>
          </p>

        </form>
      </div>
    </div>
  );
}

export default Registro;