import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

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
                <p style={{ color: "#dc2626", fontSize: "13px", margin: "0 0 4px 0" }}>
                  Tu cuenta ha sido suspendida por el administrador.
                </p>
                <p style={{ color: "#dc2626", fontSize: "13px", margin: 0 }}>
                  Para apelar contacta a: <strong>admin@uttehuacan.edu.mx</strong>
                </p>
              </div>
            ) : (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )
          )}

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

          <div className="mb-6">
            <label className="block mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Tu contraseña"
            />
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
    </div>
  );
}