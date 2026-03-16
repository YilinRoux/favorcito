import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { NotificationContext } from "../../context/NotificationContext";
import "../../styles/estudiante/MisPedidos.css";

const estadoLabel = {
  enviado:        "Enviado",
  aceptado:       "Aceptado",
  en_preparacion: "En preparación",
  listo:          "Listo para recoger",
  en_camino:      "En camino",
  entregado:      "Entregado",
  cancelado:      "Cancelado",
};

// Iconos SVG por estado
const EstadoIcon = ({ estado }) => {
  const icons = {
    enviado: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    ),
    aceptado: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    en_preparacion: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    listo: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    en_camino: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    entregado: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    cancelado: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
  };
  return icons[estado] || null;
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

  if (cargando) return (
    <div className="mp-wrap">
      <div className="mp-orb-1" /><div className="mp-orb-2" />
      <div className="mp-loading">
        <div className="mp-loading-spinner" />
        <span>Cargando pedidos...</span>
      </div>
    </div>
  );

  return (
    <div className="mp-wrap">
      <div className="mp-orb-1" />
      <div className="mp-orb-2" />
      <div className="mp-particles" aria-hidden="true">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="mp-p" style={{ '--dur': `${6 + i}s`, '--delay': `${i * 0.9}s`, left: `${8 + i * 13}%`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px` }} />
        ))}
      </div>

      <div className="mp-inner">

        {/* ── Header ── */}
        <div className="mp-header">
          <div className="mp-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 8h14M5 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4m14 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/>
            </svg>
          </div>
          <div>
            <h2 className="mp-title">Mis Pedidos</h2>
            <p className="mp-subtitle">
              {pedidos.length > 0 ? `${pedidos.length} pedido${pedidos.length !== 1 ? "s" : ""}` : "Historial de órdenes"}
            </p>
          </div>
        </div>

        {/* ── Empty state ── */}
        {pedidos.length === 0 ? (
          <div className="mp-empty-card">
            <div className="mp-empty-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 8h14M5 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4m14 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/>
              </svg>
            </div>
            <p className="mp-empty-text">No tienes pedidos aún.</p>
            <button onClick={() => navigate("/menu")} className="mp-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Ver locales
            </button>
          </div>
        ) : (
          <div className="mp-lista">
            {pedidos.map((pedido, i) => (
              <div key={pedido._id} className={`mp-card mp-card--${pedido.estado}`} style={{ animationDelay: `${i * 0.07}s` }}>

                {/* ── Cabecera del pedido ── */}
                <div className="mp-card-top">
                  <div className="mp-card-info">
                    <p className="mp-local-nombre">{pedido.local?.nombre}</p>
                    <div className="mp-entrega-tipo">
                      {pedido.tipoEntrega === "favorcito" ? (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                            <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                          </svg>
                          Favorcito
                        </>
                      ) : (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                          Recoger en local
                        </>
                      )}
                    </div>
                    <p className="mp-total">${pedido.total}</p>
                    {pedido.promocionAplicada && (
                      <div className="mp-promo-tag">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Promoción aplicada
                      </div>
                    )}
                  </div>
                  <span className={`mp-estado-chip mp-estado-chip--${pedido.estado}`}>
                    <EstadoIcon estado={pedido.estado} />
                    {estadoLabel[pedido.estado]}
                  </span>
                </div>

                {/* ── Productos ── */}
                <div className="mp-productos">
                  {pedido.productos?.map((item, j) => (
                    <div key={j} className="mp-producto-row">
                      <span className="mp-producto-qty">{item.cantidad}×</span>
                      <span className="mp-producto-nombre">{item.nombre}</span>
                      <span className="mp-producto-precio">${item.precio}</span>
                    </div>
                  ))}
                </div>

                {/* ── Acciones ── */}
                <div className="mp-acciones">
                  <button onClick={() => navigate(`/rastreo/${pedido._id}`)} className="mp-btn mp-btn--rastrear">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    Rastrear
                  </button>

                  <button onClick={() => navigate(`/chat/${pedido._id}`)} className="mp-btn mp-btn--chat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Chat
                    {notificaciones[pedido._id] > 0 && (
                      <span className="mp-notif-badge">{notificaciones[pedido._id]}</span>
                    )}
                  </button>

                  {pedido.estado === "enviado" && (
                    <button onClick={() => cancelar(pedido._id)} className="mp-btn mp-btn--cancelar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      Cancelar
                    </button>
                  )}

                  {pedido.estado === "entregado" && (
                    <button onClick={() => navigate(`/calificar/${pedido._id}`)} className="mp-btn mp-btn--calificar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      Calificar
                    </button>
                  )}
                </div>

                {/* ── Fecha ── */}
                <p className="mp-fecha">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {new Date(pedido.createdAt).toLocaleDateString("es-MX", {
                    year: "numeric", month: "long", day: "numeric"
                  })}
                </p>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default MisPedidos;