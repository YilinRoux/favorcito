import { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/admin/Apelaciones.css";

const TAB_CONFIG = [
  {
    key: "pendiente",
    label: "Pendientes",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    key: "aprobada",
    label: "Aprobadas",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
  {
    key: "rechazada",
    label: "Rechazadas",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
  },
];

function Apelaciones() {
  const [apelaciones, setApelaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("pendiente");

  const cargar = async () => {
    try {
      const res = await api.get("/apelaciones");
      setApelaciones(res.data);
    } catch {
      setApelaciones([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const resolver = async (id, decision) => {
    const texto = decision === "aprobada"
      ? "¿Aprobar y reactivar esta cuenta?"
      : "¿Rechazar esta apelación?";
    if (!confirm(texto)) return;
    try {
      await api.put(`/apelaciones/${id}/resolver`, { decision });
      cargar();
    } catch {
      alert("Error al resolver apelación");
    }
  };

  const filtradas = apelaciones.filter((a) => a.estado === filtro);
  const counts = {
    pendiente: apelaciones.filter((a) => a.estado === "pendiente").length,
    aprobada:  apelaciones.filter((a) => a.estado === "aprobada").length,
    rechazada: apelaciones.filter((a) => a.estado === "rechazada").length,
  };

  if (cargando) return (
    <div className="ap-wrap">
      <div className="ap-orb-1" /><div className="ap-orb-2" />
      <div className="ap-loading">
        <div className="ap-loading-spinner" />
        <span>Cargando apelaciones...</span>
      </div>
    </div>
  );

  return (
    <div className="ap-wrap">
      <div className="ap-orb-1" />
      <div className="ap-orb-2" />
      <div className="ap-particles" aria-hidden="true">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="ap-p" style={{ '--dur': `${6 + i}s`, '--delay': `${i * 0.9}s`, left: `${8 + i * 13}%`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px` }} />
        ))}
      </div>

      <div className="ap-inner">

        {/* ── Header ── */}
        <div className="ap-header">
          <div className="ap-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div>
            <h2 className="ap-title">Apelaciones</h2>
            <p className="ap-subtitle">
              {counts.pendiente} pendiente{counts.pendiente !== 1 ? "s" : ""} · {counts.aprobada} aprobada{counts.aprobada !== 1 ? "s" : ""} · {counts.rechazada} rechazada{counts.rechazada !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="ap-tabs">
          {TAB_CONFIG.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setFiltro(key)}
              className={`ap-tab-btn${filtro === key ? ` ap-tab-btn--active ap-tab-btn--${key}` : ""}`}
            >
              {icon}
              {label}
              <span className={`ap-tab-count${filtro === key ? ` ap-tab-count--${key}` : ""}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Empty state ── */}
        {filtradas.length === 0 ? (
          <div className="ap-empty">
            <div className="ap-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p>No hay apelaciones {filtro === "pendiente" ? "pendientes" : filtro === "aprobada" ? "aprobadas" : "rechazadas"}.</p>
          </div>
        ) : (
          <div className="ap-lista">
            {filtradas.map((apelacion, i) => (
              <div key={apelacion._id} className={`ap-card ap-card--${apelacion.estado}`} style={{ animationDelay: `${i * 0.07}s` }}>

                <div className="ap-card-body">
                  {/* Info del usuario */}
                  <div className="ap-user-row">
                    <div className="ap-avatar">
                      {(apelacion.nombre || "A")[0].toUpperCase()}
                    </div>
                    <div className="ap-user-info">
                      <p className="ap-nombre">{apelacion.nombre}</p>
                      <p className="ap-email">{apelacion.email}</p>
                    </div>
                    <p className="ap-fecha">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {new Date(apelacion.createdAt).toLocaleDateString("es-MX", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Motivo */}
                  <blockquote className="ap-motivo">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    {apelacion.motivo}
                  </blockquote>
                </div>

                {/* ── Acciones ── */}
                <div className="ap-card-action">
                  {apelacion.estado === "pendiente" && (
                    <div className="ap-acciones">
                      <button onClick={() => resolver(apelacion._id, "aprobada")} className="ap-btn ap-btn--aprobar">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Aprobar
                      </button>
                      <button onClick={() => resolver(apelacion._id, "rechazada")} className="ap-btn ap-btn--rechazar">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Rechazar
                      </button>
                    </div>
                  )}

                  {apelacion.estado === "aprobada" && (
                    <div className="ap-decision ap-decision--aprobada">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Aprobada
                    </div>
                  )}

                  {apelacion.estado === "rechazada" && (
                    <div className="ap-decision ap-decision--rechazada">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      Rechazada
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default Apelaciones;