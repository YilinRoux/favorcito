import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import socket from "../../services/socket";

function DetallePedido() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [entregando, setEntregando] = useState(false);

  const cargar = async () => {
    try {
      const res = await api.get(`/pedidos/${id}`);
      setPedido(res.data);
    } catch {
      navigate("/favorcito");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    socket.emit("unirsePedido", id);
    socket.on("estadoActualizado", () => cargar());
    return () => socket.off("estadoActualizado");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const confirmarEntrega = async () => {
    if (!confirm("¿Confirmar que entregaste el pedido?")) return;
    setEntregando(true);
    try {
      await api.put(`/pedidos/favorcito/${id}/entregar`);
      navigate("/mis-entregas");
    } catch {
      alert("Error al confirmar entrega");
    } finally {
      setEntregando(false);
    }
  };

  if (cargando) return <div style={{ padding: "40px" }}>Cargando...</div>;
  if (!pedido) return null;

  const subtotal = pedido.total - (pedido.costoEnvio || 0);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>

      <button
        onClick={() => navigate("/mis-entregas")}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#3b82f6", fontSize: "14px", marginBottom: "16px", display: "block" }}
      >
        ← Mis entregas
      </button>

      <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>🛵 Detalle del Favorcito</h2>

      {/* Info del local */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
        <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 6px 0" }}>Recoger en:</p>
        <p style={{ fontWeight: "700", fontSize: "15px", margin: "0 0 2px 0" }}>{pedido.local?.nombre}</p>
        <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>📍 {pedido.local?.direccion}</p>
      </div>

      {/* Productos */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
        <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 10px 0" }}>Productos a entregar</p>

        {pedido.productos?.map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#374151", padding: "2px 0" }}>
            <span>{item.cantidad}x {item.nombre}</span>
            <span>${item.precio * item.cantidad}</span>
          </div>
        ))}

        {/* Desglose */}
        <div style={{ borderTop: "1px solid #f3f4f6", marginTop: "8px", paddingTop: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", padding: "2px 0" }}>
            <span>Subtotal comida</span>
            <span>${subtotal}</span>
          </div>
          {pedido.costoEnvio > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", padding: "2px 0" }}>
              <span>Costo de envío</span>
              <span>${pedido.costoEnvio}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", fontSize: "14px", padding: "6px 0 0 0", borderTop: "1px solid #f3f4f6", marginTop: "4px" }}>
            <span>Total a cobrar</span>
            <span style={{ color: "#3b82f6" }}>${pedido.total}</span>
          </div>
        </div>

        {pedido.promocionAplicada && (
          <p style={{ color: "#16a34a", fontSize: "12px", margin: "6px 0 0 0" }}>
            🎉 Envío gratis — el local cubre el costo
          </p>
        )}

        {/* Aviso efectivo */}
        <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: "8px", padding: "10px 12px", marginTop: "10px" }}>
          <p style={{ color: "#92400e", fontSize: "13px", fontWeight: "600", margin: 0 }}>
            💵 El cliente paga en efectivo al recibir — cobrar <strong>${pedido.total}</strong>
          </p>
        </div>
      </div>

      {/* Estado */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
        <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 6px 0" }}>Estado actual</p>
        <p style={{ fontSize: "14px", margin: 0, color: pedido.estado === "en_camino" ? "#7c3aed" : "#16a34a", fontWeight: "600" }}>
          {pedido.estado === "en_camino" ? "🛵 En camino" : "✅ Entregado"}
        </p>
      </div>

      {/* Chat */}
      <button
        onClick={() => navigate(`/chat/${pedido._id}`)}
        style={{ width: "100%", padding: "10px", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600", marginBottom: "8px", background: "white" }}
      >
        💬 Chat con el local
      </button>

      {/* Confirmar entrega */}
      {pedido.estado === "en_camino" && (
        <button
          onClick={confirmarEntrega}
          disabled={entregando}
          style={{ width: "100%", padding: "12px", background: entregando ? "#d1d5db" : "#22c55e", color: "white", border: "none", borderRadius: "8px", cursor: entregando ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "14px" }}
        >
          {entregando ? "Confirmando..." : "✅ Confirmar entrega"}
        </button>
      )}

      {pedido.estado === "entregado" && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
          <p style={{ color: "#15803d", fontWeight: "700", margin: 0 }}>✅ Pedido entregado correctamente</p>
        </div>
      )}
    </div>
  );
}

export default DetallePedido;