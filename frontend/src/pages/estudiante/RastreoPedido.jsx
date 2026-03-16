import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import socket from "../../services/socket";
import "../../styles/estudiante/RastreoPedido.css";

const estadoLabel = {
  enviado:        "Pedido enviado",
  aceptado:       "Pedido aceptado",
  en_preparacion: "En preparación",
  listo:          "Listo",
  en_camino:      "En camino",
  entregado:      "Entregado",
  cancelado:      "Cancelado",
};

const pasosFavorcito = ["enviado", "aceptado", "en_preparacion", "listo", "en_camino", "entregado"];
const pasosRecoger   = ["enviado", "aceptado", "en_preparacion", "listo", "entregado"];

// SVG por paso del timeline
const PasoIcon = ({ paso, completado }) => {
  const icons = {
    enviado: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    ),
    aceptado: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    en_preparacion: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    listo: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    en_camino: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    entregado: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  };
  if (completado) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
  return icons[paso] || null;
};

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

  if (cargando) return (
    <div className="rp-wrap">
      <div className="rp-orb-1" /><div className="rp-orb-2" />
      <div className="rp-loading">
        <div className="rp-loading-spinner" />
        <span>Cargando rastreo...</span>
      </div>
    </div>
  );

  if (!pedido) return null;

  const esFavorcito  = pedido.tipoEntrega === "favorcito";
  const estadoPasos  = esFavorcito ? pasosFavorcito : pasosRecoger;
  const pasoActual   = estadoPasos.indexOf(pedido.estado);
  const progresoPct  = pedido.estado === "cancelado" ? 0 : Math.round((pasoActual / (estadoPasos.length - 1)) * 100);

  return (
    <div className="rp-wrap">
      <div className="rp-orb-1" />
      <div className="rp-orb-2" />
      <div className="rp-particles" aria-hidden="true">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="rp-p" style={{ '--dur': `${6 + i}s`, '--delay': `${i * 0.9}s`, left: `${8 + i * 13}%`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px` }} />
        ))}
      </div>

      <div className="rp-inner">

        {/* ── Back + Header ── */}
        <div className="rp-topbar">
          <button onClick={() => navigate("/mis-pedidos")} className="rp-back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Mis pedidos
          </button>
        </div>

        <div className="rp-header">
          <div className="rp-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div>
            <h2 className="rp-title">Rastreo del Pedido</h2>
            <p className="rp-subtitle">Actualización en tiempo real</p>
          </div>
          {/* Pulso de live */}
          <div className="rp-live">
            <span className="rp-live-dot" />
            Live
          </div>
        </div>

        {/* ── Info del pedido ── */}
        <div className="rp-card">
          <p className="rp-local-nombre">{pedido.local?.nombre}</p>
          <div className="rp-entrega-tipo">
            {esFavorcito ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                Favorcito — te lo llevan
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Recoger en local — pasa por tu pedido
              </>
            )}
          </div>
          <p className="rp-total">${pedido.total}</p>
          {pedido.promocionAplicada && (
            <div className="rp-promo-tag">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Envío gratis aplicado
            </div>
          )}
        </div>

        {/* ── Estado cancelado ── */}
        {pedido.estado === "cancelado" && (
          <div className="rp-card rp-card--cancelado">
            <div className="rp-cancelado-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <p className="rp-cancelado-txt">Pedido cancelado</p>
          </div>
        )}

        {/* ── Progreso / Timeline ── */}
        {pedido.estado !== "cancelado" && (
          <div className="rp-card rp-card--progreso">
            {/* Encabezado con barra de progreso */}
            <div className="rp-progreso-header">
              <p className="rp-progreso-titulo">
                {esFavorcito ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                )}
                {esFavorcito ? "Seguimiento Favorcito" : "Seguimiento Recoger en local"}
              </p>
              <span className="rp-progreso-pct">{progresoPct}%</span>
            </div>

            {/* Barra de progreso */}
            <div className="rp-progress-bar-wrap">
              <div className="rp-progress-bar" style={{ width: `${progresoPct}%` }} />
            </div>

            {/* Timeline de pasos */}
            <div className="rp-timeline">
              {estadoPasos.map((paso, i) => {
                const completado = i < pasoActual;
                const activo     = i === pasoActual;
                return (
                  <div key={paso} className="rp-paso">
                    {/* Línea conectora */}
                    {i < estadoPasos.length - 1 && (
                      <div className={`rp-paso-linea${completado ? " rp-paso-linea--done" : ""}`} />
                    )}

                    {/* Círculo de estado */}
                    <div className={`rp-paso-circulo${completado ? " rp-paso-circulo--done" : activo ? " rp-paso-circulo--activo" : " rp-paso-circulo--pendiente"}`}>
                      {activo && <span className="rp-paso-ping" />}
                      <PasoIcon paso={paso} completado={completado} />
                    </div>

                    {/* Etiqueta */}
                    <div className="rp-paso-info">
                      <p className={`rp-paso-label${activo ? " rp-paso-label--activo" : completado ? " rp-paso-label--done" : " rp-paso-label--pendiente"}`}>
                        {estadoLabel[paso]}
                      </p>
                      {activo && <p className="rp-paso-sub">Estado actual</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Productos ── */}
        <div className="rp-card">
          <p className="rp-section-title">Productos</p>
          <div className="rp-productos">
            {pedido.productos?.map((item, i) => (
              <div key={i} className="rp-producto-row" style={{ animationDelay: `${i * 0.06}s` }}>
                <span className="rp-producto-qty">{item.cantidad}×</span>
                <span className="rp-producto-nombre">{item.nombre}</span>
                <span className="rp-producto-precio">${item.precio * item.cantidad}</span>
              </div>
            ))}
          </div>
          <div className="rp-total-row">
            <span>Total</span>
            <span className="rp-total-monto">${pedido.total}</span>
          </div>
        </div>

        {/* ── Acciones ── */}
        <div className="rp-acciones">
          <button onClick={() => navigate(`/chat/${pedido._id}`)} className="rp-btn rp-btn--chat">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Chat con el local
          </button>

          {pedido.estado === "entregado" && (
            <button onClick={() => navigate(`/calificar/${pedido._id}`)} className="rp-btn rp-btn--calificar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Calificar pedido
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default RastreoPedido;