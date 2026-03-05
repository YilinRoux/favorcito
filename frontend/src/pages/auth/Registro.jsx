import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

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

    // Validaciones
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

    // Validación del correo institucional para estudiantes
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
        año_academico: rol === "estudiante" ? año_academico : undefined
      });

      // ✅ Redirigir a verificar código
      navigate("/verificar-codigo", { 
        state: { email } 
      });

    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al registrarse");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-10">
      <h2 className="text-2xl font-bold mb-6">
        Registro {rol && `como ${rol}`}
      </h2>

      {!rol ? (
        <div>
          <p className="mb-4">Selecciona el tipo de usuario:</p>
          <div className="flex gap-4">
            <Link
              to="/registro?rol=estudiante"
              className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600"
            >
              Registrarme como Estudiante
            </Link>
            <Link
              to="/registro?rol=vendedor"
              className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600"
            >
              Registrarme como Vendedor
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleRegistro} className="max-w-md">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block mb-2">Nombre completo</label>
            <input
              type="text"
              value={nombre_completo}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              placeholder="Juan Pérez García"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">
              Email {rol === "estudiante" && "(Correo institucional)"}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              placeholder={
                rol === "estudiante" 
                  ? "a123456@alumno.uttehuacan.edu.mx" 
                  : "tu@email.com"
              }
            />
            {rol === "estudiante" && (
              <p className="text-sm text-gray-600 mt-1">
                Debes usar tu correo institucional
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {rol === "estudiante" && (
            <div className="mb-4">
              <label className="block mb-2">Año Académico</label>
              <select
                value={año_academico}
                onChange={(e) => setAñoAcademico(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">Selecciona tu año</option>
                <option value="1">1er año</option>
                <option value="2">2do año</option>
                <option value="3">3er año</option>
                <option value="4">4to año</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {cargando ? "Registrando..." : "Registrarme"}
          </button>

          <p className="mt-4 text-center">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-blue-500 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

export default Registro;