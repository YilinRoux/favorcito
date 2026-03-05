import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Inicio() {
  const { usuario } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (usuario) {
      if (usuario.rol === "estudiante") navigate("/perfil");
      else if (usuario.rol === "vendedor") navigate("/vendedor/dashboard");
      else if (usuario.rol === "admin") navigate("/admin/dashboard");
    }
  }, [usuario, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🍽️ UT Tehuacán</h1>
        <p className="text-gray-500 mb-8">Plataforma de pedidos universitaria</p>

        <div className="space-y-3 mb-6">
          <button
            onClick={() => navigate("/registro?rol=estudiante")}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition"
          >
            🧑‍🎓 Soy Estudiante
          </button>
          <button
            onClick={() => navigate("/registro?rol=vendedor")}
            className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition"
          >
            🏪 Soy Vendedor
          </button>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="text-blue-500 hover:underline font-medium"
        >
          Ya tengo cuenta → Iniciar sesión
        </button>
      </div>
    </div>
  );
}