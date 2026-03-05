import { useEffect, useState } from "react";
import api from "../../services/api";

const motivoLabels = {
  mal_servicio: "Mal servicio",
  producto_en_mal_estado: "Producto en mal estado",
  cancelacion_injustificada: "Cancelación injustificada",
  comportamiento_inapropiado: "Comportamiento inapropiado",
  otro: "Otro",
};

function GestionReportes() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("pendiente");

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get("/admin/reportes");
        setReportes(res.data);
      } catch {
        setReportes([]);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const resolver = async (id) => {
    try {
      await api.put(`/admin/reportes/${id}/resolver`);
      setReportes((prev) =>
        prev.map((r) => (r._id === id ? { ...r, estado: "resuelto" } : r))
      );
    } catch {
      alert("Error al resolver reporte");
    }
  };

  const reportesFiltrados = reportes.filter((r) => r.estado === filtro);

  if (cargando) return <div className="p-10 text-gray-500">Cargando...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Reportes</h2>

      {/* Filtro */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setFiltro("pendiente")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filtro === "pendiente"
              ? "bg-yellow-500 text-white"
              : "bg-white text-gray-600 border"
          }`}
        >
          Pendientes ({reportes.filter((r) => r.estado === "pendiente").length})
        </button>
        <button
          onClick={() => setFiltro("resuelto")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filtro === "resuelto"
              ? "bg-green-500 text-white"
              : "bg-white text-gray-600 border"
          }`}
        >
          Resueltos ({reportes.filter((r) => r.estado === "resuelto").length})
        </button>
      </div>

      {reportesFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
          No hay reportes {filtro === "pendiente" ? "pendientes" : "resueltos"}.
        </div>
      ) : (
        <div className="space-y-4">
          {reportesFiltrados.map((reporte) => (
            <div key={reporte._id} className="bg-white rounded-2xl shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      reporte.tipoReportado === "local"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {reporte.tipoReportado === "local" ? "🏪 Local" : "👤 Estudiante"}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      {motivoLabels[reporte.motivo]}
                    </span>
                  </div>

                  <p className="text-gray-700 font-medium">
                    Reportante: {reporte.reportante?.nombre_completo}
                    <span className="text-gray-400 text-sm ml-2">({reporte.reportante?.rol})</span>
                  </p>

                  {reporte.tipoReportado === "local" && (
                    <p className="text-gray-600 text-sm mt-1">
                      Local: {reporte.localReportado?.nombre}
                    </p>
                  )}

                  {reporte.tipoReportado === "estudiante" && (
                    <p className="text-gray-600 text-sm mt-1">
                      Estudiante: {reporte.estudianteReportado?.nombre_completo}
                    </p>
                  )}

                  {reporte.descripcion && (
                    <p className="text-gray-500 text-sm mt-2 bg-gray-50 p-3 rounded-lg">
                      "{reporte.descripcion}"
                    </p>
                  )}

                  <p className="text-gray-400 text-xs mt-2">
                    {new Date(reporte.createdAt).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {reporte.estado === "pendiente" && (
                  <button
                    onClick={() => resolver(reporte._id)}
                    className="ml-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-sm font-medium"
                  >
                    Resolver
                  </button>
                )}

                {reporte.estado === "resuelto" && (
                  <span className="ml-4 text-green-600 font-medium text-sm">✅ Resuelto</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GestionReportes;