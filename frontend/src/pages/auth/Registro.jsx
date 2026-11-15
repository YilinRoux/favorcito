import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import tacosLogin from "../../assets/login/tacos-login.png";
import logoClaro from "../../assets/login/login-light-bg.png";
import logoOscuro from "../../assets/login/login-dark-bg.png";
import hojasLogin from "../../assets/login/hojas-login.png";
import "../../styles/auth/Registro.css";

const COPY_HERO = {
  estudiante: "Explora los platillos de los locales de tu escuela, haz tus pedidos y apoya a otros con favores.",
  vendedor: "Publica tu local, muestra tu menú y recibe pedidos de toda tu escuela.",
  default: "Crea tu cuenta como estudiante o vendedor y conecta con los locales de tu escuela.",
};

/* Marco compartido: mismo fondo, encabezado y decoración que el login */
function Marco({ tema, aplicarTema, descripcion, children }) {
  return (
    <div className={`rg-wrap rg-theme-${tema}`}>
      <svg className="rg-swoosh-top" viewBox="0 0 300 300" aria-hidden="true">
        <path className="rg-sw-soft" d="M0 0H250C190 40 120 100 80 175C55 220 25 255 0 285Z" />
        <path className="rg-sw-orange" d="M0 150C40 105 105 55 215 12C140 62 88 112 52 190C32 232 14 262 0 280Z" />
      </svg>
      <svg className="rg-waves" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
        <path className="rg-wv-soft" d="M0 130C190 40 400 40 610 118C800 188 1010 230 1200 205C1300 192 1380 170 1440 140V320H0Z" />
        <path className="rg-wv-navy" d="M330 320C470 215 640 190 820 235C960 270 1090 275 1215 245C1300 225 1370 255 1440 285V320Z" />
        <path className="rg-wv-orange" d="M820 320C1010 250 1200 215 1440 150V320Z" />
      </svg>
      <img className="rg-leaves rg-leaves-left" src={hojasLogin} alt="" aria-hidden="true" />
      <img className="rg-leaves rg-leaves-right" src={hojasLogin} alt="" aria-hidden="true" />
      <img className="rg-tacos" src={tacosLogin} alt="" aria-hidden="true" />

      <div className="rg-page">
        <header className="rg-top">
          <Link to="/" className="rg-brand" aria-label="Favorcito, ir al inicio">
            <img
              className="rg-brand-logo"
              src={tema === "claro" ? logoClaro : logoOscuro}
              alt=""
              aria-hidden="true"
            />
            <span className="rg-brand-name">Favorcito</span>
          </Link>

          <nav className="rg-nav" aria-label="Principal">
            <Link to="/" className="rg-nav-active">Inicio</Link>
            <span className="rg-nav-link">Acerca de</span>
          </nav>

          <div className="rg-toggle" role="group" aria-label="Tema de la página">
            <button
              type="button"
              className={`rg-toggle-opt${tema === "claro" ? " is-on" : ""}`}
              aria-pressed={tema === "claro"}
              aria-label="Modo claro"
              onClick={() => aplicarTema("claro")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41" /></svg>
            </button>
            <button
              type="button"
              className={`rg-toggle-opt${tema === "oscuro" ? " is-on" : ""}`}
              aria-pressed={tema === "oscuro"}
              aria-label="Modo oscuro"
              onClick={() => aplicarTema("oscuro")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8Z" /></svg>
            </button>
          </div>
        </header>

        <main className="rg-main">
          <section className="rg-hero">
            <h1>Crea tu cuenta<br />en <em>Favorcito</em></h1>
            <p>{descripcion}</p>
          </section>

          <div className="rg-card">{children}</div>
        </main>
      </div>
    </div>
  );
}

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
  const [tema, setTema] = useState(() => localStorage.getItem("favorcito-tema") || "claro");

  const aplicarTema = (nuevo) => {
    setTema(nuevo);
    localStorage.setItem("favorcito-tema", nuevo);
  };

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
      <Marco tema={tema} aplicarTema={aplicarTema} descripcion={COPY_HERO.default}>
        <h2 className="rg-title">Crear cuenta</h2>
        <p className="rg-subtitle">¿Cómo quieres unirte a Favorcito?</p>

        <div className="rg-roles">
          <Link to="/registro?rol=estudiante" className="rg-role">
            <span className="rg-role-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg></span>
            <span className="rg-role-text">
              <span className="rg-role-label">Estudiante</span>
              <span className="rg-role-desc">Pide favores y recibe pedidos</span>
            </span>
            <svg className="rg-role-arrow" viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>

          <Link to="/registro?rol=vendedor" className="rg-role">
            <span className="rg-role-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg></span>
            <span className="rg-role-text">
              <span className="rg-role-label">Vendedor</span>
              <span className="rg-role-desc">Publica tu local y vende</span>
            </span>
            <svg className="rg-role-arrow" viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
        </div>

        <p className="rg-footer">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="rg-link">Inicia sesión</Link>
        </p>
      </Marco>
    );
  }

  /* ── Formulario de registro ── */
  return (
    <Marco tema={tema} aplicarTema={aplicarTema} descripcion={COPY_HERO[rol] || COPY_HERO.default}>
      <div className="rg-chip">
        {rol === "estudiante" ? (
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
        )}
        <span>Registro como <strong>{rol}</strong></span>
      </div>

      <h2 className="rg-title">Crea tu cuenta</h2>
      <p className="rg-subtitle">Completa tus datos para empezar</p>

      <form className="rg-form" onSubmit={handleRegistro}>
        {error && (
          <div className="rg-error" role="alert">
            <svg className="rg-error-svg" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <div className="rg-input-wrap">
          <svg className="rg-field-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <input
            type="text"
            name="nombre_completo"
            autoComplete="name"
            aria-label="Nombre completo"
            value={nombre_completo}
            onChange={(e) => setNombreCompleto(e.target.value)}
            className="rg-input rg-input--icon"
            placeholder="Nombre completo"
          />
        </div>

        <div className="rg-input-wrap">
          <svg className="rg-field-icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3.5 6.5 12 13l8.5-6.5" />
          </svg>
          <input
            type="email"
            name="email"
            autoComplete="email"
            aria-label={rol === "estudiante" ? "Correo institucional" : "Correo electrónico"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rg-input rg-input--icon"
            placeholder={rol === "estudiante" ? "a123456@alumno.uttehuacan.edu.mx" : "Correo electrónico"}
          />
        </div>
        {rol === "estudiante" && (
          <p className="rg-hint">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Debes usar tu correo institucional
          </p>
        )}

        <div className="rg-input-wrap">
          <svg className="rg-field-icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 018 0v3" />
          </svg>
          <input
            type={verPassword ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            aria-label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rg-input rg-input--icon rg-input--pr"
            placeholder="Contraseña (mínimo 6 caracteres)"
          />
          <button
            type="button"
            onClick={() => setVerPassword(!verPassword)}
            className="rg-pw-toggle"
            aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {verPassword ? (
              <svg className="rg-pw-toggle-svg" viewBox="0 0 24 24">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg className="rg-pw-toggle-svg" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {rol === "estudiante" && (
          <div className="rg-input-wrap">
            <svg className="rg-field-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            <select
              name="año_academico"
              aria-label="Año académico"
              value={año_academico}
              onChange={(e) => setAñoAcademico(e.target.value)}
              className={`rg-input rg-input--icon rg-select${año_academico ? "" : " rg-select--vacio"}`}
            >
              <option value="">Selecciona tu cuatrimestre</option>
              <option value="1">1er año</option>
              <option value="2">2do año</option>
              <option value="3">3er año</option>
              <option value="4">4to año</option>
              <option value="5">5to año</option>
              <option value="6">6to año</option>
              <option value="7">7to año</option>
              <option value="8">8to año</option>
            </select>
            <svg className="rg-chevron" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        )}

        <button type="submit" disabled={cargando} className="rg-btn">
          {cargando ? "Registrando..." : "Crear cuenta"}
        </button>

        <p className="rg-footer">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="rg-link">Inicia sesión</Link>
        </p>
      </form>
    </Marco>
  );
}

export default Registro;
