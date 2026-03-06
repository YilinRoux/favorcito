import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

function DashboardAdmin() {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get("/admin/resumen");
        setResumen(res.data);
      } catch {
        console.error("Error al cargar resumen");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  if (cargando) return <div className="p-10 text-gray-500">Cargando...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Panel Administrador</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Total Usuarios</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">{resumen?.totalUsuarios}</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Total Locales</p>
          <p className="text-4xl font-bold text-green-600 mt-2">{resumen?.totalLocales}</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Locales Pendientes</p>
          <p className="text-4xl font-bold text-yellow-500 mt-2">{resumen?.localesPendientes}</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-gray-500 text-sm">Total Pedidos</p>
          <p className="text-4xl font-bold text-purple-600 mt-2">{resumen?.totalPedidos}</p>
        </div>
      </div>

     
      </div>
  );
}

export default DashboardAdmin;