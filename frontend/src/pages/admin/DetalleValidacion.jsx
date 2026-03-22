import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/admin/DetalleValidacion.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://192.168.1.132:5000";

function DetalleValidacion() {
  const { id } = useParams();
  const [local, setLocal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get(`/admin/local/${id}`);
        setLocal(res.data);
      } catch {
        navigate("/admin/validar");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id, navigate]);

  const handleDecision = async (aprobado) => {
    try {
      await api.put(`/locales/${id}/aprobar`, { aprobado });
      navigate("/admin/validar");
    } catch {
      alert("Error al procesar");
    }
  };

  if (cargando) return (
    <div className="dv-wrap">
      <div className="dv-orbe dv-orbe-1" /><div className="dv-orbe dv-orbe-2" />
      <p className="dv-loading">Cargando...</p>
    </div>
  );
  if (!local) return null;

  return (
    <div className="dv-wrap">
      <div className="dv-orbe dv-orbe-1" />
      <div className="dv-orbe dv-orbe-2" />

      <div className="dv-container">
        <button onClick={() => navigate("/admin/validar")} className="dv-back">
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver a solicitudes
        </button>

        <div className="dv-card">
          <div className="dv-card-top-border" />

          <h2 className="dv-title">Detalle del Local</h2>

          <div className="dv-info-list">
            <div className="dv-info-item">
              <p className="dv-info-label">NOMBRE</p>
              <p className="dv-info-value dv-value-large">{local.nombre}</p>
            </div>
            <div className="dv-info-item">
              <p className="dv-info-label">DESCRIPCIÓN</p>
              <p className="dv-info-value">{local.descripcion}</p>
            </div>
            <div className="dv-info-item">
              <p className="dv-info-label">DIRECCIÓN</p>
              <p className="dv-info-value">
                <svg viewBox="0 0 16 16" fill="none" width="13" height="13" style={{display:"inline", marginRight:"5px", verticalAlign:"middle"}}>
                  <path d="M8 1.5a4.5 4.5 0 00-4.5 4.5c0 3 4.5 8.5 4.5 8.5s4.5-5.5 4.5-8.5A4.5 4.5 0 008 1.5zm0 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="#666"/>
                </svg>
                {local.direccion}
              </p>
            </div>

            <div className="dv-divider" />

            <div className="dv-info-item">
              <p className="dv-info-label">VENDEDOR</p>
              <p className="dv-info-value dv-value-medium">{local.vendedor?.nombre_completo}</p>
            </div>
            <div className="dv-info-item">
              <p className="dv-info-label">EMAIL DEL VENDEDOR</p>
              <p className="dv-info-value">
                <svg viewBox="0 0 16 16" fill="none" width="13" height="13" style={{display:"inline", marginRight:"5px", verticalAlign:"middle"}}>
                  <path d="M2 4a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm0 0l6 5 6-5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {local.vendedor?.email}
              </p>
            </div>

            {local.fotos?.length > 0 && (
              <div className="dv-info-item">
                <p className="dv-info-label">FOTOS</p>
                <div className="dv-fotos">
                  {local.fotos.map((foto, i) => (
                    <img key={i} src={`${BASE_URL}${foto}`} className="dv-foto" />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="dv-actions">
            <button onClick={() => handleDecision(true)} className="dv-btn-aprobar">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              Aprobar Local
            </button>
            <button onClick={() => handleDecision(false)} className="dv-btn-rechazar">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              Rechazar Local
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleValidacion;