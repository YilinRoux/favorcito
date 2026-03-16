import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/pages/Inicio.css";

export default function Inicio() {
  const { usuario } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (usuario) {
      if (usuario.rol === "estudiante") navigate("/perfil");
      else if (usuario.rol === "vendedor") navigate("/vendedor/dashboard");
      else if (usuario.rol === "admin") navigate("/admin/dashboard");
    }
  }, [usuario, navigate]);

  return (
    <div className="in-wrap">
      {/* Partículas */}
      <div className="in-particles">
        {[...Array(10)].map((_, i) => <div key={i} className="in-p" />)}
      </div>

      {/* Orbes */}
      <div className="in-orb in-orb-1" />
      <div className="in-orb in-orb-2" />
      <div className="in-orb in-orb-3" />

      <div className="in-card">

        {/* Logo */}
        <div className="in-logo-wrap">
          <div className="in-logo-ring" />
          <div className="in-logo-ring in-logo-ring-2" />
          <div className="in-logo-icon">
            <svg className="in-logo-svg" viewBox="0 0 24 24">
              <circle cx="5.5" cy="17.5" r="2.5"/>
              <circle cx="18.5" cy="17.5" r="2.5"/>
              <path d="M3 5h11l2 7H5L3 5z"/>
              <path d="M15 12h4l2 5"/>
            </svg>
          </div>
        </div>

        <h1 className="in-title">Favorcito</h1>
        <p className="in-university">UTT Tehuacán</p>
        <p className="in-subtitle">Plataforma de pedidos universitaria</p>

        <div className="in-divider" />

        {/* Botones de rol */}
        <div className="in-btn-group">
          <button
            onClick={() => navigate("/registro?rol=estudiante")}
            className="in-role-btn in-role-est"
          >
            <div className="in-role-icon in-role-icon-est">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div className="in-role-content">
              <span className="in-role-label">Soy Estudiante</span>
              <span className="in-role-sub">Pide y recibe en el campus</span>
            </div>
            <svg className="in-role-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          <button
            onClick={() => navigate("/registro?rol=vendedor")}
            className="in-role-btn in-role-vend"
          >
            <div className="in-role-icon in-role-icon-vend">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div className="in-role-content">
              <span className="in-role-label">Soy Vendedor</span>
              <span className="in-role-sub">Publica tu local y vende</span>
            </div>
            <svg className="in-role-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        {/* Login link */}
        <button onClick={() => navigate("/login")} className="in-login-link">
          Ya tengo cuenta
          <span className="in-login-arrow">
            → Iniciar sesión
          </span>
        </button>

      </div>
    </div>
  );
}