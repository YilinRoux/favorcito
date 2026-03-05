import { useState, useEffect } from "react";
import api from "../../services/api";

function ValidarLocales() {
  const [locales, setLocales] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtener = async () => {
      try {
       const res = await api.get("/admin/locales-pendientes");
        setLocales(res.data);
      } catch {
        setLocales([]);
      } finally {
        setCargando(false);
      }
    };
    obtener();
  }, []);

  const handleDecision = async (id, aprobado) => {
    try {
      await api.put(`/locales/${id}/aprobar`, { aprobado });
      setLocales((prev) => prev.filter((l) => l._id !== id));
    } catch {
      alert("Error al procesar la solicitud");
    }
  };

  if (cargando) return <div className="p-10 text-gray-500">Cargando...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Solicitudes Pendientes</h2>

      {locales.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
          No hay solicitudes pendientes.
        </div>
      ) : (
        <div className="space-y-4">
          {locales.map((local) => (
            <div key={local._id} className="bg-white rounded-2xl shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{local.nombre}</h3>
                  <p className="text-gray-600 mt-1">{local.descripcion}</p>
                  <p className="text-gray-500 text-sm mt-1">📍 {local.direccion}</p>
                  {local.vendedor && (
                    <p className="text-gray-500 text-sm mt-1">
                      👤 {local.vendedor.nombre_completo} - {local.vendedor.email}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleDecision(local._id, true)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-medium"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleDecision(local._id, false)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ValidarLocales;