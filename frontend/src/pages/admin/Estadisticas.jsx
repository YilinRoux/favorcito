import { useEffect, useState } from "react";
import api from "../../services/api";

function Estadisticas() {
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get("/admin/estadisticas");
        setStats(res.data);
      } catch {
        console.error("Error al cargar estadísticas");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  if (cargando) return <div className="p-10 text-gray-500">Cargando...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Estadísticas</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Pedidos hoy</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">{stats?.pedidosHoy}</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Total generado</p>
          <p className="text-4xl font-bold text-green-600 mt-2">${stats?.totalGenerado}</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 col-span-2">
          <p className="text-gray-500 text-sm">Local con más ventas</p>
          <p className="text-2xl font-bold text-purple-600 mt-2">🏪 {stats?.localMasVentas}</p>
        </div>
      </div>
    </div>
  );
}

export default Estadisticas;