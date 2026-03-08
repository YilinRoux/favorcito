import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

        .fav-inicio-wrapper * { box-sizing: border-box; margin: 0; padding: 0; }

        .fav-inicio-wrapper {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          min-height: 100vh;
          display: flex !important;
          align-items: center;
          justify-content: center;
          background-color: #080808 !important;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        /* Grid de puntos */
        .fav-inicio-wrapper::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
          animation: fav-gridFade 6s ease-in-out infinite;
          z-index: 0;
        }
        @keyframes fav-gridFade {
          0%,100% { opacity: 0.4; }
          50%      { opacity: 0.75; }
        }

        /* ── Orbes ── */
        .fav-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(72px);
          z-index: 0;
        }
        .fav-orb-1 {
          width: 600px; height: 600px;
          top: -200px; left: 50%; transform: translateX(-50%);
          background: radial-gradient(circle, rgba(255,92,10,0.22) 0%, transparent 65%);
          animation: fav-orb1 7s ease-in-out infinite;
        }
        .fav-orb-2 {
          width: 380px; height: 380px;
          bottom: -120px; left: -100px;
          background: radial-gradient(circle, rgba(255,92,10,0.12) 0%, transparent 65%);
          animation: fav-orb2 9s ease-in-out infinite;
        }
        .fav-orb-3 {
          width: 320px; height: 320px;
          bottom: -80px; right: -80px;
          background: radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 65%);
          animation: fav-orb2 11s ease-in-out infinite reverse;
        }
        @keyframes fav-orb1 {
          0%,100% { transform: translateX(-50%) scale(1);    opacity: 0.8; }
          33%      { transform: translateX(-52%) scale(1.08); opacity: 1;   }
          66%      { transform: translateX(-48%) scale(0.96); opacity: 0.6; }
        }
        @keyframes fav-orb2 {
          0%,100% { transform: scale(1)   translate(0,0);       opacity: 0.6; }
          50%      { transform: scale(1.2) translate(25px,-25px); opacity: 1;  }
        }

        /* ── Partículas ── */
        .fav-particles { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
        .fav-p {
          position: absolute;
          border-radius: 50%;
          background: #FF5C0A;
          opacity: 0;
          animation: fav-floatUp var(--dur,7s) var(--delay,0s) ease-in-out infinite;
        }
        .fav-p:nth-child(1)  { left:5%;  width:3px; height:3px; --dur:7s;  --delay:0s;   }
        .fav-p:nth-child(2)  { left:12%; width:5px; height:5px; --dur:5s;  --delay:1.1s; }
        .fav-p:nth-child(3)  { left:22%; width:2px; height:2px; --dur:9s;  --delay:0.4s; }
        .fav-p:nth-child(4)  { left:33%; width:4px; height:4px; --dur:6s;  --delay:2.2s; }
        .fav-p:nth-child(5)  { left:45%; width:3px; height:3px; --dur:8s;  --delay:0.7s; }
        .fav-p:nth-child(6)  { left:57%; width:2px; height:2px; --dur:5s;  --delay:1.8s; }
        .fav-p:nth-child(7)  { left:66%; width:5px; height:5px; --dur:7s;  --delay:0.3s; background:#22C55E; }
        .fav-p:nth-child(8)  { left:75%; width:3px; height:3px; --dur:6s;  --delay:2.6s; }
        .fav-p:nth-child(9)  { left:84%; width:2px; height:2px; --dur:9s;  --delay:1.0s; background:#22C55E; }
        .fav-p:nth-child(10) { left:93%; width:4px; height:4px; --dur:5s;  --delay:0.6s; }
        @keyframes fav-floatUp {
          0%   { bottom:-10px; opacity:0;   transform:translateX(0px)   scale(0.4); }
          10%  { opacity:0.7; }
          45%  { transform:translateX(22px)  scale(1.1); }
          80%  { opacity:0.3; }
          100% { bottom:108%;  opacity:0;   transform:translateX(-22px) scale(0.3); }
        }

        /* ── Card ── */
        .fav-card {
          background: #111111 !important;
          border: 1px solid rgba(255,255,255,0.07) !important;
          border-radius: 28px !important;
          padding: 52px 42px 46px !important;
          width: 100%;
          max-width: 430px;
          text-align: center;
          position: relative;
          z-index: 1;
          box-shadow: 0 40px 100px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04) inset !important;
          animation: fav-cardRise 0.75s cubic-bezier(0.16,1,0.3,1) both;
          transition: box-shadow 0.4s, border-color 0.4s;
        }
        .fav-card:hover {
          border-color: rgba(255,92,10,0.15) !important;
          box-shadow: 0 48px 120px rgba(0,0,0,0.7), 0 0 60px rgba(255,92,10,0.08), 0 0 0 1px rgba(255,255,255,0.05) inset !important;
        }
        /* Borde superior naranja animado */
        .fav-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent 0%, #FF5C0A 30%, #FF7A30 50%, #FF5C0A 70%, transparent 100%);
          background-size: 200%;
          border-radius: 28px 28px 0 0;
          animation: fav-borderFlow 3s linear infinite;
        }
        /* Reflejo interno */
        .fav-card::after {
          content: '';
          position: absolute;
          top: 2px; left: 10%; right: 10%; height: 60px;
          background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%);
          border-radius: 0 0 40px 40px;
          pointer-events: none;
        }
        @keyframes fav-borderFlow {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes fav-cardRise {
          from { opacity:0; transform:translateY(56px) scale(0.93); filter:blur(4px); }
          to   { opacity:1; transform:translateY(0)    scale(1);    filter:blur(0);  }
        }

        /* ── Logo ── */
        .fav-logo-wrap {
          position: relative;
          width: 88px; height: 88px;
          margin: 0 auto 22px;
          display: flex; align-items: center; justify-content: center;
        }
        .fav-logo-wrap::before {
          content: '';
          position: absolute; inset: -4px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, transparent 0%, rgba(255,92,10,0.5) 30%, transparent 60%, rgba(255,92,10,0.3) 80%, transparent 100%);
          animation: fav-haloSpin 3s linear infinite;
          filter: blur(3px);
        }
        @keyframes fav-haloSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .fav-logo-icon {
          font-size: 2.4rem !important;
          position: relative; z-index: 3;
          filter: drop-shadow(0 0 10px rgba(255,92,10,0.4));
          animation: fav-logoDrop 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both,
                     fav-logoFloat 3.2s ease-in-out 0.9s infinite;
          display: block;
        }
        @keyframes fav-logoDrop {
          0%   { transform:translateY(-40px) scale(0.4) rotate(-20deg); opacity:0; }
          55%  { transform:translateY(6px)   scale(1.15) rotate(5deg);  opacity:1; }
          100% { transform:translateY(0)     scale(1)    rotate(0deg);  opacity:1; }
        }
        @keyframes fav-logoFloat {
          0%,100% { transform:translateY(0)    rotate(0deg);  filter:drop-shadow(0 0 10px rgba(255,92,10,0.4)); }
          30%      { transform:translateY(-7px) rotate(-4deg); filter:drop-shadow(0 6px 16px rgba(255,92,10,0.6)); }
          70%      { transform:translateY(-4px) rotate(3deg);  filter:drop-shadow(0 4px 12px rgba(255,92,10,0.5)); }
        }
        .fav-logo-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(255,92,10,0.3);
          animation: fav-ringPulse 2.4s ease-out infinite;
          inset: 2px;
        }
        .fav-logo-ring-2 { inset: -10px; animation-delay: 1.2s; }
        @keyframes fav-ringPulse {
          0%   { transform:scale(0.7); opacity:0.8; }
          100% { transform:scale(1.7); opacity:0;   }
        }

        /* ── Textos ── */
        .fav-title {
          font-size: 2.1rem !important;
          font-weight: 900 !important;
          color: #FFFFFF !important;
          letter-spacing: -0.035em;
          margin: 0 0 8px !important;
          animation: fav-textReveal 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s both;
          transition: text-shadow 0.3s;
          line-height: 1.1;
        }
        .fav-card:hover .fav-title { text-shadow: 0 0 40px rgba(255,255,255,0.15); }

        .fav-university {
          display: inline-block !important;
          font-size: 0.7rem !important;
          font-weight: 700 !important;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #FF7A30 !important;
          background: rgba(255,92,10,0.1) !important;
          border: 1px solid rgba(255,92,10,0.25) !important;
          padding: 4px 14px !important;
          border-radius: 100px !important;
          margin-bottom: 10px;
          animation: fav-textReveal 0.6s cubic-bezier(0.16,1,0.3,1) 0.22s both;
          position: relative; overflow: hidden;
        }
        .fav-university::before {
          content: '';
          position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          animation: fav-chipShimmer 3s ease-in-out infinite;
        }
        @keyframes fav-chipShimmer {
          0%  { left:-100%; }
          40% { left:160%;  }
          100%{ left:160%;  }
        }

        .fav-subtitle {
          font-size: 0.86rem !important;
          color: #666666 !important;
          line-height: 1.6;
          margin: 0 !important;
          animation: fav-textReveal 0.6s cubic-bezier(0.16,1,0.3,1) 0.28s both;
        }
        @keyframes fav-textReveal {
          from { opacity:0; transform:translateY(18px); filter:blur(3px); }
          to   { opacity:1; transform:translateY(0);    filter:blur(0);   }
        }

        /* ── Separador ── */
        .fav-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          margin: 28px 0;
          animation: fav-textReveal 0.6s ease 0.33s both;
          position: relative; overflow: visible;
        }
        .fav-divider::after {
          content: '';
          position: absolute; top: -1px; left: -20%; width: 30%; height: 3px;
          border-radius: 2px;
          background: linear-gradient(90deg, transparent, #FF5C0A, transparent);
          animation: fav-divBolt 2.5s ease-in-out infinite;
          filter: blur(1px);
        }
        @keyframes fav-divBolt {
          0%   { left:-30%; opacity:0; }
          10%  { opacity:1; }
          90%  { opacity:1; }
          100% { left:120%;  opacity:0; }
        }

        /* ── Botones de rol ── */
        .fav-btn-group {
          display: flex !important;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 26px;
        }

        .fav-role-btn {
          display: flex !important;
          align-items: center !important;
          gap: 14px !important;
          padding: 17px 18px !important;
          border-radius: 16px !important;
          background: #181818 !important;
          cursor: pointer !important;
          text-align: left !important;
          width: 100%;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          position: relative; overflow: hidden;
          transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s, border-color 0.25s, background 0.25s !important;
          animation: fav-textReveal 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }
        .fav-role-btn-est { border: 1.5px solid rgba(255,255,255,0.07) !important; animation-delay: 0.38s; }
        .fav-role-btn-vend { border: 1.5px solid rgba(255,255,255,0.07) !important; animation-delay: 0.50s; }

        /* Shimmer sweep */
        .fav-role-btn::before {
          content: '';
          position: absolute; top:0; left:-100%; width:55%; height:100%;
          background: linear-gradient(105deg, transparent, rgba(255,255,255,0.07), transparent);
          transition: left 0.45s ease;
          pointer-events: none;
        }
        .fav-role-btn:hover::before { left:160%; }

        /* Fondo degradado al hover */
        .fav-role-btn::after {
          content: ''; position: absolute; inset: 0;
          opacity: 0; border-radius: 15px;
          transition: opacity 0.3s; pointer-events: none;
        }
        .fav-role-btn-est::after  { background: linear-gradient(135deg, rgba(255,92,10,0.09) 0%, transparent 60%); }
        .fav-role-btn-vend::after { background: linear-gradient(135deg, rgba(34,197,94,0.07) 0%, transparent 60%); }

        .fav-role-btn-est:hover {
          border-color: rgba(255,92,10,0.5) !important;
          background: rgb(20,12,8) !important;
          transform: translateY(-4px) scale(1.015) !important;
          box-shadow: 0 16px 40px rgba(255,92,10,0.22), 0 0 0 1px rgba(255,92,10,0.2), 0 0 24px rgba(255,92,10,0.08) inset !important;
        }
        .fav-role-btn-est:hover::after  { opacity:1; }

        .fav-role-btn-vend:hover {
          border-color: rgba(34,197,94,0.45) !important;
          background: rgb(8,16,11) !important;
          transform: translateY(-4px) scale(1.015) !important;
          box-shadow: 0 16px 40px rgba(34,197,94,0.18), 0 0 0 1px rgba(34,197,94,0.18), 0 0 24px rgba(34,197,94,0.06) inset !important;
        }
        .fav-role-btn-vend:hover::after { opacity:1; }

        .fav-role-btn:active { transform: translateY(0) scale(0.98) !important; transition-duration: 0.08s; }

        /* Ícono */
        .fav-btn-icon {
          font-size: 1.8rem !important;
          width: 50px; height: 50px;
          border-radius: 14px;
          display: flex !important; align-items: center; justify-content: center;
          flex-shrink: 0;
          position: relative; z-index: 1;
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), background 0.25s, box-shadow 0.3s;
        }
        .fav-btn-icon-est  { background: rgba(255,92,10,0.12) !important; }
        .fav-btn-icon-vend { background: rgba(34,197,94,0.10) !important; }

        .fav-role-btn-est:hover  .fav-btn-icon { background: rgba(255,92,10,0.22) !important; transform: scale(1.12) rotate(-8deg); box-shadow: 0 0 16px rgba(255,92,10,0.35); }
        .fav-role-btn-vend:hover .fav-btn-icon { background: rgba(34,197,94,0.18)  !important; transform: scale(1.12) rotate(8deg);  box-shadow: 0 0 16px rgba(34,197,94,0.3);  }

        /* Texto */
        .fav-btn-content { display: flex !important; flex-direction: column; flex:1; gap:3px; position:relative; z-index:1; }
        .fav-btn-label   { font-size:0.98rem !important; font-weight:800 !important; color:#FFFFFF !important; letter-spacing:-0.01em; transition:color 0.2s; }
        .fav-btn-sub     { font-size:0.74rem !important; color:#666666 !important; transition:color 0.2s; }

        .fav-role-btn-est:hover  .fav-btn-label { color:#FFD0B8 !important; }
        .fav-role-btn-vend:hover .fav-btn-label { color:#B8FFD4 !important; }
        .fav-role-btn:hover .fav-btn-sub        { color:#888888 !important; }

        /* Flecha */
        .fav-btn-arrow { font-size:1.1rem; color:#2A2A2A; transition:color 0.25s, transform 0.3s cubic-bezier(0.16,1,0.3,1); flex-shrink:0; position:relative; z-index:1; }
        .fav-role-btn-est:hover  .fav-btn-arrow { color:#FF5C0A; transform:translateX(6px); }
        .fav-role-btn-vend:hover .fav-btn-arrow { color:#22C55E; transform:translateX(6px); }

        /* ── Link login ── */
        .fav-login-link {
          display: inline-flex !important; align-items: center; gap:8px;
          background: none !important; border: none !important;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          font-size: 0.86rem !important;
          color: #666666 !important;
          transition: color 0.2s;
          padding: 6px 0 !important;
          animation: fav-textReveal 0.6s ease 0.58s both;
        }
        .fav-login-link:hover { color:#AAAAAA !important; }

        .fav-login-arrow {
          color:#FF5C0A !important; font-weight:700 !important;
          font-size:0.86rem !important;
          position:relative;
          transition: letter-spacing 0.25s ease;
        }
        .fav-login-link:hover .fav-login-arrow { letter-spacing: 0.04em; }
        .fav-login-arrow::after {
          content:''; position:absolute; bottom:-2px; left:0; width:0; height:1.5px;
          background:#FF5C0A; border-radius:2px;
          transition: width 0.3s ease;
          box-shadow: 0 0 6px rgba(255,92,10,0.6);
        }
        .fav-login-link:hover .fav-login-arrow::after { width:100%; }

        @media (max-width:460px) {
          .fav-card        { padding: 40px 20px 36px !important; border-radius: 22px !important; }
          .fav-title       { font-size: 1.75rem !important; }
          .fav-role-btn    { padding: 14px 14px !important; }
          .fav-btn-icon    { width:42px !important; height:42px !important; font-size:1.45rem !important; }
        }
      `}</style>

      <div className="fav-inicio-wrapper">

        {/* Partículas */}
        <div className="fav-particles">
          {[...Array(10)].map((_, i) => <div key={i} className="fav-p" />)}
        </div>

        {/* Orbes */}
        <div className="fav-orb fav-orb-1" />
        <div className="fav-orb fav-orb-2" />
        <div className="fav-orb fav-orb-3" />

        {/* Card */}
        <div className="fav-card">

          {/* Logo */}
          <div className="fav-logo-wrap">
            <div className="fav-logo-ring" />
            <div className="fav-logo-ring fav-logo-ring-2" />
            <span className="fav-logo-icon">🛵</span>
          </div>

          <h1 className="fav-title">Favorcito</h1>
          <p className="fav-university">UT Tehuacán</p>
          <p className="fav-subtitle">Plataforma de pedidos universitaria</p>

          <div className="fav-divider" />

          {/* Botones */}
          <div className="fav-btn-group">
            <button
              onClick={() => navigate("/registro?rol=estudiante")}
              className="fav-role-btn fav-role-btn-est"
            >
              <span className="fav-btn-icon fav-btn-icon-est">🎓</span>
              <span className="fav-btn-content">
                <span className="fav-btn-label">Soy Estudiante</span>
                <span className="fav-btn-sub">Pide y recibe en el campus</span>
              </span>
              <span className="fav-btn-arrow">→</span>
            </button>

            <button
              onClick={() => navigate("/registro?rol=vendedor")}
              className="fav-role-btn fav-role-btn-vend"
            >
              <span className="fav-btn-icon fav-btn-icon-vend">🏪</span>
              <span className="fav-btn-content">
                <span className="fav-btn-label">Soy Vendedor</span>
                <span className="fav-btn-sub">Publica tu local y vende</span>
              </span>
              <span className="fav-btn-arrow">→</span>
            </button>
          </div>

          {/* Login link */}
          <button onClick={() => navigate("/login")} className="fav-login-link">
            Ya tengo cuenta
            <span className="fav-login-arrow">→ Iniciar sesión</span>
          </button>

        </div>
      </div>
    </>
  );
}