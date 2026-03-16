import { useContext, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;
  const toggleMenu = () => setMenuOpen(p => !p);
  const closeMenu = () => setMenuOpen(false);

  if (usuario?.rol === "admin") return null;

  const estudianteLinks = [
    { to: "/menu",         label: "Locales",   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { to: "/mis-pedidos",  label: "Pedidos",   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> },
    { to: "/favorcito",    label: "Favorcito", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/><path d="M3 5h11l2 7H5L3 5z"/><path d="M15 12h4l2 5"/></svg> },
    { to: "/mis-entregas", label: "Entregas",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
    { to: "/perfil",       label: "Perfil",    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];

  const vendedorLinks = [
    { to: "/vendedor/dashboard", label: "Dashboard", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { to: "/vendedor/menu",      label: "Menú",      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20M21 15V2l-3 5-3-5v13"/><path d="M21 22H3"/></svg> },
    { to: "/vendedor/promocion", label: "Promoción", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  ];

  const activeLinks = usuario?.rol === "estudiante" ? estudianteLinks
    : usuario?.rol === "vendedor" ? vendedorLinks : [];

  return (
    <nav className="nb-bar">
      <div className="nb-inner">

        {/* Logo */}
        <Link to="/" className="nb-logo" onClick={closeMenu}>
          <div className="nb-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" style={{position:"relative",zIndex:1}}>
              <circle cx="5.5" cy="17.5" r="2.5"/>
              <circle cx="18.5" cy="17.5" r="2.5"/>
              <path d="M3 5h11l2 7H5L3 5z"/>
              <path d="M15 12h4l2 5"/>
            </svg>
          </div>
          <span className="nb-logo-text">Favorcito</span>
        </Link>

        {/* Links desktop */}
        <div className="nb-links">
          {/* Sin sesión */}
          {!usuario && (
            <>
              <Link to="/login"    className={`nb-link ${isActive("/login")    ? "nb-link--active" : ""}`}>Iniciar sesión</Link>
              <Link to="/registro" className="nb-btn-cta">Crear cuenta</Link>
            </>
          )}

          {/* Links por rol */}
          {activeLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nb-link ${isActive(link.to) ? "nb-link--active" : ""}`}
            >
              <span className="nb-link-icon">{link.icon}</span>
              {link.label}
            </Link>
          ))}

          {/* Logout */}
          {usuario && (
            <button onClick={handleLogout} className="nb-logout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Salir
            </button>
          )}
        </div>

        {/* Hamburger mobile */}
        <button
          className={`nb-hamburger ${menuOpen ? "nb-hamburger--open" : ""}`}
          onClick={toggleMenu}
          aria-label="Menú"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Menú mobile */}
      {menuOpen && (
        <div className="nb-mobile-menu">
          {!usuario && (
            <>
              <Link to="/login"    className="nb-mobile-link" onClick={closeMenu}>Iniciar sesión</Link>
              <Link to="/registro" className="nb-mobile-link nb-mobile-link--cta" onClick={closeMenu}>Crear cuenta</Link>
            </>
          )}
          {activeLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nb-mobile-link ${isActive(link.to) ? "nb-mobile-link--active" : ""}`}
              onClick={closeMenu}
            >
              <span className="nb-mobile-link-icon">{link.icon}</span>
              {link.label}
            </Link>
          ))}
          {usuario && (
            <button onClick={() => { handleLogout(); closeMenu(); }} className="nb-mobile-link nb-mobile-link--logout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Cerrar sesión
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;