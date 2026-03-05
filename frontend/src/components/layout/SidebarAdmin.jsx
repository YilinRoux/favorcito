import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

function SidebarAdmin() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { to: "/admin/dashboard", label: "🏠 Dashboard" },
    { to: "/admin/validar", label: "🏪 Validar Locales" },
    { to: "/admin/sospechosos", label: "🚨 Sospechosos" },
    { to: "/admin/reportes", label: "📢 Reportes" },
    { to: "/admin/estadisticas", label: "📊 Estadísticas" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="fixed top-0 left-0 h-full w-56 bg-gray-900 text-white flex flex-col z-50">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-lg font-bold">⚙️ Admin</h2>
        <p className="text-gray-400 text-xs mt-1">Panel de control</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`block px-4 py-3 rounded-lg transition text-sm font-medium ${
              location.pathname === link.to
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-sm"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default SidebarAdmin;