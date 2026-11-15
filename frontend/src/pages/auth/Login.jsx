import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/auth/Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [verificacionPendiente, setVerificacionPendiente] = useState(false);
  const [reenviandoVerificacion, setReenviandoVerificacion] = useState(false);
  const [mostrarApelacion, setMostrarApelacion] = useState(false);
  const [apelacion, setApelacion] = useState({ nombre: "", email: "", motivo: "" });
  const [enviandoApelacion, setEnviandoApelacion] = useState(false);
  const [apelacionEnviada, setApelacionEnviada] = useState(false);
  const [tema, setTema] = useState(() => localStorage.getItem("favorcito-tema") || "claro");

  const cambiarTema = () => {
    const siguiente = tema === "claro" ? "oscuro" : "claro";
    setTema(siguiente);
    localStorage.setItem("favorcito-tema", siguiente);
  };

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setVerificacionPendiente(false);
    setCargando(true);

    if (!email.trim() || !password.trim()) {
      setError("Todos los campos son obligatorios");
      setCargando(false);
      return;
    }

    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data);
      const { rol, onboardingCompletado } = res.data.usuario;
      if (rol === "estudiante" && !onboardingCompletado) navigate("/onboarding");
      else if (rol === "estudiante") navigate("/perfil");
      else if (rol === "vendedor") navigate("/vendedor/dashboard");
      else if (rol === "admin") navigate("/admin/dashboard");
      else navigate("/");
    } catch (err) {
      const status = err.response?.status;
      const mensaje = err.response?.data?.mensaje;
      const pendienteVerificacion =
        status === 403 && mensaje?.toLowerCase().includes("verificar tu cuenta");

      if (status === 403 && mensaje?.includes("suspendida")) {
        setError("SUSPENDIDO");
      } else {
        setError(mensaje || "Credenciales inválidas");
        setVerificacionPendiente(pendienteVerificacion);
      }
    } finally {
      setCargando(false);
    }
  };

  const reenviarVerificacion = async () => {
    if (!email.trim()) {
      setError("Escribe primero tu correo");
      return;
    }

    setError("");
    setReenviandoVerificacion(true);

    try {
      await api.post("/auth/reenviar-codigo", { email: email.trim() });
      navigate("/verificar-codigo", {
        state: {
          email: email.trim(),
          mensaje: "Te enviamos un nuevo código de verificación.",
        },
      });
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al reenviar el código");
    } finally {
      setReenviandoVerificacion(false);
    }
  };

  const handleApelar = async () => {
    if (!apelacion.nombre || !apelacion.email || !apelacion.motivo) {
      alert("Completa todos los campos");
      return;
    }
    setEnviandoApelacion(true);
    try {
      await api.post("/apelaciones", apelacion);
      setApelacionEnviada(true);
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al enviar apelación");
    } finally {
      setEnviandoApelacion(false);
    }
  };

  return (
    <div className={`lg-wrap lg-theme-${tema}`}>
      <div className="lg-particles">
        {[...Array(7)].map((_, i) => <div key={i} className="lg-p" />)}
      </div>
      <div className="lg-orb lg-orb-1" />
      <div className="lg-orb lg-orb-2" />

      <section className="lg-shell">
        <aside className="lg-brand-panel">
          <div className="lg-brand-mark">
            <svg className="lg-brand-symbol" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M13 28c-4.4 0-8-3.6-8-8s3.6-8 8-8c1.4 0 2.7.4 3.8 1C18.8 8.3 23.3 5 28.5 5 35.4 5 41 10.6 41 17.5c0 .8-.1 1.6-.2 2.3 2.7 1.2 4.7 4 4.7 7.2 0 4.4-3.6 8-8 8H22l-9 5v-12Z"/>
            </svg>
            <strong>Favorcito</strong>
          </div>

          <div className="lg-brand-copy">
            <h1>Tu comida <em>favorita</em>,<br />más cerca de ti</h1>
            <p>Conecta con los locales de tu escuela, explora sus platillos y pide de forma rápida y sencilla.</p>
          </div>

          <div className="lg-food-scene" aria-hidden="true">
            <svg viewBox="0 0 620 280" preserveAspectRatio="xMidYMax meet">
              <ellipse className="lg-plate-shadow" cx="305" cy="238" rx="230" ry="28"/>
              <ellipse className="lg-plate" cx="305" cy="218" rx="220" ry="44"/>
              <g className="lg-taco lg-taco-1" transform="translate(130 62) rotate(-7 95 90)">
                <path className="lg-shell-shape" d="M20 142C31 61 78 18 147 29c52 9 86 49 91 112H20Z"/>
                <path className="lg-filling" d="M34 116c24-21 44-27 70-20 17-22 42-28 69-15 17-7 34-4 50 10 6 7 11 15 14 25H34Z"/>
                <circle className="lg-garnish-a" cx="92" cy="91" r="8"/>
                <circle className="lg-garnish-b" cx="131" cy="82" r="7"/>
                <circle className="lg-garnish-c" cx="171" cy="99" r="7"/>
                <path className="lg-leaf" d="M69 87c10-14 21-15 31-5-9 12-19 14-31 5Z"/>
                <path className="lg-leaf" d="M148 72c9-13 20-14 29-5-8 12-18 14-29 5Z"/>
              </g>
              <g className="lg-taco lg-taco-2" transform="translate(300 76) rotate(8 90 82)">
                <path className="lg-shell-shape" d="M20 132C31 57 75 18 137 28c47 8 78 45 83 103H20Z"/>
                <path className="lg-filling" d="M32 108c21-18 39-24 62-18 15-20 38-25 62-13 16-7 31-4 46 8 6 6 10 14 13 23H32Z"/>
                <circle className="lg-garnish-a" cx="82" cy="84" r="7"/>
                <circle className="lg-garnish-b" cx="117" cy="76" r="6"/>
                <circle className="lg-garnish-c" cx="153" cy="91" r="6"/>
                <path className="lg-leaf" d="M63 80c9-12 19-13 28-4-8 11-18 12-28 4Z"/>
              </g>
              <g className="lg-lime" transform="translate(472 174) rotate(-12)">
                <path d="M0 0c42 3 69 23 82 58-33 7-64 2-89-15L0 0Z"/>
                <path d="M10 8c27 7 47 21 59 42M28 12 16 43M48 22 34 49"/>
              </g>
            </svg>
          </div>
        </aside>

        <div className="lg-card">
          <button type="button" className="lg-theme-toggle" onClick={cambiarTema} aria-label={`Cambiar a modo ${tema === "claro" ? "oscuro" : "claro"}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41"/></svg>
            <span className="lg-theme-track"><span className="lg-theme-knob" /></span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8Z"/></svg>
          </button>
        <div className="lg-logo">
          <div className="lg-logo-icon">
            <svg className="lg-logo-icon-svg" viewBox="0 0 24 24">
              <circle cx="5.5" cy="17.5" r="2.5" />
              <circle cx="18.5" cy="17.5" r="2.5" />
              <path d="M3 5h11l2 7H5L3 5z" />
              <path d="M15 12h4l2 5" />
            </svg>
          </div>
          <span className="lg-logo-text">Favorcito</span>
        </div>

        <h2 className="lg-title">Inicia sesión</h2>
        <p className="lg-subtitle">Accede a tu cuenta y continúa con tu pedido.</p>

        <form className="lg-form" onSubmit={handleSubmit}>
          {error && (
            error === "SUSPENDIDO" ? (
              <div className="lg-suspended">
                <p className="lg-suspended-title">
                  <svg className="lg-suspended-svg" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                  Cuenta suspendida
                </p>
                <span className="lg-suspended-text">
                  Tu cuenta ha sido suspendida por el administrador.
                </span>
                <button
                  type="button"
                  onClick={() => setMostrarApelacion(true)}
                  className="lg-suspended-btn"
                >
                  <svg className="lg-suspended-btn-svg" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Enviar apelación
                </button>
              </div>
            ) : (
              <div className="lg-error-block">
                <div className="lg-error">
                  <svg className="lg-error-svg" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>

                {verificacionPendiente && (
                  <div className="lg-verification-actions">
                    <button
                      type="button"
                      onClick={reenviarVerificacion}
                      disabled={reenviandoVerificacion || cargando}
                      className="lg-reverify-btn"
                    >
                      {reenviandoVerificacion ? "Reenviando..." : "Reenviar verificación"}
                    </button>
                    <Link
                      to="/verificar-codigo"
                      state={{ email: email.trim() }}
                      className="lg-reverify-link"
                    >
                      Ya tengo mi código
                    </Link>
                  </div>
                )}
              </div>
            )
          )}

          <div className="lg-field">
            <label className="lg-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="lg-input"
              placeholder="tu@email.com"
            />
          </div>

          <div className="lg-field">
            <label className="lg-label">Contraseña</label>
            <div className="lg-input-wrap">
              <input
                type={verContrasena ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="lg-input lg-input--pr"
                placeholder="Tu contraseña"
              />
              <button
                type="button"
                onClick={() => setVerContrasena(!verContrasena)}
                className="lg-pw-toggle"
              >
                {verContrasena ? (
                  <svg className="lg-pw-toggle-svg" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="lg-pw-toggle-svg" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="lg-forgot-row">
            <Link to="/recuperar-contrasena" className="lg-forgot">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button type="submit" disabled={cargando} className="lg-btn">
            {cargando ? "Ingresando..." : "Iniciar Sesión"}
          </button>

          <p className="lg-footer">
            ¿No tienes cuenta?
            <Link to="/registro" className="lg-link">
              {" "}
              Regístrate aquí
            </Link>
          </p>
        </form>
        </div>
      </section>

      {mostrarApelacion && (
        <div className="lg-overlay">
          <div className="lg-modal">
            {apelacionEnviada ? (
              <div className="lg-success">
                <div className="lg-success-ring">
                  <div className="lg-success-icon">
                    <svg className="lg-success-svg" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
                <p className="lg-success-title">Apelación enviada</p>
                <p className="lg-success-text">
                  El administrador revisará tu caso y te contactará por correo.
                </p>
                <button
                  className="lg-btn"
                  onClick={() => {
                    setMostrarApelacion(false);
                    setApelacionEnviada(false);
                  }}
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <p className="lg-modal-title">
                  <svg className="lg-modal-title-svg" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Formulario de apelación
                </p>
                <div className="lg-form">
                  <input
                    type="text"
                    placeholder="Tu nombre completo"
                    value={apelacion.nombre}
                    onChange={(e) =>
                      setApelacion({ ...apelacion, nombre: e.target.value })
                    }
                    className="lg-input"
                  />
                  <input
                    type="email"
                    placeholder="Tu correo"
                    value={apelacion.email}
                    onChange={(e) =>
                      setApelacion({ ...apelacion, email: e.target.value })
                    }
                    className="lg-input"
                  />
                  <textarea
                    placeholder="¿Por qué crees que tu cuenta debería reactivarse?"
                    value={apelacion.motivo}
                    onChange={(e) =>
                      setApelacion({ ...apelacion, motivo: e.target.value })
                    }
                    rows={4}
                    className="lg-textarea"
                  />
                  <div className="lg-modal-actions">
                    <button
                      onClick={handleApelar}
                      disabled={enviandoApelacion}
                      className="lg-btn"
                    >
                      {enviandoApelacion ? "Enviando..." : "Enviar apelación"}
                    </button>
                    <button
                      onClick={() => setMostrarApelacion(false)}
                      className="lg-btn-cancel"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
