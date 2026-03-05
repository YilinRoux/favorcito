import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function EstadoSolicitud() {
  const [local, setLocal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const obtener = async () => {
      try {
        const res = await api.get("/locales/mi-local");
        setLocal(res.data);
      } catch {
        setLocal(null);
      } finally {
        setCargando(false);
      }
    };
    obtener();
  }, []);

  if (cargando) return <div className="p-10 text-gray-500">Cargando...</div>;

  if (!local) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
        <p className="text-gray-600 mb-4">No tienes ninguna solicitud registrada.</p>
        <button
          onClick={() => navigate("/vendedor/solicitar")}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Solicitar Alta
        </button>
      </div>
    </div>
  );

  const estadoConfig = {
    true: { texto: "Aprobado ✅", color: "text-green-600", bg: "bg-green-50 border-green-200" },
    false: { texto: "Pendiente ⏳", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  };

  const config = estadoConfig[local.aprobado] || estadoConfig[false];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Estado de tu Solicitud</h2>

        <div className={`border rounded-lg p-4 mb-6 ${config.bg}`}>
          <p className={`text-lg font-bold ${config.color}`}>{config.texto}</p>
          {!local.aprobado && (
            <p className="text-gray-600 text-sm mt-1">Tu solicitud está siendo revisada por un administrador.</p>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-gray-500 text-sm">Nombre</p>
            <p className="font-semibold text-gray-800">{local.nombre}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Descripción</p>
            <p className="text-gray-700">{local.descripcion}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Dirección</p>
            <p className="text-gray-700">{local.direccion}</p>
          </div>
        </div>

        {local.aprobado && (
          <button
            onClick={() => navigate("/vendedor/dashboard")}
            className="w-full mt-6 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition"
          >
            Ir a mi Dashboard
          </button>
        )}
      </div>
    </div>
  );
}

export default EstadoSolicitud;