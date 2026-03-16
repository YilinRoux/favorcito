import { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/admin/GestionReportes.css";

const motivoLabels = {
  mal_servicio:               "Mal servicio",
  producto_en_mal_estado:     "Producto en mal estado",
  cancelacion_injustificada:  "Cancelación injustificada",
  comportamiento_inapropiado: "Comportamiento inapropiado",
  otro:                       "Otro",
};

function GestionReportes() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("pendiente");

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get("/admin/reportes");
        setReportes(res.data);
      } catch {
        setReportes([]);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const resolver = async (id) => {
    try {
      await api.put(`/admin/reportes/${id}/resolver`);
      setReportes((prev) =>
        prev.map((r) => (r._id === id ? { ...r, estado: "resuelto" } : r))
      );
    } catch {
      alert("Error al resolver reporte");
    }
  };

  const reportesFiltrados = reportes.filter((r) => r.estado === filtro);
  const countPendiente = reportes.filter((r) => r.estado === "pendiente").length;
  const countResuelto  = reportes.filter((r) => r.estado === "resuelto").length;

  if (cargando) return (
    <div className="gr-wrap">
      <div className="gr-orb-1" /><div className="gr-orb-2" />
      <div className="gr-loading">
        <div className="gr-loading-spinner" />
        <span>Cargando reportes...</span>
      </div>
    </div>
  );

  return (
    <div className="gr-wrap">
      <div className="gr-orb-1" />
      <div className="gr-orb-2" />
      <div className="gr-particles" aria-hidden="true">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="gr-p" style={{ '--dur': `${6 + i}s`, '--delay': `${i * 0.9}s`, left: `${8 + i * 13}%`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px` }} />
        ))}
      </div>

      <div className="gr-inner">

        {/* ── Header ── */}
        <div className="gr-header">
          <div className="gr-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
          </div>
          <div>
            <h2 className="gr-title">Gestión de Reportes</h2>
            <p className="gr-subtitle">
              {countPendiente} pendiente{countPendiente !== 1 ? "s" : ""} · {countResuelto} resuelto{countResuelto !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* ── Filtros ── */}
        <div className="gr-filtros">
          <button
            onClick={() => setFiltro("pendiente")}
            className={`gr-filtro-btn${filtro === "pendiente" ? " gr-filtro-btn--active gr-filtro-btn--pendiente" : ""}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Pendientes
            <span className="gr-filtro-count">{countPendiente}</span>
          </button>
          <button
            onClick={() => setFiltro("resuelto")}
            className={`gr-filtro-btn${filtro === "resuelto" ? " gr-filtro-btn--active gr-filtro-btn--resuelto" : ""}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Resueltos
            <span className="gr-filtro-count">{countResuelto}</span>
          </button>
        </div>

        {/* ── Empty state ── */}
        {reportesFiltrados.length === 0 ? (
          <div className="gr-empty">
            <div className="gr-empty-icon">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
            </div>
            <p>No hay reportes {filtro === "pendiente" ? "pendientes" : "resueltos"}.</p>
          </div>
        ) : (
          <div className="gr-lista">
            {reportesFiltrados.map((reporte, i) => (
              <div key={reporte._id} className={`gr-card gr-card--${reporte.estado}`} style={{ animationDelay: `${i * 0.07}s` }}>

                <div className="gr-card-body">
                  {/* ── Chips de tipo y motivo ── */}
                  <div className="gr-chips">
                    <span className={`gr-chip gr-chip--tipo-${reporte.tipoReportado}`}>
                      {reporte.tipoReportado === "local" ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      )}
                      {reporte.tipoReportado === "local" ? "Local" : "Estudiante"}
                    </span>
                    <span className="gr-chip gr-chip--motivo">
                      {motivoLabels[reporte.motivo] || reporte.motivo}
                    </span>
                  </div>

                  {/* ── Detalle ── */}
                  <div className="gr-detalle">
                    <p className="gr-reportante">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      {reporte.reportante?.nombre_completo}
                      <span className="gr-reportante-rol">({reporte.reportante?.rol})</span>
                    </p>

                    {reporte.tipoReportado === "local" && (
                      <p className="gr-reportado">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        </svg>
                        Local: <strong>{reporte.localReportado?.nombre}</strong>
                      </p>
                    )}

                    {reporte.tipoReportado === "estudiante" && (
                      <p className="gr-reportado">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        Estudiante: <strong>{reporte.estudianteReportado?.nombre_completo}</strong>
                      </p>
                    )}

                    {reporte.descripcion && (
                      <blockquote className="gr-descripcion">
                        "{reporte.descripcion}"
                      </blockquote>
                    )}

                    <p className="gr-fecha">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {new Date(reporte.createdAt).toLocaleDateString("es-MX", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* ── Acción ── */}
                <div className="gr-card-action">
                  {reporte.estado === "pendiente" && (
                    <button onClick={() => resolver(reporte._id)} className="gr-btn-resolver">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Resolver
                    </button>
                  )}
                  {reporte.estado === "resuelto" && (
                    <div className="gr-resuelto-badge">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Resuelto
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

export default GestionReportes;