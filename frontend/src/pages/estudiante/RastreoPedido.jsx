import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import socket from "../../services/socket";

const estadoLabel = {
  enviado: "Pedido enviado",
  aceptado: "Pedido aceptado",
  en_preparacion: "En preparación",
  listo: "Listo",
  en_camino: "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

// Pasos según tipo de entrega
const pasosFavorcito = ["enviado", "aceptado", "en_preparacion", "listo", "en_camino", "entregado"];
const pasosRecoger = ["enviado", "aceptado", "en_preparacion", "listo", "entregado"];

function RastreoPedido() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    try {
      const res = await api.get(`/pedidos/${id}`);
      setPedido(res.data);
    } catch {
      navigate("/mis-pedidos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();

    socket.emit("unirsePedido", id);

    // Escuchar cambio de estado en tiempo real
    socket.on("estadoActualizado", () => cargar());
    socket.on("pedidoActualizado", () => cargar());

    const interval = setInterval(cargar, 8000);

    return () => {
      clearInterval(interval);
      socket.off("estadoActualizado");
      socket.off("pedidoActualizado");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (cargando) return <div style={{ padding: "40px", color: "#6b7280" }}>Cargando...</div>;
  if (!pedido) return null;

  const esFavorcito = pedido.tipoEntrega === "favorcito";
  const estadoPasos = esFavorcito ? pasosFavorcito : pasosRecoger;
  const pasoActual = estadoPasos.indexOf(pedido.estado);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>

      <button onClick={() => navigate("/mis-pedidos")} style={{ color: "#3b82f6", marginBottom: "16px", display: "block" }}>
        ← Mis pedidos
      </button>

      <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>📍 Rastreo del Pedido</h2>

      {/* Info */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
        <p style={{ fontWeight: "700", fontSize: "16px" }}>{pedido.local?.nombre}</p>
        <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px" }}>
          {esFavorcito ? "🛵 Favorcito — te lo llevan" : "🏃 Recoger en local — pasa por tu pedido"}
        </p>
        <p style={{ fontWeight: "700", color: "#3b82f6", marginTop: "8px" }}>${pedido.total}</p>
        {pedido.promocionAplicada && (
          <p style={{ color: "#16a34a", fontSize: "12px" }}>🎉 Envío gratis aplicado</p>
        )}
      </div>

      {/* Estado cancelado */}
      {pedido.estado === "cancelado" && (
        <div style={{ border: "1px solid #fca5a5", borderRadius: "12px", padding: "16px", marginBottom: "12px", textAlign: "center", background: "#fef2f2" }}>
          <p style={{ color: "#dc2626", fontWeight: "700" }}>❌ Pedido cancelado</p>
        </div>
      )}

      {/* Progreso */}
      {pedido.estado !== "cancelado" && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
          <p style={{ fontWeight: "700", marginBottom: "16px" }}>
            {esFavorcito ? "🛵 Seguimiento Favorcito" : "🏃 Seguimiento Recoger en local"}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {estadoPasos.map((paso, i) => {
              const completado = i < pasoActual;
              const activo = i === pasoActual;
              return (
                <div key={paso} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: "700", fontSize: "13px", flexShrink: 0,
                    background: completado ? "#22c55e" : activo ? "#3b82f6" : "#f3f4f6",
                    color: completado || activo ? "white" : "#9ca3af",
                  }}>
                    {completado ? "✓" : i + 1}
                  </div>
                  <div>
                    <p style={{
                      fontWeight: activo ? "700" : "400",
                      color: activo ? "#3b82f6" : completado ? "#16a34a" : "#9ca3af",
                      fontSize: "14px",
                    }}>
                      {estadoLabel[paso]}
                    </p>
                    {activo && (
                      <p style={{ fontSize: "11px", color: "#9ca3af" }}>Estado actual</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Productos */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
        <p style={{ fontWeight: "700", marginBottom: "12px" }}>Productos</p>
        {pedido.productos?.map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", paddingBottom: "4px" }}>
            <span>{item.cantidad}x {item.nombre}</span>
            <span>${item.precio * item.cantidad}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "8px", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: "700" }}>
          <span>Total</span>
          <span style={{ color: "#3b82f6" }}>${pedido.total}</span>
        </div>
      </div>

      {/* Botones */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => navigate(`/chat/${pedido._id}`)}
          style={{ flex: 1, padding: "12px", border: "1px solid #e5e7eb", borderRadius: "12px", cursor: "pointer", fontWeight: "600" }}
        >
          💬 Chat con el local
        </button>
        {pedido.estado === "entregado" && (
          <button
            onClick={() => navigate(`/calificar/${pedido._id}`)}
            style={{ flex: 1, padding: "12px", background: "#3b82f6", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "600" }}
          >
            ⭐ Calificar
          </button>
        )}
      </div>
    </div>
  );
}

export default RastreoPedido;