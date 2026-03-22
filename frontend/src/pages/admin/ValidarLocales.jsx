import { useState, useEffect } from "react";
import api from "../../services/api";
import "../../styles/admin/ValidarLocales.css";

function ValidarLocales() {
  const [locales, setLocales] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtener = async () => {
      try {
        const res = await api.get("/admin/locales-pendientes");
        setLocales(res.data);
      } catch {
        setLocales([]);
      } finally {
        setCargando(false);
      }
    };
    obtener();
  }, []);

  const handleDecision = async (id, aprobado) => {
    try {
      await api.put(`/locales/${id}/aprobar`, { aprobado });
      setLocales((prev) => prev.filter((l) => l._id !== id));
    } catch {
      alert("Error al procesar la solicitud");
    }
  };

  if (cargando) return (
    <div className="vl-wrap">
      <div className="vl-orbe vl-orbe-1" /><div className="vl-orbe vl-orbe-2" />
      <p className="vl-loading">Cargando...</p>
    </div>
  );

  return (
    <div className="vl-wrap">
      <div className="vl-orbe vl-orbe-1" />
      <div className="vl-orbe vl-orbe-2" />

      <div className="vl-container">
        <div className="vl-header">
          <div>
            <h2 className="vl-title">Solicitudes Pendientes</h2>
            <p className="vl-subtitle">Aprueba o rechaza los locales en espera</p>
          </div>
          <div className="vl-badge">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2"/>
              <polyline points="12 6 12 12 16 14" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {locales.length} pendiente{locales.length !== 1 ? "s" : ""}
          </div>
        </div>

        {locales.length === 0 ? (
          <div className="vl-empty">
            <div className="vl-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
                <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="vl-empty-text">No hay solicitudes pendientes.</p>
          </div>
        ) : (
          <div className="vl-list">
            {locales.map((local) => (
              <div key={local._id} className="vl-card">
                <div className="vl-card-top-border" />
                <div className="vl-card-body">
                  <div className="vl-card-info">
                    <h3 className="vl-local-nombre">{local.nombre}</h3>
                    <p className="vl-local-desc">{local.descripcion}</p>
                    <div className="vl-local-meta">
                      <span className="vl-meta-item">
                        <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
                          <path d="M8 1.5a4.5 4.5 0 00-4.5 4.5c0 3 4.5 8.5 4.5 8.5s4.5-5.5 4.5-8.5A4.5 4.5 0 008 1.5zm0 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="#666"/>
                        </svg>
                        {local.direccion}
                      </span>
                      {local.vendedor && (
                        <span className="vl-meta-item">
                          <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
                            <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H3z" fill="#666"/>
                          </svg>
                          {local.vendedor.nombre_completo} — {local.vendedor.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="vl-card-actions">
                    <button onClick={() => handleDecision(local._id, true)} className="vl-btn-aprobar">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      Aprobar
                    </button>
                    <button onClick={() => handleDecision(local._id, false)} className="vl-btn-rechazar">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ValidarLocales;