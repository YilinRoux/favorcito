import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "../../styles/admin/DashboardAdmin.css";

function DashboardAdmin() {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get("/admin/resumen");
        setResumen(res.data);
      } catch {
        console.error("Error al cargar resumen");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  if (cargando) return (
    <div className="da-wrap">
      <div className="da-orbe da-orbe-1" /><div className="da-orbe da-orbe-2" />
      <p className="da-loading">Cargando...</p>
    </div>
  );

  return (
    <div className="da-wrap">
      <div className="da-orbe da-orbe-1" />
      <div className="da-orbe da-orbe-2" />

      <div className="da-container">

        <div className="da-header">
          <div>
            <h1 className="da-title">Panel Administrador</h1>
            <p className="da-subtitle">Resumen general del sistema</p>
          </div>
          <div className="da-badge">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Admin
          </div>
        </div>

        {/* Cards de resumen */}
        <div className="da-grid">
          <div className="da-card da-card-blue">
            <div className="da-card-top-border" />
            <div className="da-card-icon">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="da-card-label">Total Usuarios</p>
            <p className="da-card-value da-value-blue">{resumen?.totalUsuarios ?? "—"}</p>
          </div>

          <div className="da-card da-card-green">
            <div className="da-card-top-border" />
            <div className="da-card-icon">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="9 22 9 12 15 12 15 22" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="da-card-label">Total Locales</p>
            <p className="da-card-value da-value-green">{resumen?.totalLocales ?? "—"}</p>
          </div>

          <div className="da-card da-card-yellow">
            <div className="da-card-top-border da-top-yellow" />
            <div className="da-card-icon">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2"/>
                <polyline points="12 6 12 12 16 14" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="da-card-label">Locales Pendientes</p>
            <p className="da-card-value da-value-yellow">{resumen?.localesPendientes ?? "—"}</p>
          </div>

          <div className="da-card da-card-purple">
            <div className="da-card-top-border da-top-purple" />
            <div className="da-card-icon">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="da-card-label">Total Pedidos</p>
            <p className="da-card-value da-value-purple">{resumen?.totalPedidos ?? "—"}</p>
          </div>
        </div>

        {/* Accesos rápidos */}
        <h2 className="da-section-title">Accesos rápidos</h2>
        <div className="da-links-grid">
          <Link to="/admin/validar" className="da-link-card">
            <div className="da-card-top-border" />
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
              <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="da-link-label">Validar Locales</p>
            <p className="da-link-desc">Aprobar o rechazar solicitudes</p>
          </Link>
          <Link to="/admin/reportes" className="da-link-card">
            <div className="da-card-top-border" />
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="da-link-label">Gestión Reportes</p>
            <p className="da-link-desc">Revisar reportes de usuarios</p>
          </Link>
          <Link to="/admin/sospechosos" className="da-link-card">
            <div className="da-card-top-border" />
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="da-link-label">Usuarios Sospechosos</p>
            <p className="da-link-desc">Gestionar usuarios con alertas</p>
          </Link>
          <Link to="/admin/estadisticas" className="da-link-card">
            <div className="da-card-top-border" />
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
              <line x1="18" y1="20" x2="18" y2="10" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="20" x2="12" y2="4" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="20" x2="6" y2="14" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="da-link-label">Estadísticas</p>
            <p className="da-link-desc">Ver métricas del sistema</p>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default DashboardAdmin;