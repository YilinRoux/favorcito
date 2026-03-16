import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/layout/SidebarAdmin.css";

function SidebarAdmin() {
  const { logout, usuario } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    {
      to: "/admin/dashboard", label: "Dashboard",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    },
    {
      to: "/admin/validar", label: "Validar Locales",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    },
    {
      to: "/admin/sospechosos", label: "Sospechosos",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    },
    {
      to: "/admin/reportes", label: "Reportes",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    },
    {
      to: "/admin/apelaciones", label: "Apelaciones",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    },
    {
      to: "/admin/estadisticas", label: "Estadísticas",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sb-sidebar">

      {/* Header */}
      <div className="sb-header">
        <div className="sb-logo">
          <div className="sb-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" style={{position:"relative",zIndex:1}}>
              <circle cx="5.5" cy="17.5" r="2.5"/>
              <circle cx="18.5" cy="17.5" r="2.5"/>
              <path d="M3 5h11l2 7H5L3 5z"/>
              <path d="M15 12h4l2 5"/>
            </svg>
          </div>
          <div className="sb-logo-info">
            <span className="sb-logo-name">Favorcito</span>
            <span className="sb-logo-role">Admin Panel</span>
          </div>
        </div>
      </div>

      {/* Badge admin */}
      <div className="sb-admin-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="#FF8C52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" className="sb-badge-icon">
          <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
        </svg>
        <span className="sb-admin-badge-text">Panel de Control</span>
      </div>

      {/* Navegación */}
      <nav className="sb-nav">
        <p className="sb-section-label">Navegación</p>
        {links.map((link, i) => (
          <Link
            key={link.to}
            to={link.to}
            data-tooltip={link.label}
            className={`sb-item ${isActive(link.to) ? "sb-item--active" : ""}`}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <span className="sb-item-icon">{link.icon}</span>
            <span className="sb-item-text">{link.label}</span>
            {isActive(link.to) && <span className="sb-item-dot" />}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="sb-footer">
        <div className="sb-user">
          <div className="sb-user-avatar">
            {usuario?.nombre_completo?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="sb-user-info">
            <span className="sb-user-name">{usuario?.nombre_completo || "Administrador"}</span>
            <span className="sb-user-role">Admin</span>
          </div>
        </div>

        <button onClick={handleLogout} className="sb-logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span className="sb-logout-text">Cerrar sesión</span>
        </button>
      </div>

    </aside>
  );
}

export default SidebarAdmin;