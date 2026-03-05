import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import socket from "../../services/socket";

function Favorcito() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  const cargar = async () => {
    try {
      const res = await api.get("/pedidos/favorcito/disponibles");
      setPedidos(res.data);
    } catch {
      setPedidos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    socket.on("estadoActualizado", ({ estado }) => {
      if (estado === "listo") cargar();
    });
    const interval = setInterval(cargar, 10000);
    return () => {
      socket.off("estadoActualizado");
      clearInterval(interval);
    };
  }, []);

  const aceptar = async (pedidoId) => {
    if (!confirm("¿Aceptar este favorcito?")) return;
    try {
      await api.put(`/pedidos/favorcito/${pedidoId}/aceptar`);
      navigate(`/pedido/${pedidoId}`);
    } catch {
      alert("Error al aceptar pedido");
    }
  };

  if (cargando) return <div style={{ padding: "40px" }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>🛵 Favorcitos disponibles</h2>
        <button
          onClick={cargar}
          style={{ padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}
        >
          🔄 Actualizar
        </button>
      </div>

      {pedidos.length === 0 ? (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "40px", textAlign: "center", color: "#9ca3af" }}>
          No hay favorcitos disponibles por ahora.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {pedidos.map((pedido) => (
            <div key={pedido._id} style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>

              {/* Cabecera */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div>
                  <p style={{ fontWeight: "700", fontSize: "15px", margin: 0 }}>{pedido.local?.nombre}</p>
                  <p style={{ color: "#6b7280", fontSize: "13px", margin: "4px 0 0 0" }}>📍 {pedido.local?.direccion}</p>
                </div>
                <p style={{ fontWeight: "700", color: "#3b82f6", fontSize: "15px", margin: 0 }}>${pedido.total}</p>
              </div>

              {/* Productos */}
              <div style={{ borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", padding: "8px 0", marginBottom: "10px" }}>
                {pedido.productos?.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#374151", padding: "2px 0" }}>
                    <span>{item.cantidad}x {item.nombre}</span>
                    <span>${item.precio * item.cantidad}</span>
                  </div>
                ))}
              </div>

              {/* Aviso efectivo */}
              <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: "8px", padding: "8px 12px", marginBottom: "10px" }}>
                <p style={{ color: "#92400e", fontSize: "13px", fontWeight: "600", margin: "0 0 2px 0" }}>
                  💵 Pago en efectivo — cobras al entregar
                </p>
                <p style={{ color: "#92400e", fontSize: "13px", margin: 0 }}>
                  Comida: <strong>${pedido.total - (pedido.costoEnvio || 0)}</strong> + Envío: <strong>${pedido.costoEnvio || 15}</strong> = Total: <strong>${pedido.total}</strong>
                </p>
              </div>

              {pedido.promocionAplicada && (
                <p style={{ color: "#16a34a", fontSize: "12px", margin: "0 0 10px 0" }}>
                  🎉 Envío gratis — el local cubre el costo
                </p>
              )}

              <button
                onClick={() => aceptar(pedido._id)}
                style={{ width: "100%", padding: "10px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}
              >
                🛵 Aceptar favorcito
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorcito;