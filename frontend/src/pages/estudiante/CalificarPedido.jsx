import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/estudiante/CalificarPedido.css";

function CalificarPedido() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get(`/pedidos/${id}`);
        setPedido(res.data);
      } catch {
        navigate("/mis-pedidos");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id, navigate]);

  const handleCalificar = async () => {
    if (estrellas === 0) {
      alert("Selecciona una calificación");
      return;
    }
    setEnviando(true);

    try {
      await api.post(`/locales/${pedido.local._id}/calificar`, { estrellas });

      if (comentario.trim()) {
        await api.post(`/locales/${pedido.local._id}/comentar`, { texto: comentario });
      }

      setMensaje("¡Gracias por tu calificación!");
      setTimeout(() => navigate("/mis-pedidos"), 2000);
    } catch {
      alert("Error al enviar calificación");
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) return (
    <div className="calp-wrap">
      <div className="calp-orb-1" />
      <div className="calp-orb-2" />
      <div className="calp-loading">
        <div className="calp-loading-spinner" />
        <span>Cargando pedido...</span>
      </div>
    </div>
  );

  if (!pedido) return null;

  if (pedido.estado !== "entregado") {
    return (
      <div className="calp-wrap">
        <div className="calp-orb-1" />
        <div className="calp-orb-2" />
        <div className="calp-particles" aria-hidden="true">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="calp-p" style={{ '--dur': `${6 + i}s`, '--delay': `${i * 0.9}s`, left: `${10 + i * 12}%`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px` }} />
          ))}
        </div>
        <div className="calp-inner">
          <div className="calp-card calp-card--no-entregado">
            <div className="calp-no-entregado-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p className="calp-no-entregado-text">Solo puedes calificar pedidos entregados.</p>
            <button onClick={() => navigate("/mis-pedidos")} className="calp-btn">
              Volver a mis pedidos
            </button>
          </div>
        </div>
      </div>
    );
  }

  const etiquetaEstrellas = ["", "Muy malo", "Malo", "Regular", "Bueno", "¡Excelente!"];

  return (
    <div className="calp-wrap">
      <div className="calp-orb-1" />
      <div className="calp-orb-2" />
      <div className="calp-particles" aria-hidden="true">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="calp-p" style={{ '--dur': `${6 + i}s`, '--delay': `${i * 0.9}s`, left: `${10 + i * 12}%`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px` }} />
        ))}
      </div>

      <div className="calp-inner">

        {/* Header */}
        <div className="calp-header">
          <div className="calp-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div>
            <h2 className="calp-title">Calificar Pedido</h2>
            <p className="calp-subtitle">Tu opinión mejora la experiencia de todos</p>
          </div>
        </div>

        {/* Mensaje de éxito */}
        {mensaje && (
          <div className="calp-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {mensaje}
          </div>
        )}

        {/* Card local */}
        <div className="calp-card">
          <p className="calp-label">Local</p>
          <p className="calp-local-nombre">{pedido.local?.nombre}</p>
        </div>

        {/* Card estrellas */}
        <div className="calp-card">
          <h3 className="calp-section-title">¿Cómo fue tu experiencia?</h3>
          <div className="calp-stars">
            {[1, 2, 3, 4, 5].map((e) => (
              <button
                key={e}
                onClick={() => setEstrellas(e)}
                className={`calp-star-btn${e <= estrellas ? " calp-star-btn--active" : ""}`}
                aria-label={`${e} estrellas`}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill={e <= estrellas ? "#FF5C0A" : "none"} stroke={e <= estrellas ? "#FF5C0A" : "rgba(255,255,255,0.25)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </button>
            ))}
          </div>
          {estrellas > 0 && (
            <p className="calp-stars-label">{etiquetaEstrellas[estrellas]}</p>
          )}
        </div>

        {/* Card comentario */}
        <div className="calp-card">
          <h3 className="calp-section-title">
            Deja un comentario
            <span className="calp-opcional">(opcional)</span>
          </h3>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="calp-input calp-textarea"
            rows={3}
            placeholder="¿Qué tal estuvo el servicio?"
          />
        </div>

        {/* Botón enviar */}
        <button
          onClick={handleCalificar}
          disabled={enviando || estrellas === 0}
          className={`calp-btn calp-btn--full${enviando || estrellas === 0 ? " calp-btn--disabled" : ""}`}
        >
          {enviando ? (
            <>
              <span className="calp-btn-spinner" />
              Enviando...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Enviar calificación
            </>
          )}
        </button>

      </div>
    </div>
  );
}

export default CalificarPedido;