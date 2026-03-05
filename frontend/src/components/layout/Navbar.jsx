import { useContext } from "react";
import { NotificationContext } from "../../context/NotificationContext";
import { AuthContext } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  // eslint-disable-next-line no-unused-vars
  const { total } = useContext(NotificationContext);
  const { usuario, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (usuario?.rol === "admin") return null;

  return (
    <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 40 }}>

      {/* Logo */}
      <Link to="/" style={{ fontWeight: "700", color: "#2563eb", fontSize: "16px", textDecoration: "none" }}>
        🍽️ UT Tehuacán
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>

        {/* SIN SESIÓN */}
        {!usuario && (
          <>
            <Link to="/login" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>
              Iniciar sesión
            </Link>
            <Link to="/registro" style={{ background: "#3b82f6", color: "white", padding: "6px 14px", borderRadius: "8px", fontSize: "14px", textDecoration: "none", fontWeight: "600" }}>
              Registrarse
            </Link>
          </>
        )}

       {/* ESTUDIANTE */}
{usuario?.rol === "estudiante" && (
  <>
    <Link to="/menu" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>
      🏪 Locales
    </Link>
    <Link to="/mis-pedidos" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>
      📦 Pedidos
    </Link>
    <Link to="/perfil" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>
      👤 Perfil
    </Link>
  </>
)}
{usuario?.rol === "estudiante" && (
  <>
    <Link to="/menu" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>🏪 Locales</Link>
    <Link to="/mis-pedidos" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>📦 Pedidos</Link>
    <Link to="/favorcito" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>🛵 Favorcito</Link>
    <Link to="/mis-entregas" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>📬 Entregas</Link>
    <Link to="/perfil" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>👤 Perfil</Link>
  </>
)}
{/* VENDEDOR */}
{usuario?.rol === "vendedor" && (
  <>
    <Link to="/vendedor/dashboard" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>
      🏪 Dashboard
    </Link>
    <Link to="/vendedor/menu" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>
      🍽️ Menú
    </Link>
    <Link to="/vendedor/promocion" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>
      🎉 Promoción
    </Link>
  </>
)}

        {/* CERRAR SESIÓN */}
        {usuario && (
          <button
            onClick={handleLogout}
            style={{ color: "#9ca3af", fontSize: "13px", background: "none", border: "none", cursor: "pointer" }}
          >
            Salir
          </button>
        )}
      </div>
    </div>
  );
}

export default Navbar;