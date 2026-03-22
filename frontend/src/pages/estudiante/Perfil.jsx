import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/estudiante/Perfil.css";

// Icono SVG por rol
const RolIcon = ({ rol }) => {
  if (rol === "estudiante") return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
  if (rol === "vendedor") return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    </svg>
  );
};

function Perfil() {
  const { usuario, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [confirmarLogout, setConfirmarLogout] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!usuario) {
    navigate("/login");
    return null;
  }

  const opciones = [
    {
      label: "Mis pedidos",
      desc: "Ver historial de pedidos",
      path: "/mis-pedidos",
      mostrar: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 8h14M5 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4m14 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/>
        </svg>
      ),
    },
    {
      label: "Favorcito",
      desc: "Ver pedidos disponibles para entregar",
      path: "/favorcito",
      mostrar: usuario.rol === "estudiante",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13"/>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
          <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      ),
    },
    {
      label: "Mis entregas",
      desc: "Ver entregas que has realizado",
      path: "/mis-entregas",
      mostrar: usuario.rol === "estudiante",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      ),
    },
  ].filter((o) => o.mostrar);

  return (
    <div className="pf-wrap">
      <div className="pf-orb-1" />
      <div className="pf-orb-2" />
      <div className="pf-particles" aria-hidden="true">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="pf-p" style={{ '--dur': `${6 + i}s`, '--delay': `${i * 0.9}s`, left: `${8 + i * 13}%`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px` }} />
        ))}
      </div>

      <div className="pf-inner">

        {/* ── Header ── */}
        <div className="pf-header">
          <div className="pf-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h2 className="pf-title">Mi Perfil</h2>
            <p className="pf-subtitle">Gestiona tu cuenta</p>
          </div>
        </div>

        {/* ── Aviso sospechoso ── */}
{usuario?.sospechoso && (
  <div className="pf-aviso-sospechoso">
    <div className="pf-aviso-sospechoso-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </div>
    <div className="pf-aviso-sospechoso-texto">
      <p className="pf-aviso-sospechoso-titulo">Cuenta marcada como sospechosa</p>
      <p className="pf-aviso-sospechoso-desc">
        Has acumulado demasiadas cancelaciones. Tu cuenta está bajo revisión por un administrador.
        Mientras tanto no puedes realizar nuevos pedidos. Si crees que es un error,
        espera la resolución o contacta a la administración.
      </p>
    </div>
  </div>
)}

        {/* ── Card de usuario ── */}
        <div className="pf-card pf-card--usuario">
          <div className="pf-avatar-wrap">
            <div className="pf-avatar">
              <RolIcon rol={usuario.rol} />
            </div>
            <div className="pf-avatar-glow" />
          </div>
          <div className="pf-user-info">
            <p className="pf-user-nombre">{usuario.nombre}</p>
            <p className="pf-user-email">{usuario.email}</p>
            <span className={`pf-rol-chip pf-rol-chip--${usuario.rol}`}>
              {usuario.rol === "estudiante" && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                </svg>
              )}
              {usuario.rol === "vendedor" && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
              )}
              {usuario.rol === "admin" && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
              {usuario.rol}
            </span>
          </div>
        </div>

        {/* ── Opciones de navegación ── */}
        <div className="pf-card pf-card--opciones">
          {opciones.map((op, i) => (
            <button
              key={op.path}
              onClick={() => navigate(op.path)}
              className="pf-opcion"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="pf-opcion-icono">{op.icon}</div>
              <div className="pf-opcion-texto">
                <p className="pf-opcion-label">{op.label}</p>
                <p className="pf-opcion-desc">{op.desc}</p>
              </div>
              <div className="pf-opcion-arrow">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* ── Cerrar sesión ── */}
        {!confirmarLogout ? (
          <button onClick={() => setConfirmarLogout(true)} className="pf-btn-logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
        ) : (
          <div className="pf-card pf-card--confirmar">
            <div className="pf-confirmar-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <p className="pf-confirmar-txt">¿Seguro que quieres salir?</p>
            <div className="pf-confirmar-acciones">
              <button onClick={handleLogout} className="pf-btn pf-btn--salir">
                Sí, salir
              </button>
              <button onClick={() => setConfirmarLogout(false)} className="pf-btn pf-btn--cancelar">
                Cancelar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Perfil;