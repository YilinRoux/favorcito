import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import MarcoAuth from "../components/auth/MarcoAuth";
import "../styles/pages/Inicio.css";

export default function Inicio() {
  const { usuario } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tema, setTema] = useState(() => localStorage.getItem("favorcito-tema") || "claro");

  const aplicarTema = (nuevo) => {
    setTema(nuevo);
    localStorage.setItem("favorcito-tema", nuevo);
  };

  useEffect(() => {
    if (usuario) {
      if (usuario.rol === "estudiante") navigate("/perfil");
      else if (usuario.rol === "vendedor") navigate("/vendedor/dashboard");
      else if (usuario.rol === "admin") navigate("/admin/dashboard");
    }
  }, [usuario, navigate]);

  return (
    <MarcoAuth
      tema={tema}
      aplicarTema={aplicarTema}
      titulo={<>Tu comida <em>favorita</em>,<br />más cerca de ti</>}
      descripcion="Conecta con los locales de tu escuela, explora sus platillos y haz tus pedidos de forma rápida y sencilla."
    >
      <h2 className="rg-title">Bienvenido</h2>
      <p className="rg-subtitle">Plataforma de pedidos de la UTT Tehuacán</p>

      <Link to="/login" className="in-cta">Iniciar sesión</Link>

      <div className="in-sep"><span>¿Aún no tienes cuenta?</span></div>

      <div className="rg-roles">
        <Link to="/registro?rol=estudiante" className="rg-role">
          <span className="rg-role-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
          </span>
          <span className="rg-role-text">
            <span className="rg-role-label">Soy Estudiante</span>
            <span className="rg-role-desc">Pide y recibe en el campus</span>
          </span>
          <svg className="rg-role-arrow" viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
        </Link>

        <Link to="/registro?rol=vendedor" className="rg-role">
          <span className="rg-role-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          </span>
          <span className="rg-role-text">
            <span className="rg-role-label">Soy Vendedor</span>
            <span className="rg-role-desc">Publica tu local y vende</span>
          </span>
          <svg className="rg-role-arrow" viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
        </Link>
      </div>
    </MarcoAuth>
  );
}
