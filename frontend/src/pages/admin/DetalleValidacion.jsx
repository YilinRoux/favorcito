import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

function DetalleValidacion() {
  const { id } = useParams();
  const [local, setLocal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get(`/admin/local/${id}`);
        setLocal(res.data);
      } catch {
        navigate("/admin/validar");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id, navigate]);

  const handleDecision = async (aprobado) => {
    try {
      await api.put(`/locales/${id}/aprobar`, { aprobado });
      navigate("/admin/validar");
    } catch {
      alert("Error al procesar");
    }
  };

  if (cargando) return <div className="p-10 text-gray-500">Cargando...</div>;
  if (!local) return null;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button
        onClick={() => navigate("/admin/validar")}
        className="text-blue-500 hover:underline mb-6 block"
      >
        ← Volver
      </button>

      <div className="bg-white rounded-2xl shadow p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Detalle del Local</h2>

        <div className="space-y-4">
          <div>
            <p className="text-gray-500 text-sm">Nombre</p>
            <p className="font-semibold text-gray-800 text-lg">{local.nombre}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Descripción</p>
            <p className="text-gray-700">{local.descripcion}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Dirección</p>
            <p className="text-gray-700">📍 {local.direccion}</p>
          </div>

          <hr />

          <div>
            <p className="text-gray-500 text-sm">Vendedor</p>
            <p className="font-semibold text-gray-800">{local.vendedor?.nombre_completo}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Email del vendedor</p>
            <p className="text-gray-700">{local.vendedor?.email}</p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => handleDecision(true)}
            className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition"
          >
            ✅ Aprobar
          </button>
          <button
            onClick={() => handleDecision(false)}
            className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition"
          >
            ❌ Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}

export default DetalleValidacion;