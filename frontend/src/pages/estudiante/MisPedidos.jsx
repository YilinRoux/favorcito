import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { NotificationContext } from "../../context/NotificationContext";

const estadoColores = {
  enviado: "bg-yellow-100 text-yellow-700",
  aceptado: "bg-blue-100 text-blue-700",
  en_preparacion: "bg-orange-100 text-orange-700",
  listo: "bg-green-100 text-green-700",
  en_camino: "bg-purple-100 text-purple-700",
  entregado: "bg-gray-100 text-gray-700",
  cancelado: "bg-red-100 text-red-700",
};

const estadoLabel = {
  enviado: "Enviado",
  aceptado: "Aceptado",
  en_preparacion: "En preparación",
  listo: "Listo para recoger",
  en_camino: "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

function MisPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { notificaciones } = useContext(NotificationContext);
  const navigate = useNavigate();

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get("/pedidos/mis-pedidos");
        setPedidos(res.data);
      } catch {
        setPedidos([]);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const cancelar = async (pedidoId) => {
    if (!confirm("¿Seguro que quieres cancelar este pedido?")) return;
    try {
      await api.put(`/pedidos/${pedidoId}/cancelar`);
      setPedidos((prev) =>
        prev.map((p) => (p._id === pedidoId ? { ...p, estado: "cancelado" } : p))
      );
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al cancelar pedido");
    }
  };

  if (cargando) return <div className="p-10 text-gray-500">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📦 Mis Pedidos</h2>

      {pedidos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
          No tienes pedidos aún.
          <button
            onClick={() => navigate("/menu")}
            className="block mx-auto mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Ver locales
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <div key={pedido._id} className="bg-white rounded-2xl shadow p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-gray-800">{pedido.local?.nombre}</p>
                  <p className="text-gray-500 text-sm">
                    {pedido.tipoEntrega === "favorcito" ? "🛵 Favorcito" : "🏃 Recoger en local"}
                  </p>
                  <p className="text-blue-600 font-bold mt-1">${pedido.total}</p>
                  {pedido.promocionAplicada && (
                    <p className="text-green-600 text-xs">🎉 Promoción aplicada</p>
                  )}
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${estadoColores[pedido.estado]}`}>
                  {estadoLabel[pedido.estado]}
                </span>
              </div>

              {/* Productos */}
              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                {pedido.productos?.map((item, i) => (
                  <p key={i} className="text-gray-600 text-sm">
                    {item.cantidad}x {item.nombre} — ${item.precio}
                  </p>
                ))}
              </div>

              {/* Botones */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => navigate(`/rastreo/${pedido._id}`)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm"
                >
                  📍 Rastrear
                </button>

                <button
                  onClick={() => navigate(`/chat/${pedido._id}`)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition text-sm relative"
                >
                  💬 Chat
                  {notificaciones[pedido._id] > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {notificaciones[pedido._id]}
                    </span>
                  )}
                </button>

                {pedido.estado === "enviado" && (
                  <button
                    onClick={() => cancelar(pedido._id)}
                    className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition text-sm"
                  >
                    ❌ Cancelar
                  </button>
                )}
              </div>

              <p className="text-gray-400 text-xs mt-3">
                {new Date(pedido.createdAt).toLocaleDateString("es-MX", {
                  year: "numeric", month: "long", day: "numeric"
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MisPedidos;