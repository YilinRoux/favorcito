import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/auth/Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

      if (status === 403 && mensaje?.includes("suspendida")) {
        setError("SUSPENDIDO");
      } else {
        setError(mensaje || "Credenciales inválidas");
      }
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
    <div className="auth-wrapper">

      {/* Partículas flotantes decorativas */}
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

        <h2 className="auth-title">Bienvenido de vuelta</h2>
        <p className="auth-subtitle">Ingresa a tu cuenta para continuar</p>

        <form className="auth-form" onSubmit={handleSubmit}>

          {/* Bloque de error */}
          {error && (
            error === "SUSPENDIDO" ? (
              <div className="auth-suspended-box">
                <p className="auth-suspended-title">🚫 Cuenta suspendida</p>
                <p className="auth-suspended-text">
                  Tu cuenta ha sido suspendida por el administrador.
                </p>
                <button
                  type="button"
                  onClick={() => setMostrarApelacion(true)}
                  className="auth-suspended-btn"
                >
                  📝 Enviar apelación
                </button>
              </div>
            ) : (
              <div className="auth-error">
                <span>⚠️</span>
                {error}
              </div>
            )
          )}

          {/* Email */}
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="tu@email.com"
            />
          </div>

          {/* Contraseña */}
          <div className="auth-field">
            <label className="auth-label">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Tu contraseña"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={cargando}
            className="auth-btn-submit"
          >
            {cargando ? "Ingresando..." : "Iniciar Sesión"}
          </button>

          {/* Redirect */}
          <p className="auth-footer">
            ¿No tienes cuenta?
            <Link to="/registro" className="auth-link"> Regístrate aquí</Link>
          </p>

        </form>
      </div>

      {/* Modal apelación */}
      {mostrarApelacion && (
        <div className="auth-modal-overlay">
          <div className="auth-modal">
            {apelacionEnviada ? (
              <div className="auth-success-banner">
                <div className="auth-success-icon">✅</div>
                <p className="auth-success-title">Apelación enviada</p>
                <p className="auth-success-text">
                  El administrador revisará tu caso y te contactará por correo.
                </p>
                <button
                  className="auth-btn-submit"
                  onClick={() => { setMostrarApelacion(false); setApelacionEnviada(false); }}
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <p className="auth-modal-title">📝 Formulario de apelación</p>
                <div className="auth-form">
                  <input
                    type="text"
                    placeholder="Tu nombre completo"
                    value={apelacion.nombre}
                    onChange={(e) => setApelacion({ ...apelacion, nombre: e.target.value })}
                    className="auth-input"
                  />
                  <input
                    type="email"
                    placeholder="Tu correo"
                    value={apelacion.email}
                    onChange={(e) => setApelacion({ ...apelacion, email: e.target.value })}
                    className="auth-input"
                  />
                  <textarea
                    placeholder="¿Por qué crees que tu cuenta debería reactivarse?"
                    value={apelacion.motivo}
                    onChange={(e) => setApelacion({ ...apelacion, motivo: e.target.value })}
                    rows={4}
                    className="auth-textarea"
                  />
                  <div className="auth-modal-actions">
                    <button
                      onClick={handleApelar}
                      disabled={enviandoApelacion}
                      className="auth-btn-submit"
                    >
                      {enviandoApelacion ? "Enviando..." : "Enviar"}
                    </button>
                    <button
                      onClick={() => setMostrarApelacion(false)}
                      className="auth-btn-cancel"
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