import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import MarcoAuth from "../../components/auth/MarcoAuth";
import "../../styles/vendedor/EstadoSolicitud.css";

function EstadoSolicitud() {
  const [local, setLocal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tema, setTema] = useState(() => localStorage.getItem("favorcito-tema") || "claro");
  const navigate = useNavigate();

  const aplicarTema = (nuevo) => {
    setTema(nuevo);
    localStorage.setItem("favorcito-tema", nuevo);
  };

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

  return (
    <MarcoAuth
      tema={tema}
      aplicarTema={aplicarTema}
      titulo={<>Tu local está<br /><em>en camino</em></>}
      descripcion="Aquí puedes consultar el estado de la solicitud y saber cuándo tu local esté listo para recibir pedidos."
    >
      {cargando ? (
        <div className="es-loading">Revisando tu solicitud…</div>
      ) : !local ? (
        <div className="es-empty">
          <span className="es-empty-icon">＋</span>
          <h2 className="rg-title">Aún no tienes una solicitud</h2>
          <p>Registra tu local para comenzar el proceso de revisión.</p>
          <button onClick={() => navigate("/vendedor/solicitar")} className="rg-btn">Registrar mi local</button>
        </div>
      ) : (
        <>
          <div className={`es-status ${local.aprobado ? "is-approved" : "is-pending"}`}>
            <span className="es-status-dot" />
            <div>
              <strong>{local.aprobado ? "Local aprobado" : "Solicitud en revisión"}</strong>
              <p>{local.aprobado ? "Ya puedes administrar tu local y recibir pedidos." : "Un administrador está revisando la información que enviaste."}</p>
            </div>
          </div>

          <h2 className="rg-title">Estado de tu solicitud</h2>

          <div className="es-info">
            <div><span>Nombre</span><strong>{local.nombre}</strong></div>
            <div><span>Descripción</span><strong>{local.descripcion}</strong></div>
            <div><span>Dirección</span><strong>{local.direccion}</strong></div>
          </div>

          {local.aprobado && (
            <button onClick={() => navigate("/vendedor/dashboard")} className="rg-btn">Ir a mi dashboard</button>
          )}
        </>
      )}
    </MarcoAuth>
  );
}

export default EstadoSolicitud;
