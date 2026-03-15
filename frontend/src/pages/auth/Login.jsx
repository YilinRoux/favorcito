import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

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
    <div className="p-10 flex justify-center">
      <div className="w-full max-w-md bg-white shadow-md rounded p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Iniciar Sesión
        </h2>

        <form onSubmit={handleSubmit}>

          {/* Bloque de error */}
          {error && (
            error === "SUSPENDIDO" ? (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
                <p style={{ color: "#dc2626", fontWeight: "700", fontSize: "14px", margin: "0 0 6px 0" }}>
                  🚫 Cuenta suspendida
                </p>
                <p style={{ color: "#dc2626", fontSize: "13px", margin: "0 0 10px 0" }}>
                  Tu cuenta ha sido suspendida por el administrador.
                </p>
                <button
                  type="button"
                  onClick={() => setMostrarApelacion(true)}
                  style={{ padding: "6px 14px", background: "#dc2626", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
                >
                  📝 Enviar apelación
                </button>
              </div>
            ) : (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="tu@email.com"
            />
          </div>

          {/* Contraseña con toggle */}
          <div className="mb-2">
            <label className="block mb-2">Contraseña</label>
            <div style={{ position: "relative" }}>
              <input
                type={verContrasena ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Tu contraseña"
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setVerContrasena(!verContrasena)}
                style={{
                  position: "absolute", right: "10px", top: "50%",
                  transform: "translateY(-50%)", background: "none",
                  border: "none", cursor: "pointer", fontSize: "18px",
                  color: "#6b7280", padding: 0, lineHeight: 1
                }}
              >
                {verContrasena ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Olvidaste tu contraseña */}
          <div className="mb-6 text-right">
            <Link
              to="/recuperar-contrasena"
              className="text-sm text-blue-500 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition disabled:bg-gray-400"
          >
            {cargando ? "Ingresando..." : "Iniciar Sesión"}
          </button>

          <p className="mt-4 text-center">
            ¿No tienes cuenta?{" "}
            <Link to="/registro" className="text-blue-500 hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </form>
      </div>

      {/* Modal apelación */}
      {mostrarApelacion && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "400px" }}>
            {apelacionEnviada ? (
              <>
                <p style={{ fontWeight: "700", fontSize: "16px", margin: "0 0 10px 0" }}>✅ Apelación enviada</p>
                <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 16px 0" }}>
                  El administrador revisará tu caso y te contactará por correo.
                </p>
                <button
                  onClick={() => { setMostrarApelacion(false); setApelacionEnviada(false); }}
                  style={{ width: "100%", padding: "10px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
                >
                  Cerrar
                </button>
              </>
            ) : (
              <>
                <p style={{ fontWeight: "700", fontSize: "16px", margin: "0 0 16px 0" }}>📝 Formulario de apelación</p>

                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={apelacion.nombre}
                  onChange={(e) => setApelacion({ ...apelacion, nombre: e.target.value })}
                  style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", marginBottom: "10px", outline: "none", boxSizing: "border-box" }}
                />
                <input
                  type="email"
                  placeholder="Tu correo"
                  value={apelacion.email}
                  onChange={(e) => setApelacion({ ...apelacion, email: e.target.value })}
                  style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", marginBottom: "10px", outline: "none", boxSizing: "border-box" }}
                />
                <textarea
                  placeholder="¿Por qué crees que tu cuenta debería reactivarse?"
                  value={apelacion.motivo}
                  onChange={(e) => setApelacion({ ...apelacion, motivo: e.target.value })}
                  rows={4}
                  style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", marginBottom: "16px", outline: "none", resize: "none", boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleApelar}
                    disabled={enviandoApelacion}
                    style={{ flex: 1, padding: "10px", background: enviandoApelacion ? "#d1d5db" : "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: enviandoApelacion ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "13px" }}
                  >
                    {enviandoApelacion ? "Enviando..." : "Enviar"}
                  </button>
                  <button
                    onClick={() => setMostrarApelacion(false)}
                    style={{ flex: 1, padding: "10px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}