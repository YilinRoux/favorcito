import { useEffect, useState, useContext } from "react";
import api from "../../services/api";
import { NotificationContext } from "../../context/NotificationContext";
import { Link, useNavigate } from "react-router-dom";
import socket from "../../services/socket";
import "../../styles/vendedor/DashboardVendedor.css";

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
      if (!localRes.data.aprobado) { navigate("/vendedor/estado"); return; }
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
    } catch { alert("Error al aceptar pedido"); }
  };

  const avanzarEstado = async (pedidoId, estadoActual) => {
    const nuevoEstado = siguienteEstado[estadoActual];
    if (!nuevoEstado) return;
    try {
      const res = await api.put(`/pedidos/${pedidoId}/estado`, { nuevoEstado });
      setPedidos((prev) => prev.map((p) => (p._id === pedidoId ? res.data.pedido : p)));
    } catch { alert("Error al cambiar estado"); }
  };

  const cancelarPorVendedor = async (pedidoId) => {
    if (!confirm("¿Cancelar este pedido? Se registrará como cancelación del estudiante.")) return;
    try {
      await api.put(`/pedidos/${pedidoId}/cancelar-vendedor`);
      setPedidos((prev) => prev.map((p) => p._id === pedidoId ? { ...p, estado: "cancelado" } : p));
    } catch { alert("Error al cancelar pedido"); }
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
    } catch { alert("Error al reportar"); }
  };

  const pedidosNuevos = pedidos.filter((p) => p.estado === "enviado");
  const pedidosEnProceso = pedidos.filter((p) => ["aceptado", "en_preparacion", "listo", "en_camino"].includes(p.estado));
  const pedidosCompletados = pedidos.filter((p) => ["entregado", "cancelado"].includes(p.estado));

  const hoy = new Date().toDateString();
  const pedidosHoy = pedidos.filter((p) => new Date(p.createdAt).toDateString() === hoy);
  const ventasHoy = pedidosHoy.filter((p) => p.estado === "entregado").reduce((acc, p) => acc + p.total, 0);

  if (cargando) return (
    <div className="dv-wrap">
      <div className="dv-orbe dv-orbe-1" /><div className="dv-orbe dv-orbe-2" />
      <p className="dv-loading">Cargando...</p>
    </div>
  );

  const CardPedido = ({ pedido }) => (
    <div className="dv-card-pedido">
      <div className="dv-card-top-border" />

      {pedido.estudiante?.sospechoso && (
        <div className="dv-alerta-sospechoso">
          <svg viewBox="0 0 24 24" fill="none" width="15" height="15">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Usuario con cancelaciones frecuentes ({pedido.estudiante.cancelaciones} cancelaciones)
        </div>
      )}

      <div className="dv-pedido-header">
        <div>
          <p className="dv-pedido-id">Pedido #{pedido._id.slice(-6)}</p>
          <p className="dv-pedido-cliente">Cliente: {pedido.estudiante?.nombre_completo || "Desconocido"}</p>
          {pedido.estudiante?.cancelaciones > 0 && !pedido.estudiante?.sospechoso && (
            <p className="dv-pedido-warning">{pedido.estudiante.cancelaciones} cancelación(es) previa(s)</p>
          )}
          <p className="dv-pedido-tipo">
            {pedido.tipoEntrega === "favorcito" ? (
              <><svg viewBox="0 0 24 24" fill="none" width="13" height="13" style={{display:"inline",marginRight:"4px",verticalAlign:"middle"}}><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-4 12a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4zm1-10H9a2 2 0 00-2 2v6h12v-6a2 2 0 00-2-2z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Favorcito</>
            ) : (
              <><svg viewBox="0 0 24 24" fill="none" width="13" height="13" style={{display:"inline",marginRight:"4px",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10" stroke="#666" strokeWidth="2"/><path d="M12 8v4l3 3" stroke="#666" strokeWidth="2" strokeLinecap="round"/></svg>Recoger en local</>
            )}
          </p>
        </div>
        <div className="dv-pedido-right">
          <p className="dv-pedido-estado">{estadoLabel[pedido.estado]}</p>
          <p className="dv-pedido-total">${pedido.total}</p>
          {pedido.promocionAplicada && (
            <p className="dv-pedido-promo">Envío gratis</p>
          )}
        </div>
      </div>

      <div className="dv-pedido-productos">
        {pedido.productos?.map((item, i) => (
          <div key={i} className="dv-producto-row">
            <span>{item.cantidad}x {item.nombre}</span>
            <span>${item.precio * item.cantidad}</span>
          </div>
        ))}
      </div>

      <div className="dv-pedido-actions">
        <Link to={`/chat/${pedido._id}`} className="dv-btn-chat">
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Chat
          {notificaciones[pedido._id] > 0 && (
            <span className="dv-chat-badge">{notificaciones[pedido._id]}</span>
          )}
        </Link>

        {pedido.estado === "enviado" && (
          <button onClick={() => aceptarPedido(pedido._id)} className="dv-btn-aceptar">
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            Aceptar pedido
          </button>
        )}

        {["aceptado", "en_preparacion"].includes(pedido.estado) && (
          <button onClick={() => cancelarPorVendedor(pedido._id)} className="dv-btn-cancelar">
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
            Cancelar pedido
          </button>
        )}

        {pedido.estado !== "listo" && siguienteEstado[pedido.estado] && pedido.estado !== "enviado" && (
          <button onClick={() => avanzarEstado(pedido._id, pedido.estado)} className="dv-btn-avanzar">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {siguienteLabel[pedido.estado]}
          </button>
        )}

        {pedido.estado === "listo" && pedido.tipoEntrega === "recoger" && (
          <button onClick={() => avanzarEstado(pedido._id, pedido.estado)} className="dv-btn-aceptar">
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            Cliente recogió
          </button>
        )}

        {pedido.estado === "listo" && pedido.tipoEntrega === "favorcito" && (
          <p className="dv-status-purple">Esperando repartidor...</p>
        )}

        {pedido.estado === "en_camino" && (
          <p className="dv-status-purple">En camino al cliente</p>
        )}

        {pedido.estado === "cancelado" && pedido.estudiante?._id && (
          <button onClick={() => reportarEstudiante(pedido.estudiante._id)} className="dv-btn-cancelar">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <path d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M9.363 5.365A9.466 9.466 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Reportar estudiante
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="dv-wrap">
      <div className="dv-orbe dv-orbe-1" />
      <div className="dv-orbe dv-orbe-2" />

      <div className="dv-container">

        {local && (
          <div className="dv-local-card">
            <div className="dv-card-top-border" />
            <div className="dv-local-header">
              <div>
                <h2 className="dv-local-nombre">{local.nombre}</h2>
                <p className="dv-local-desc">{local.descripcion}</p>
                <p className="dv-local-dir">
                  <svg viewBox="0 0 16 16" fill="none" width="12" height="12" style={{display:"inline",marginRight:"4px",verticalAlign:"middle"}}>
                    <path d="M8 1.5a4.5 4.5 0 00-4.5 4.5c0 3 4.5 8.5 4.5 8.5s4.5-5.5 4.5-8.5A4.5 4.5 0 008 1.5zm0 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="#666"/>
                  </svg>
                  {local.direccion}
                </p>
              </div>
              <span className="dv-local-badge">Aprobado</span>
            </div>
            <div className="dv-local-links">
              <Link to="/vendedor/menu" className="dv-link-blue">
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Gestionar Menú
              </Link>
              <Link to="/vendedor/promocion" className="dv-link-purple">
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Promoción y Anuncios
              </Link>
            </div>
          </div>
        )}

        <div className="dv-stats-grid">
          <div className="dv-stat-card">
            <div className="dv-card-top-border" />
            <p className="dv-stat-label">Pedidos hoy</p>
            <p className="dv-stat-value dv-stat-blue">{pedidosHoy.length}</p>
          </div>
          <div className="dv-stat-card">
            <div className="dv-card-top-border dv-top-orange" />
            <p className="dv-stat-label">En proceso</p>
            <p className="dv-stat-value dv-stat-orange">{pedidosEnProceso.length}</p>
          </div>
          <div className="dv-stat-card">
            <div className="dv-card-top-border dv-top-green" />
            <p className="dv-stat-label">Ventas hoy</p>
            <p className="dv-stat-value dv-stat-green">${ventasHoy}</p>
          </div>
        </div>

        <div className="dv-tabs">
          <button onClick={() => setTab("nuevos")} className={`dv-tab ${tab === "nuevos" ? "dv-tab-active-yellow" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Nuevos
            {pedidosNuevos.length > 0 && <span className="dv-tab-badge dv-badge-yellow">{pedidosNuevos.length}</span>}
          </button>
          <button onClick={() => setTab("proceso")} className={`dv-tab ${tab === "proceso" ? "dv-tab-active-blue" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            En Proceso
            {pedidosEnProceso.length > 0 && <span className="dv-tab-badge dv-badge-blue">{pedidosEnProceso.length}</span>}
          </button>
          <button onClick={() => setTab("completados")} className={`dv-tab ${tab === "completados" ? "dv-tab-active-green" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Completados
            {pedidosCompletados.length > 0 && <span className="dv-tab-badge dv-badge-green">{pedidosCompletados.length}</span>}
          </button>
        </div>

        <div className="dv-tab-content">
          {tab === "nuevos" && (
            pedidosNuevos.length === 0
              ? <p className="dv-empty-msg">Sin pedidos nuevos.</p>
              : pedidosNuevos.map((p) => <CardPedido key={p._id} pedido={p} />)
          )}
          {tab === "proceso" && (
            pedidosEnProceso.length === 0
              ? <p className="dv-empty-msg">Sin pedidos en proceso.</p>
              : pedidosEnProceso.map((p) => <CardPedido key={p._id} pedido={p} />)
          )}
          {tab === "completados" && (
            pedidosCompletados.length === 0
              ? <p className="dv-empty-msg">Sin pedidos completados.</p>
              : pedidosCompletados.map((p) => <CardPedido key={p._id} pedido={p} />)
          )}
        </div>

      </div>
    </div>
  );
}

export default DashboardVendedor;