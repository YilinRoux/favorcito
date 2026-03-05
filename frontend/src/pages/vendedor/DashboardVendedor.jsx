import { useEffect, useState, useContext } from "react";
import api from "../../services/api";
import { NotificationContext } from "../../context/NotificationContext";
import { Link, useNavigate } from "react-router-dom";
import socket from "../../services/socket";

const estadoLabel = {
  enviado: "Nuevo",
  aceptado: "Aceptado",
  en_preparacion: "En preparación",
  listo: "Listo",
  en_camino: "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const siguienteEstado = {
  aceptado: "en_preparacion",
  en_preparacion: "listo",
  listo: "entregado",
};

const siguienteLabel = {
  aceptado: "Marcar en preparación",
  en_preparacion: "Marcar listo",
  listo: "Cliente recogió ✅",
};

function DashboardVendedor() {
  const [pedidos, setPedidos] = useState([]);
  const [local, setLocal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState("nuevos");
  const { notificaciones } = useContext(NotificationContext);
  const navigate = useNavigate();

  const cargar = async () => {
    try {
      const localRes = await api.get("/locales/mi-local");
      setLocal(localRes.data);
      if (!localRes.data.aprobado) {
        navigate("/vendedor/estado");
        return;
      }
      const pedidosRes = await api.get("/pedidos/vendedor");
      setPedidos(pedidosRes.data);
    } catch {
      navigate("/vendedor/solicitar");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    socket.on("estadoActualizado", () => cargar());
    const interval = setInterval(cargar, 15000);
    return () => {
      socket.off("estadoActualizado");
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const aceptarPedido = async (pedidoId) => {
    try {
      const res = await api.put(`/pedidos/${pedidoId}/aceptar`, { tiempoEstimado: 20 });
      setPedidos((prev) => prev.map((p) => (p._id === pedidoId ? res.data.pedido : p)));
    } catch {
      alert("Error al aceptar pedido");
    }
  };

  const avanzarEstado = async (pedidoId, estadoActual) => {
    const nuevoEstado = siguienteEstado[estadoActual];
    if (!nuevoEstado) return;
    try {
      const res = await api.put(`/pedidos/${pedidoId}/estado`, { nuevoEstado });
      setPedidos((prev) => prev.map((p) => (p._id === pedidoId ? res.data.pedido : p)));
    } catch {
      alert("Error al cambiar estado");
    }
  };

  const cancelarPorVendedor = async (pedidoId) => {
    if (!confirm("¿Cancelar este pedido? Se registrará como cancelación del estudiante.")) return;
    try {
      await api.put(`/pedidos/${pedidoId}/cancelar-vendedor`);
      setPedidos((prev) => prev.map((p) => p._id === pedidoId ? { ...p, estado: "cancelado" } : p));
    } catch {
      alert("Error al cancelar pedido");
    }
  };

  const reportarEstudiante = async (estudianteId) => {
    if (!confirm("¿Reportar a este estudiante por cancelación injustificada?")) return;
    try {
      await api.post("/reportes", {
        tipoReportado: "estudiante",
        estudianteReportado: estudianteId,
        motivo: "cancelacion_injustificada",
      });
      alert("Reporte enviado al administrador");
    } catch {
      alert("Error al reportar");
    }
  };

  const pedidosNuevos = pedidos.filter((p) => p.estado === "enviado");
  const pedidosEnProceso = pedidos.filter((p) => ["aceptado", "en_preparacion", "listo", "en_camino"].includes(p.estado));
  const pedidosCompletados = pedidos.filter((p) => ["entregado", "cancelado"].includes(p.estado));

  const hoy = new Date().toDateString();
  const pedidosHoy = pedidos.filter((p) => new Date(p.createdAt).toDateString() === hoy);
  const ventasHoy = pedidosHoy.filter((p) => p.estado === "entregado").reduce((acc, p) => acc + p.total, 0);

  if (cargando) return <div style={{ padding: "40px" }}>Cargando...</div>;

  const CardPedido = ({ pedido }) => (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>

      {pedido.estudiante?.sospechoso && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "8px 12px", marginBottom: "10px", fontSize: "13px", color: "#dc2626", fontWeight: "600" }}>
          ⚠️ Usuario con cancelaciones frecuentes ({pedido.estudiante.cancelaciones} cancelaciones)
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <p style={{ fontWeight: "700", fontSize: "15px", margin: 0 }}>Pedido #{pedido._id.slice(-6)}</p>
          <p style={{ color: "#6b7280", fontSize: "13px", margin: "4px 0 2px 0" }}>
            Cliente: {pedido.estudiante?.nombre_completo || "Desconocido"}
          </p>
          {pedido.estudiante?.cancelaciones > 0 && !pedido.estudiante?.sospechoso && (
            <p style={{ color: "#f97316", fontSize: "12px", margin: "0 0 2px 0" }}>
              {pedido.estudiante.cancelaciones} cancelación(es) previa(s)
            </p>
          )}
          <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
            {pedido.tipoEntrega === "favorcito" ? "🛵 Favorcito" : "🏃 Recoger en local"}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontWeight: "700", fontSize: "13px", margin: 0 }}>{estadoLabel[pedido.estado]}</p>
          <p style={{ fontWeight: "700", color: "#3b82f6", fontSize: "15px", margin: "4px 0 0 0" }}>${pedido.total}</p>
          {pedido.promocionAplicada && (
            <p style={{ color: "#16a34a", fontSize: "12px", margin: "2px 0 0 0" }}>🎉 Envío gratis</p>
          )}
        </div>
      </div>

      <div style={{ borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", padding: "8px 0", marginBottom: "12px" }}>
        {pedido.productos?.map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#374151", padding: "2px 0" }}>
            <span>{item.cantidad}x {item.nombre}</span>
            <span>${item.precio * item.cantidad}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <Link
          to={`/chat/${pedido._id}`}
          style={{ padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px", textDecoration: "none", color: "#374151", position: "relative" }}
        >
          💬 Chat
          {notificaciones[pedido._id] > 0 && (
            <span style={{ position: "absolute", top: "-6px", right: "-6px", background: "red", color: "white", borderRadius: "50%", width: "18px", height: "18px", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {notificaciones[pedido._id]}
            </span>
          )}
        </Link>

        {pedido.estado === "enviado" && (
          <button onClick={() => aceptarPedido(pedido._id)} style={{ padding: "6px 14px", background: "#22c55e", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
            ✅ Aceptar pedido
          </button>
        )}

        {["aceptado", "en_preparacion"].includes(pedido.estado) && (
          <button onClick={() => cancelarPorVendedor(pedido._id)} style={{ padding: "6px 12px", border: "1px solid #fca5a5", borderRadius: "8px", fontSize: "13px", color: "#dc2626", cursor: "pointer", background: "white" }}>
            ❌ Cancelar pedido
          </button>
        )}

        {pedido.estado !== "listo" && siguienteEstado[pedido.estado] && pedido.estado !== "enviado" && (
          <button onClick={() => avanzarEstado(pedido._id, pedido.estado)} style={{ padding: "6px 14px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
            ➡️ {siguienteLabel[pedido.estado]}
          </button>
        )}

        {pedido.estado === "listo" && pedido.tipoEntrega === "recoger" && (
          <button onClick={() => avanzarEstado(pedido._id, pedido.estado)} style={{ padding: "6px 14px", background: "#16a34a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
            ✅ Cliente recogió
          </button>
        )}

        {pedido.estado === "listo" && pedido.tipoEntrega === "favorcito" && (
          <p style={{ fontSize: "13px", color: "#7c3aed", fontWeight: "600", margin: 0 }}>🛵 Esperando repartidor...</p>
        )}

        {pedido.estado === "en_camino" && (
          <p style={{ fontSize: "13px", color: "#7c3aed", fontWeight: "600", margin: 0 }}>🛵 En camino al cliente</p>
        )}

        {pedido.estado === "cancelado" && pedido.estudiante?._id && (
          <button onClick={() => reportarEstudiante(pedido.estudiante._id)} style={{ padding: "6px 12px", border: "1px solid #fca5a5", borderRadius: "8px", fontSize: "13px", color: "#dc2626", cursor: "pointer", background: "white" }}>
            🚩 Reportar estudiante
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px" }}>

      {/* Info del local */}
      {local && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>{local.nombre}</h2>
              <p style={{ color: "#6b7280", fontSize: "14px", margin: "4px 0" }}>{local.descripcion}</p>
              <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>📍 {local.direccion}</p>
            </div>
            <span style={{ fontSize: "13px", color: "#16a34a", fontWeight: "600" }}>✅ Aprobado</span>
          </div>
          <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
            <Link to="/vendedor/menu" style={{ padding: "8px 14px", background: "#3b82f6", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: "600" }}>
              🍽️ Gestionar Menú
            </Link>
            <Link to="/vendedor/promocion" style={{ padding: "8px 14px", background: "#7c3aed", color: "white", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: "600" }}>
              🎉 Promoción y Anuncios
            </Link>
          </div>
        </div>
      )}

      {/* Resumen del día */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
          <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>Pedidos hoy</p>
          <p style={{ fontSize: "28px", fontWeight: "700", color: "#3b82f6", margin: "4px 0 0 0" }}>{pedidosHoy.length}</p>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
          <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>En proceso</p>
          <p style={{ fontSize: "28px", fontWeight: "700", color: "#f97316", margin: "4px 0 0 0" }}>{pedidosEnProceso.length}</p>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
          <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>Ventas hoy</p>
          <p style={{ fontSize: "28px", fontWeight: "700", color: "#16a34a", margin: "4px 0 0 0" }}>${ventasHoy}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid #e5e7eb", marginBottom: "20px" }}>
        <button
          onClick={() => setTab("nuevos")}
          style={{ padding: "10px 16px", fontSize: "14px", fontWeight: "600", cursor: "pointer", border: "none", background: "none", borderBottom: tab === "nuevos" ? "2px solid #f59e0b" : "2px solid transparent", color: tab === "nuevos" ? "#f59e0b" : "#6b7280", marginBottom: "-2px" }}
        >
          🔔 Nuevos {pedidosNuevos.length > 0 && <span style={{ background: "#f59e0b", color: "white", borderRadius: "50%", padding: "1px 6px", fontSize: "11px", marginLeft: "4px" }}>{pedidosNuevos.length}</span>}
        </button>
        <button
          onClick={() => setTab("proceso")}
          style={{ padding: "10px 16px", fontSize: "14px", fontWeight: "600", cursor: "pointer", border: "none", background: "none", borderBottom: tab === "proceso" ? "2px solid #3b82f6" : "2px solid transparent", color: tab === "proceso" ? "#3b82f6" : "#6b7280", marginBottom: "-2px" }}
        >
          ⏳ En Proceso {pedidosEnProceso.length > 0 && <span style={{ background: "#3b82f6", color: "white", borderRadius: "50%", padding: "1px 6px", fontSize: "11px", marginLeft: "4px" }}>{pedidosEnProceso.length}</span>}
        </button>
        <button
          onClick={() => setTab("completados")}
          style={{ padding: "10px 16px", fontSize: "14px", fontWeight: "600", cursor: "pointer", border: "none", background: "none", borderBottom: tab === "completados" ? "2px solid #22c55e" : "2px solid transparent", color: tab === "completados" ? "#22c55e" : "#6b7280", marginBottom: "-2px" }}
        >
          ✅ Completados {pedidosCompletados.length > 0 && <span style={{ background: "#22c55e", color: "white", borderRadius: "50%", padding: "1px 6px", fontSize: "11px", marginLeft: "4px" }}>{pedidosCompletados.length}</span>}
        </button>
      </div>

      {/* Contenido del tab */}
      {tab === "nuevos" && (
        pedidosNuevos.length === 0
          ? <p style={{ color: "#9ca3af", fontSize: "14px" }}>Sin pedidos nuevos.</p>
          : pedidosNuevos.map((p) => <CardPedido key={p._id} pedido={p} />)
      )}

      {tab === "proceso" && (
        pedidosEnProceso.length === 0
          ? <p style={{ color: "#9ca3af", fontSize: "14px" }}>Sin pedidos en proceso.</p>
          : pedidosEnProceso.map((p) => <CardPedido key={p._id} pedido={p} />)
      )}

      {tab === "completados" && (
        pedidosCompletados.length === 0
          ? <p style={{ color: "#9ca3af", fontSize: "14px" }}>Sin pedidos completados.</p>
          : pedidosCompletados.map((p) => <CardPedido key={p._id} pedido={p} />)
      )}
    </div>
  );
}

export default DashboardVendedor;