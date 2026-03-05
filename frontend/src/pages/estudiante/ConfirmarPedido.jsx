import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";

function ConfirmarPedido() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const carrito = state?.carrito || [];
  const local = state?.local || null;

  const [tipoEntrega, setTipoEntrega] = useState("recoger");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  const envioGratis =
    local?.promocionActiva &&
    tipoEntrega === "favorcito" &&
    total >= local?.montoMinimoPromocion;

  if (!carrito.length || !local) {
    navigate("/menu");
    return null;
  }

  const handleConfirmar = async () => {
    setError("");
    setCargando(true);

    try {
      const res = await api.post("/pedidos", {
        productos: carrito.map((p) => ({
          producto: p.producto,
          cantidad: p.cantidad,
        })),
        tipoEntrega,
      });

      navigate(`/rastreo/${res.data.pedido._id}`);
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al crear pedido");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        🛒 Confirmar Pedido
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Info del local */}
      <div className="bg-white rounded-2xl shadow p-5 mb-4">
        <p className="text-gray-500 text-sm">Local</p>
        <p className="font-bold text-gray-800 text-lg">{local.nombre}</p>
        <p className="text-gray-400 text-sm">📍 {local.direccion}</p>
      </div>

      {/* Productos */}
      <div className="bg-white rounded-2xl shadow p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-3">Productos</h3>
        <div className="space-y-2">
          {carrito.map((item, i) => (
            <div key={i} className="flex justify-between items-center">
              <div>
                <p className="text-gray-800">{item.nombre}</p>
                <p className="text-gray-400 text-sm">x{item.cantidad}</p>
              </div>
              <p className="font-semibold text-gray-800">
                ${item.precio * item.cantidad}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t mt-3 pt-3 flex justify-between">
          <p className="font-bold text-gray-800">Total</p>
          <p className="font-bold text-blue-600 text-lg">${total}</p>
        </div>
      </div>

      {/* Tipo de entrega */}
      <div className="bg-white rounded-2xl shadow p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-3">Tipo de entrega</h3>
        <div className="space-y-3">
          <button
            onClick={() => setTipoEntrega("recoger")}
            className={`w-full p-4 rounded-xl border-2 text-left transition ${
              tipoEntrega === "recoger"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className="font-semibold text-gray-800">
              🏃 Recoger en local
            </p>
            <p className="text-gray-500 text-sm">
              Recoge tu pedido directamente en el local
            </p>
          </button>

          <button
            onClick={() => setTipoEntrega("favorcito")}
            className={`w-full p-4 rounded-xl border-2 text-left transition ${
              tipoEntrega === "favorcito"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className="font-semibold text-gray-800">🛵 Favorcito</p>
            <p className="text-gray-500 text-sm">
              Un estudiante te lo lleva
            </p>

            {local.promocionActiva && (
              <p className="text-green-600 text-xs mt-1">
                {total >= local.montoMinimoPromocion
                  ? "🎉 ¡Envío gratis activado!"
                  : `Agrega $${
                      local.montoMinimoPromocion - total
                    } más para envío gratis`}
              </p>
            )}
          </button>

          {/* 🔥 AVISO DE COSTO DE ENVÍO */}
          {tipoEntrega === "favorcito" && (
            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
                padding: "10px 12px",
                marginTop: "8px",
              }}
            >
              <p
                style={{
                  color: "#1d4ed8",
                  fontSize: "13px",
                  fontWeight: "600",
                  margin: "0 0 2px 0",
                }}
              >
                🛵 Costo de envío: <strong>$15</strong>
              </p>
              <p
                style={{
                  color: "#1d4ed8",
                  fontSize: "12px",
                  margin: 0,
                }}
              >
                El repartidor cobra en efectivo al entregar. El envío se suma
                al total de tu pedido.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Resumen final */}
      {envioGratis && (
        <div className="bg-green-50 border border-green-200 px-4 py-3 rounded-xl mb-4">
          <p className="text-green-700 font-medium">
            🎉 ¡Promoción aplicada! Envío gratis
          </p>
        </div>
      )}

      <button
        onClick={handleConfirmar}
        disabled={cargando}
        className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-600 disabled:bg-gray-400 transition"
      >
        {cargando ? "Procesando..." : "Confirmar Pedido"}
      </button>
    </div>
  );
}

export default ConfirmarPedido;