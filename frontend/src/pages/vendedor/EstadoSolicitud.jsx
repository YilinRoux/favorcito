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

  // Determinar estado real
  const estado = local.aprobado ? "aprobado" : local.rechazado ? "rechazado" : "pendiente";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Estado de tu Solicitud</h2>

        {/* Banner de estado — solo se muestra si NO está aprobado */}
        {estado === "pendiente" && (
          <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-4 mb-6">
            <p className="text-yellow-700 font-bold text-lg">⏳ Solicitud enviada</p>
            <p className="text-yellow-600 text-sm mt-1">
              Tu solicitud fue recibida correctamente. Un administrador la revisará pronto.
              Te notificaremos por correo electrónico cuando haya una respuesta.
            </p>
          </div>
        )}

        {estado === "rechazado" && (
          <div className="border border-red-200 bg-red-50 rounded-xl p-4 mb-6">
            <p className="text-red-700 font-bold text-lg">❌ Solicitud rechazada</p>
            <p className="text-red-600 text-sm mt-1">
              Tu solicitud no fue aprobada por el administrador. Puedes enviar una nueva
              solicitud con información más completa o corregida.
            </p>
            <button
              onClick={() => navigate("/vendedor/solicitar")}
              className="mt-3 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition"
            >
              Enviar nueva solicitud
            </button>
          </div>
        )}

        {/* Datos del local */}
        <div className="space-y-3 mb-6">
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

        {/* Botón solo si está aprobado */}
        {estado === "aprobado" && (
          <button
            onClick={() => navigate("/vendedor/dashboard")}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition"
          >
            Ir a mi Dashboard ✅
          </button>
        )}
      </div>
    </div>
  );
}

export default EstadoSolicitud;