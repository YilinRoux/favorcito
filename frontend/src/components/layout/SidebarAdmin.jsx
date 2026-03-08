import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/layout/SidebarAdmin.css";

function SidebarAdmin() {
  const { logout, usuario } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { to: "/admin/dashboard",    label: "Dashboard",    icon: "🏠", tooltip: "Dashboard"       },
    { to: "/admin/validar",      label: "Validar Locales", icon: "🏪", tooltip: "Validar Locales" },
    { to: "/admin/sospechosos",  label: "Sospechosos",  icon: "🚨", tooltip: "Sospechosos"      },
    { to: "/admin/reportes",     label: "Reportes",     icon: "📢", tooltip: "Reportes"         },
    { to: "/admin/apelaciones",  label: "Apelaciones",  icon: "📝", tooltip: "Apelaciones"      },
    { to: "/admin/estadisticas", label: "Estadísticas", icon: "📊", tooltip: "Estadísticas"     },
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
          <div className="sb-logo-icon">🛵</div>
          <div className="sb-logo-info">
            <span className="sb-logo-name">Favorcito</span>
            <span className="sb-logo-role">Admin Panel</span>
          </div>
        </div>
      </div>

      {/* Badge admin */}
      <div className="sb-admin-badge">
        <span className="sb-admin-badge-icon">⚙️</span>
        <span className="sb-admin-badge-text">Panel de Control</span>
      </div>

      {/* Nav links */}
      <nav className="sb-nav">
        <p className="sb-section-label">Navegación</p>
        {links.map((link, i) => (
          <Link
            key={link.to}
            to={link.to}
            data-tooltip={link.tooltip}
            className={`sb-item ${isActive(link.to) ? "sb-item--active" : ""}`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <span className="sb-item-icon">{link.icon}</span>
            <span className="sb-item-text">{link.label}</span>
            {isActive(link.to) && <span className="sb-item-dot" />}
          </Link>
        ))}
      </nav>

      {/* Footer — usuario + logout */}
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
          <span className="sb-logout-icon">⎋</span>
          <span className="sb-logout-text">Cerrar sesión</span>
        </button>
      </div>

    </aside>
  );
}

export default SidebarAdmin;