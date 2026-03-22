import { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/admin/Estadisticas.css";

function Estadisticas() {
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get("/admin/estadisticas");
        setStats(res.data);
      } catch {
        console.error("Error al cargar estadísticas");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  if (cargando) return (
    <div className="est-wrap">
      <div className="est-orbe est-orbe-1" /><div className="est-orbe est-orbe-2" />
      <p className="est-loading">Cargando...</p>
    </div>
  );

  return (
    <div className="est-wrap">
      <div className="est-orbe est-orbe-1" />
      <div className="est-orbe est-orbe-2" />

      <div className="est-container">

        <div className="est-header">
          <div>
            <h2 className="est-title">Estadísticas</h2>
            <p className="est-subtitle">Métricas generales del sistema</p>
          </div>
          <div className="est-badge">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <line x1="18" y1="20" x2="18" y2="10" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="20" x2="12" y2="4" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="20" x2="6" y2="14" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            En tiempo real
          </div>
        </div>

        <div className="est-grid">
          <div className="est-card">
            <div className="est-card-top-border" />
            <div className="est-card-icon est-icon-blue">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="#3b82f6" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="#3b82f6" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="#3b82f6" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="#3b82f6" strokeWidth="2"/>
              </svg>
            </div>
            <p className="est-card-label">Pedidos hoy</p>
            <p className="est-card-value est-value-blue">{stats?.pedidosHoy ?? "—"}</p>
            <p className="est-card-hint">Pedidos recibidos hoy</p>
          </div>

          <div className="est-card">
            <div className="est-card-top-border est-top-green" />
            <div className="est-card-icon est-icon-green">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="est-card-label">Total generado</p>
            <p className="est-card-value est-value-green">${stats?.totalGenerado ?? "—"}</p>
            <p className="est-card-hint">Ingresos totales del sistema</p>
          </div>

          <div className="est-card est-card-wide">
            <div className="est-card-top-border est-top-purple" />
            <div className="est-card-icon est-icon-purple">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="9 22 9 12 15 12 15 22" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="est-card-label">Local con más ventas</p>
            <p className="est-card-value est-value-purple est-value-local">
              {stats?.localMasVentas ?? "—"}
            </p>
            <p className="est-card-hint">Local líder en pedidos completados</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Estadisticas;