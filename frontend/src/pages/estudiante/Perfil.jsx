import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

function Perfil() {
  const { usuario, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [confirmarLogout, setConfirmarLogout] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!usuario) {
    navigate("/login");
    return null;
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">👤 Mi Perfil</h2>

      {/* Info del usuario */}
      <div className="bg-white rounded-2xl shadow p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
            {usuario.rol === "estudiante" ? "🧑‍🎓" : usuario.rol === "vendedor" ? "🏪" : "⚙️"}
          </div>
          <div>
            <p className="font-bold text-gray-800 text-lg">{usuario.nombre}</p>
            <p className="text-gray-500 text-sm">{usuario.email}</p>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
              {usuario.rol}
            </span>
          </div>
        </div>
      </div>

      {/* Opciones */}
      <div className="bg-white rounded-2xl shadow mb-4">
        <button
          onClick={() => navigate("/mis-pedidos")}
          className="w-full text-left px-6 py-4 hover:bg-gray-50 transition border-b rounded-t-2xl"
        >
          <p className="font-medium text-gray-800">📦 Mis pedidos</p>
          <p className="text-gray-400 text-sm">Ver historial de pedidos</p>
        </button>

        {usuario.rol === "estudiante" && (
          <button
            onClick={() => navigate("/favorcito")}
            className="w-full text-left px-6 py-4 hover:bg-gray-50 transition border-b"
          >
            <p className="font-medium text-gray-800">🛵 Favorcito</p>
            <p className="text-gray-400 text-sm">Ver pedidos disponibles para entregar</p>
          </button>
        )}

        {usuario.rol === "estudiante" && (
          <button
            onClick={() => navigate("/mis-entregas")}
            className="w-full text-left px-6 py-4 hover:bg-gray-50 transition rounded-b-2xl"
          >
            <p className="font-medium text-gray-800">📬 Mis entregas</p>
            <p className="text-gray-400 text-sm">Ver entregas que has realizado</p>
          </button>
        )}
      </div>

      {/* Cerrar sesión */}
      {!confirmarLogout ? (
        <button
          onClick={() => setConfirmarLogout(true)}
          className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-medium hover:bg-red-100 transition"
        >
          Cerrar sesión
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-gray-700 font-medium mb-3 text-center">¿Seguro que quieres salir?</p>
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
            >
              Sí, salir
            </button>
            <button
              onClick={() => setConfirmarLogout(false)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Perfil;