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
  const [mostrarApelacion, setMostrarApelacion] = useState(false);
  const [apelacion, setApelacion] = useState({ nombre: "", email: "", motivo: "" });
  const [enviandoApelacion, setEnviandoApelacion] = useState(false);
  const [apelacionEnviada, setApelacionEnviada] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    if (!email.trim() || !password.trim()) {
      setError("Todos los campos son obligatorios");
      setCargando(false);
      return;
    }
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data);
      const rol = res.data.usuario.rol;
      if (rol === "estudiante") navigate("/perfil");
      else if (rol === "vendedor") navigate("/vendedor/dashboard");
      else if (rol === "admin") navigate("/admin/dashboard");
      else navigate("/");
    } catch (err) {
      const status = err.response?.status;
      const mensaje = err.response?.data?.mensaje;
      if (status === 403 && mensaje?.includes("suspendida")) setError("SUSPENDIDO");
      else setError(mensaje || "Credenciales inválidas");
    } finally {
      setCargando(false);
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
    <div className="lg-wrap">
      <div className="lg-particles">
        {[...Array(7)].map((_, i) => <div key={i} className="lg-p" />)}
      </div>
      <div className="lg-orb lg-orb-1" />
      <div className="lg-orb lg-orb-2" />

      <div className="lg-card">

        {/* Logo */}
        <div className="lg-logo">
          <div className="lg-logo-icon">
            <svg className="lg-logo-icon-svg" viewBox="0 0 24 24">
              <circle cx="5.5" cy="17.5" r="2.5"/>
              <circle cx="18.5" cy="17.5" r="2.5"/>
              <path d="M3 5h11l2 7H5L3 5z"/>
              <path d="M15 12h4l2 5"/>
            </svg>
          </div>
          <span className="lg-logo-text">Favorcito</span>
        </div>

        <h2 className="lg-title">Bienvenido de vuelta</h2>
        <p className="lg-subtitle">Ingresa a tu cuenta para continuar</p>

        <form className="lg-form" onSubmit={handleSubmit}>

          {/* Error */}
          {error && (
            error === "SUSPENDIDO" ? (
              <div className="lg-suspended">
                <p className="lg-suspended-title">
                  <svg className="lg-suspended-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                  Cuenta suspendida
                </p>
                <span className="lg-suspended-text">Tu cuenta ha sido suspendida por el administrador.</span>
                <button type="button" onClick={() => setMostrarApelacion(true)} className="lg-suspended-btn">
                  <svg className="lg-suspended-btn-svg" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Enviar apelación
                </button>
              </div>
            ) : (
              <div className="lg-error">
                <svg className="lg-error-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )
          )}

          {/* Email */}
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

          {/* Contraseña con toggle */}
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
              <button type="button" onClick={() => setVerContrasena(!verContrasena)} className="lg-pw-toggle">
                {verContrasena ? (
                  <svg className="lg-pw-toggle-svg" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg className="lg-pw-toggle-svg" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* ¿Olvidaste tu contraseña? */}
          <div className="lg-forgot-row">
            <Link to="/recuperar-contrasena" className="lg-forgot">¿Olvidaste tu contraseña?</Link>
          </div>

          {/* Submit */}
          <button type="submit" disabled={cargando} className="lg-btn">
            {cargando ? "Ingresando..." : "Iniciar Sesión"}
          </button>

          <p className="lg-footer">
            ¿No tienes cuenta?
            <Link to="/registro" className="lg-link"> Regístrate aquí</Link>
          </p>
        </form>
      </div>

      {/* Modal apelación */}
      {mostrarApelacion && (
        <div className="lg-overlay">
          <div className="lg-modal">
            {apelacionEnviada ? (
              <div className="lg-success">
                <div className="lg-success-ring">
                  <div className="lg-success-icon">
                    <svg className="lg-success-svg" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                </div>
                <p className="lg-success-title">Apelación enviada</p>
                <p className="lg-success-text">El administrador revisará tu caso y te contactará por correo.</p>
                <button className="lg-btn" onClick={() => { setMostrarApelacion(false); setApelacionEnviada(false); }}>
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <p className="lg-modal-title">
                  <svg className="lg-modal-title-svg" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Formulario de apelación
                </p>
                <div className="lg-form">
                  <input type="text" placeholder="Tu nombre completo" value={apelacion.nombre} onChange={(e) => setApelacion({ ...apelacion, nombre: e.target.value })} className="lg-input" />
                  <input type="email" placeholder="Tu correo" value={apelacion.email} onChange={(e) => setApelacion({ ...apelacion, email: e.target.value })} className="lg-input" />
                  <textarea placeholder="¿Por qué crees que tu cuenta debería reactivarse?" value={apelacion.motivo} onChange={(e) => setApelacion({ ...apelacion, motivo: e.target.value })} rows={4} className="lg-textarea" />
                  <div className="lg-modal-actions">
                    <button onClick={handleApelar} disabled={enviandoApelacion} className="lg-btn">
                      {enviandoApelacion ? "Enviando..." : "Enviar apelación"}
                    </button>
                    <button onClick={() => setMostrarApelacion(false)} className="lg-btn-cancel">Cancelar</button>
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