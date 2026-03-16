import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import socket from "../../services/socket";
import "../../styles/repartidor/Favorcito.css";

function Favorcito() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
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

  const cargarManual = async () => {
    setActualizando(true);
    await cargar();
    setTimeout(() => setActualizando(false), 600);
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

  if (cargando) return (
    <div className="fav-wrap">
      <div className="fav-orb-1" /><div className="fav-orb-2" />
      <div className="fav-loading">
        <div className="fav-loading-spinner" />
        <span>Buscando favorcitos...</span>
      </div>
    </div>
  );

  return (
    <div className="fav-wrap">
      <div className="fav-orb-1" />
      <div className="fav-orb-2" />
      <div className="fav-particles" aria-hidden="true">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="fav-p" style={{ '--dur': `${6 + i}s`, '--delay': `${i * 0.85}s`, left: `${6 + i * 12}%`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px` }} />
        ))}
      </div>

      <div className="fav-inner">

        {/* ── Header ── */}
        <div className="fav-header">
          <div className="fav-header-left">
            <div className="fav-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div>
              <h2 className="fav-title">Favorcitos disponibles</h2>
              <p className="fav-subtitle">
                {pedidos.length > 0
                  ? `${pedidos.length} pedido${pedidos.length !== 1 ? "s" : ""} esperando repartidor`
                  : "Actualización automática cada 10s"}
              </p>
            </div>
          </div>

          <button
            onClick={cargarManual}
            className={`fav-btn-refresh${actualizando ? " fav-btn-refresh--spin" : ""}`}
            aria-label="Actualizar"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Actualizar
          </button>
        </div>

        {/* ── Vacío ── */}
        {pedidos.length === 0 ? (
          <div className="fav-empty">
            <div className="fav-empty-icon">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <p className="fav-empty-title">No hay favorcitos por ahora</p>
            <p className="fav-empty-sub">Cuando un local marque un pedido como listo, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="fav-lista">
            {pedidos.map((pedido, i) => (
              <div key={pedido._id} className="fav-card" style={{ animationDelay: `${i * 0.07}s` }}>

                {/* ── Cabecera de la card ── */}
                <div className="fav-card-top">
                  <div className="fav-card-local">
                    <p className="fav-local-nombre">{pedido.local?.nombre}</p>
                    <div className="fav-local-dir">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {pedido.local?.direccion}
                    </div>
                  </div>
                  <div className="fav-card-total">
                    <p className="fav-total-monto">${pedido.total}</p>
                    <p className="fav-total-label">a cobrar</p>
                  </div>
                </div>

                {/* ── Productos ── */}
                <div className="fav-productos">
                  {pedido.productos?.map((item, j) => (
                    <div key={j} className="fav-producto-row">
                      <span className="fav-producto-qty">{item.cantidad}×</span>
                      <span className="fav-producto-nombre">{item.nombre}</span>
                      <span className="fav-producto-precio">${item.precio * item.cantidad}</span>
                    </div>
                  ))}
                </div>

                {/* ── Desglose efectivo ── */}
                <div className="fav-aviso-efectivo">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  <div>
                    <p className="fav-aviso-title">Pago en efectivo — cobras al entregar</p>
                    <p className="fav-aviso-detalle">
                      Comida: <strong>${pedido.total - (pedido.costoEnvio || 0)}</strong>
                      {" + "}Envío: <strong>${pedido.costoEnvio || 15}</strong>
                      {" = "}Total: <strong>${pedido.total}</strong>
                    </p>
                  </div>
                </div>

                {/* Promo */}
                {pedido.promocionAplicada && (
                  <div className="fav-promo-note">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Envío gratis — el local cubre el costo
                  </div>
                )}

                {/* ── Botón aceptar ── */}
                <button onClick={() => aceptar(pedido._id)} className="fav-btn-aceptar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13"/>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                  Aceptar favorcito
                </button>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default Favorcito;