import { AuthContext } from "../../context/AuthContext";
import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import socket from "../../services/socket";
import ReportarProblema from "../../components/common/ReportarProblema";
import AliasPedido from "../../components/common/AliasPedido";
import "../../styles/repartidor/DetallePedido.css";

function DetallePedido() {
  const { id } = useParams();
  const { usuario } = useContext(AuthContext);
  const [motivoDevolucion, setMotivoDevolucion] = useState("cliente_ausente");
  const [conservoPedido, setConservoPedido] = useState(false);
  const [solicitando, setSolicitando] = useState(false);
  const [errorDevolucion, setErrorDevolucion] = useState("");
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
    const actualizar = () => cargar();
    socket.on("estadoActualizado", actualizar);
    return () => socket.off("estadoActualizado", actualizar);
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

  const solicitarDevolucion = async (e) => {
    e.preventDefault();
    if (!conservoPedido || solicitando) return;
    setSolicitando(true); setErrorDevolucion("");
    try {
      const res = await api.put(`/pedidos/${id}/devolucion`, { motivo: motivoDevolucion, conservoPedido });
      setPedido((prev) => ({ ...prev, ...res.data.pedido, local: prev.local, estudiante: prev.estudiante }));
    } catch (err) { setErrorDevolucion(err.response?.data?.mensaje || "No se pudo solicitar la devolución"); }
    finally { setSolicitando(false); }
  };

  if (cargando) return (
    <div className="depd-wrap">
      <div className="depd-orb-1" /><div className="depd-orb-2" />
      <div className="depd-loading">
        <div className="depd-loading-spinner" />
        <span>Cargando detalle...</span>
      </div>
    </div>
  );

  if (!pedido) return null;

  const esRepartidor = String(pedido.repartidor?._id || pedido.repartidor) === String(usuario?._id || usuario?.id);
  const devolucionPendiente = pedido.devolucion?.estado === "pendiente";
  const subtotal = pedido.total - (pedido.costoEnvio || 0);

  return (
    <div className="depd-wrap">
      <div className="depd-orb-1" />
      <div className="depd-orb-2" />
      <div className="depd-particles" aria-hidden="true">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="depd-p" style={{ '--dur': `${6 + i}s`, '--delay': `${i * 0.9}s`, left: `${8 + i * 13}%`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px` }} />
        ))}
      </div>

      <div className="depd-inner">

        {/* ── Back ── */}
        <button onClick={() => navigate("/mis-entregas")} className="depd-back-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Mis entregas
        </button>

        {/* ── Header ── */}
        <div className="depd-header">
          <div className="depd-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div>
            <h2 className="depd-title">Detalle del Favorcito</h2>
            <p className="depd-subtitle">Información de entrega</p>
          </div>
          {/* Estado badge en el header */}
          <div className={`depd-estado-badge depd-estado-badge--${pedido.estado}`}>
            {pedido.estado === "en_camino" ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {devolucionPendiente ? "Devolución pendiente" : pedido.devolucion?.estado === "recibida" ? "Devuelto al local" : pedido.estado === "en_camino" ? "En camino" : pedido.estado === "cancelado" ? "Cancelado" : "Entregado"}
          </div>
        </div>

        {pedido.devolucion?.estado === "recibida" && <p className="st-delivery-notice" role="status">El vendedor confirmó la recepción. El pedido no se marcó como entregado al cliente; el local decidirá qué productos pueden reponerse.</p>}
        {devolucionPendiente && <div className="st-delivery-notice" role="status"><h3>Vuelve al local con el pedido</h3><p>Coordina por chat con el vendedor y entrega la comida completa. El vendedor debe confirmar la recepción. No lo marques como entregado al cliente.</p><p>Si corresponde, envía el reporte por separado para revisión administrativa.</p></div>}
        {/* ── Recoger en ── */}
        <div className="depd-card">
          <p className="depd-card-label">{pedido.devolucion ? "Local de devolución" : "Recoger en"}</p>
          <p className="depd-local-nombre">{pedido.local?.nombre}</p>
          {pedido.alias && (
            <p className="alias-linea">{pedido.devolucion ? "Identifica el pedido:" : "Pide en el local:"} <AliasPedido alias={pedido.alias} grande /><small>{pedido.devolucion ? "Entrega la comida al vendedor para que confirme la recepción." : `Y al entregar pregunta: «¿Eres ${pedido.alias}?»`}</small></p>
          )}
          <div className="depd-local-dir">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {pedido.local?.direccion}
          </div>
        </div>

        {/* ── Productos ── */}
        <div className="depd-card">
          <p className="depd-section-title">{pedido.devolucion ? "Productos del pedido devuelto" : "Productos a entregar"}</p>

          <div className="depd-productos">
            {pedido.productos?.map((item, i) => (
              <div key={i} className="depd-producto-row" style={{ animationDelay: `${i * 0.06}s` }}>
                <span className="depd-producto-qty">{item.cantidad}×</span>
                <span className="depd-producto-nombre">{item.nombre}</span>
                <span className="depd-producto-precio">${item.precio * item.cantidad}</span>
              </div>
            ))}
          </div>

          {/* Desglose totales */}
          <div className="depd-totales">
            <div className="depd-total-row">
              <span>Subtotal comida</span>
              <span>${subtotal}</span>
            </div>
            {pedido.costoEnvio > 0 && (
              <div className="depd-total-row">
                <span>Costo de envío</span>
                <span>${pedido.costoEnvio}</span>
              </div>
            )}
            <div className="depd-total-row depd-total-row--final">
              <span>{pedido.devolucion ? "Importe original del pedido" : "Total a cobrar"}</span>
              <span className="depd-total-monto">${pedido.total}</span>
            </div>
          </div>

          {pedido.promocionAplicada && (
            <div className="depd-promo-note">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Envío gratis — el local cubre el costo
            </div>
          )}

          {/* Aviso efectivo */}
          {!pedido.devolucion && <div className="depd-aviso-efectivo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <div>
              <p className="depd-aviso-efectivo-title">
                El cliente paga en efectivo al recibir — cobrar <strong>${pedido.total}</strong>
              </p>
            </div>
          </div>}
        </div>

        {/* ── Estado entregado ── */}
        {pedido.estado === "entregado" && (
          <div className="depd-card depd-card--entregado">
            <div className="depd-entregado-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <p className="depd-entregado-txt">Pedido entregado correctamente</p>
          </div>
        )}

        {/* ── Acciones ── */}
        <div className="depd-acciones">
          <button onClick={() => navigate(`/chat/${pedido._id}`)} className="depd-btn depd-btn--chat">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Chat con el local
          </button>

          {pedido.estado === "en_camino" && esRepartidor && !devolucionPendiente && (
            <button
              onClick={confirmarEntrega}
              disabled={entregando || solicitando}
              className={`depd-btn depd-btn--entregar${entregando ? " depd-btn--disabled" : ""}`}
            >
              {entregando ? (
                <>
                  <span className="depd-btn-spinner" />
                  Confirmando...
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Confirmar entrega
                </>
              )}
            </button>
          )}

          {pedido.estado === "en_camino" && esRepartidor && !devolucionPendiente && <details className="st-return-form">
            <summary>No pude entregar el pedido</summary>
            <p>Contacta primero al cliente por chat. Si conservas la comida, solicita regresar al local. Si ya entregaste el producto y solo falta el pago, usa el reporte; no solicites una devolución.</p>
            <form onSubmit={solicitarDevolucion}>
              <label>Motivo de la devolución<select value={motivoDevolucion} onChange={(e) => setMotivoDevolucion(e.target.value)}><option value="cliente_ausente">El cliente no apareció o no respondió</option><option value="no_recibio_pedido">El cliente rechazó el pedido</option><option value="no_pago">No pagó y no le entregué la comida</option></select></label>
              <label className="st-return-check"><input type="checkbox" checked={conservoPedido} onChange={(e) => setConservoPedido(e.target.checked)} />Conservo el pedido completo y lo devolveré al local.</label>
              {errorDevolucion && <p role="alert">{errorDevolucion}</p>}
              <button type="submit" disabled={!conservoPedido || solicitando || entregando}>{solicitando ? "Solicitando…" : "Solicitar devolución al local"}</button>
            </form>
          </details>}
          {esRepartidor && ["en_camino", "entregado", ...(pedido.devolucion ? ["cancelado"] : [])].includes(pedido.estado) && (
            <ReportarProblema pedidoId={pedido._id} rol="repartidor" />
          )}
        </div>

      </div>
    </div>
  );
}

export default DetallePedido;