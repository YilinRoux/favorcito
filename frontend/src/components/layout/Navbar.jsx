import { useContext } from "react";
import { NotificationContext } from "../../context/NotificationContext";
import { AuthContext } from "../../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../../styles/layout/Navbar.css";

function Navbar() {
  // eslint-disable-next-line no-unused-vars
  const { total } = useContext(NotificationContext);
  const { usuario, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  if (usuario?.rol === "admin") return null;

  return (
    <nav className="nb-bar">
      <div className="nb-inner">

        {/* Logo */}
        <Link to="/" className="nb-logo">
          <div className="nb-logo-icon">🛵</div>
          <span className="nb-logo-text">Favorcito</span>
        </Link>

        {/* Links */}
        <div className="nb-links">

          {/* SIN SESIÓN */}
          {!usuario && (
            <>
              <Link to="/login"    className={`nb-link ${isActive("/login")    ? "nb-link--active" : ""}`}>Iniciar sesión</Link>
              <Link to="/registro" className={`nb-link ${isActive("/registro") ? "nb-link--active" : ""}`}>Registrarse</Link>
            </>
          )}

          {/* ESTUDIANTE */}
          {usuario?.rol === "estudiante" && (
            <>
              <Link to="/menu"          className={`nb-link ${isActive("/menu")          ? "nb-link--active" : ""}`}><span>🏪</span> Locales</Link>
              <Link to="/mis-pedidos"   className={`nb-link ${isActive("/mis-pedidos")   ? "nb-link--active" : ""}`}><span>📦</span> Pedidos</Link>
              <Link to="/favorcito"     className={`nb-link ${isActive("/favorcito")     ? "nb-link--active" : ""}`}><span>🛵</span> Favorcito</Link>
              <Link to="/mis-entregas"  className={`nb-link ${isActive("/mis-entregas")  ? "nb-link--active" : ""}`}><span>📬</span> Entregas</Link>
              <Link to="/perfil"        className={`nb-link ${isActive("/perfil")        ? "nb-link--active" : ""}`}><span>👤</span> Perfil</Link>
            </>
          )}

          {/* VENDEDOR */}
          {usuario?.rol === "vendedor" && (
            <>
              <Link to="/vendedor/dashboard" className={`nb-link ${isActive("/vendedor/dashboard") ? "nb-link--active" : ""}`}><span>🏪</span> Dashboard</Link>
              <Link to="/vendedor/menu"      className={`nb-link ${isActive("/vendedor/menu")      ? "nb-link--active" : ""}`}><span>🍽️</span> Menú</Link>
              <Link to="/vendedor/promocion" className={`nb-link ${isActive("/vendedor/promocion") ? "nb-link--active" : ""}`}><span>🎉</span> Promoción</Link>
            </>
          )}

          {/* CERRAR SESIÓN */}
          {usuario && (
            <button onClick={handleLogout} className="nb-logout">
              <span className="nb-logout-icon">⎋</span>
              Salir
            </button>
          )}

          {/* Botón registro (sin sesión) — destacado */}
          {!usuario && (
            <Link to="/registro" className="nb-btn-registro">
              Crear cuenta
            </Link>
          )}
        </div>

        {/* Hamburger mobile */}
        <button className="nb-hamburger" id="nb-hamburger" onClick={() => {
          document.getElementById("nb-mobile-menu")?.classList.toggle("nb-mobile-menu--open");
          document.getElementById("nb-hamburger")?.classList.toggle("nb-hamburger--open");
        }}>
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu */}
      <div className="nb-mobile-menu" id="nb-mobile-menu">
        {!usuario && (
          <>
            <Link to="/login"    className="nb-mobile-link">Iniciar sesión</Link>
            <Link to="/registro" className="nb-mobile-link nb-mobile-link--cta">Crear cuenta</Link>
          </>
        )}
        {usuario?.rol === "estudiante" && (
          <>
            <Link to="/menu"         className="nb-mobile-link">🏪 Locales</Link>
            <Link to="/mis-pedidos"  className="nb-mobile-link">📦 Pedidos</Link>
            <Link to="/favorcito"    className="nb-mobile-link">🛵 Favorcito</Link>
            <Link to="/mis-entregas" className="nb-mobile-link">📬 Entregas</Link>
            <Link to="/perfil"       className="nb-mobile-link">👤 Perfil</Link>
          </>
        )}
        {usuario?.rol === "vendedor" && (
          <>
            <Link to="/vendedor/dashboard" className="nb-mobile-link">🏪 Dashboard</Link>
            <Link to="/vendedor/menu"      className="nb-mobile-link">🍽️ Menú</Link>
            <Link to="/vendedor/promocion" className="nb-mobile-link">🎉 Promoción</Link>
          </>
        )}
        {usuario && (
          <button onClick={handleLogout} className="nb-mobile-link nb-mobile-link--logout">
            ⎋ Cerrar sesión
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;