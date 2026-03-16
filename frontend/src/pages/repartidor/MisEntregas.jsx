import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/repartidor/MisEntregas.css";

const estadoLabel = {
  en_camino: "En camino",
  entregado:  "Entregado",
  cancelado:  "Cancelado",
};

function MisEntregas() {
  const [entregas, setEntregas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get("/pedidos/favorcito/mis-entregas");
        setEntregas(res.data);
      } catch {
        setEntregas([]);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  if (cargando) return (
    <div className="me-wrap">
      <div className="me-orb-1" /><div className="me-orb-2" />
      <div className="me-loading">
        <div className="me-loading-spinner" />
        <span>Cargando entregas...</span>
      </div>
    </div>
  );

  return (
    <div className="me-wrap">
      <div className="me-orb-1" />
      <div className="me-orb-2" />
      <div className="me-particles" aria-hidden="true">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="me-p" style={{ '--dur': `${6 + i}s`, '--delay': `${i * 0.9}s`, left: `${8 + i * 13}%`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px` }} />
        ))}
      </div>

      <div className="me-inner">

        {/* ── Header ── */}
        <div className="me-header">
          <div className="me-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <div>
            <h2 className="me-title">Mis Entregas</h2>
            <p className="me-subtitle">
              {entregas.length > 0
                ? `${entregas.length} entrega${entregas.length !== 1 ? "s" : ""} realizadas`
                : "Historial de tus favorcitos"}
            </p>
          </div>
        </div>

        {/* ── Empty state ── */}
        {entregas.length === 0 ? (
          <div className="me-empty">
            <div className="me-empty-icon">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <p className="me-empty-title">No has realizado entregas aún.</p>
            <p className="me-empty-sub">Acepta un favorcito para empezar a ganar.</p>
            <button onClick={() => navigate("/favorcito")} className="me-btn me-btn--cta">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              Ver favorcitos disponibles
            </button>
          </div>
        ) : (
          <div className="me-lista">
            {entregas.map((entrega, i) => (
              <div key={entrega._id} className={`me-card me-card--${entrega.estado}`} style={{ animationDelay: `${i * 0.07}s` }}>

                {/* ── Top ── */}
                <div className="me-card-top">
                  <div className="me-card-info">
                    <p className="me-local-nombre">{entrega.local?.nombre}</p>
                    <div className="me-fecha">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {new Date(entrega.createdAt).toLocaleDateString("es-MX", {
                        year: "numeric", month: "long", day: "numeric"
                      })}
                    </div>
                  </div>
                  <div className="me-card-right">
                    <p className="me-total">${entrega.total}</p>
                    <span className={`me-estado-chip me-estado-chip--${entrega.estado}`}>
                      {entrega.estado === "entregado" && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                      {entrega.estado === "en_camino" && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                          <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                        </svg>
                      )}
                      {entrega.estado === "cancelado" && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      )}
                      {estadoLabel[entrega.estado] || entrega.estado}
                    </span>
                  </div>
                </div>

                {/* ── Productos ── */}
                <div className="me-productos">
                  {entrega.productos?.map((item, j) => (
                    <div key={j} className="me-producto-row">
                      <span className="me-producto-qty">{item.cantidad}×</span>
                      <span className="me-producto-nombre">{item.nombre}</span>
                    </div>
                  ))}
                </div>

                {/* ── Botón entrega activa ── */}
                {entrega.estado === "en_camino" && (
                  <button onClick={() => navigate(`/pedido/${entrega._id}`)} className="me-btn me-btn--activa">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13"/>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                    Ver entrega activa
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>
                )}

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default MisEntregas;