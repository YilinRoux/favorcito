import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/vendedor/EstadoSolicitud.css";

function EstadoSolicitud() {
  const [local, setLocal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const obtener = async () => {
      try {
        const res = await api.get("/locales/mi-local");
        setLocal(res.data);
      } catch {
        setLocal(null);
      } finally {
        setCargando(false);
      }
    };
    obtener();
  }, []);

  if (cargando) return (
    <div className="es-wrap">
      <div className="es-orbe es-orbe-1" />
      <div className="es-orbe es-orbe-2" />
      <p className="es-loading">Cargando...</p>
    </div>
  );

  if (!local) return (
    <div className="es-wrap">
      <div className="es-orbe es-orbe-1" />
      <div className="es-orbe es-orbe-2" />
      <div className="es-card">
        <div className="es-card-top-border" />
        <div className="es-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="es-empty-text">No tienes ninguna solicitud registrada.</p>
        <button onClick={() => navigate("/vendedor/solicitar")} className="es-btn">
          <span className="es-btn-shimmer" />
          Solicitar Alta
        </button>
      </div>
    </div>
  );

  const estadoConfig = {
    true:  { texto: "Aprobado",  icono: "✅", clase: "es-badge-aprobado" },
    false: { texto: "Pendiente", icono: "⏳", clase: "es-badge-pendiente" },
  };

  const config = estadoConfig[local.aprobado] || estadoConfig[false];

  return (
    <div className="es-wrap">
      <div className="es-orbe es-orbe-1" />
      <div className="es-orbe es-orbe-2" />

      <div className="es-card">
        <div className="es-card-top-border" />

        <h2 className="es-title">Estado de tu Solicitud</h2>

        <div className={`es-badge ${config.clase}`}>
          <span>{config.icono}</span>
          <span>{config.texto}</span>
          {!local.aprobado && (
            <span className="es-badge-sub">Tu solicitud está siendo revisada por un administrador.</span>
          )}
        </div>

        <div className="es-info-list">
          <div className="es-info-item">
            <p className="es-info-label">Nombre</p>
            <p className="es-info-value">{local.nombre}</p>
          </div>
          <div className="es-info-item">
            <p className="es-info-label">Descripción</p>
            <p className="es-info-value">{local.descripcion}</p>
          </div>
          <div className="es-info-item">
            <p className="es-info-label">Dirección</p>
            <p className="es-info-value">
              <svg viewBox="0 0 16 16" fill="none" width="13" height="13" style={{display:"inline",marginRight:"4px",verticalAlign:"middle"}}>
                <path d="M8 1.5a4.5 4.5 0 00-4.5 4.5c0 3 4.5 8.5 4.5 8.5s4.5-5.5 4.5-8.5A4.5 4.5 0 008 1.5zm0 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="#666"/>
              </svg>
              {local.direccion}
            </p>
          </div>
        </div>

        {local.aprobado && (
          <button onClick={() => navigate("/vendedor/dashboard")} className="es-btn es-btn-green">
            <span className="es-btn-shimmer" />
            Ir a mi Dashboard
          </button>
        )}
      </div>
    </div>
  );
}

export default EstadoSolicitud;