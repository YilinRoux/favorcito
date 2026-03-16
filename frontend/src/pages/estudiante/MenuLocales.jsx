import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/estudiante/MenuLocales.css";

function MenuLocales() {
  const [locales, setLocales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [imagenActiva, setImagenActiva] = useState(0);
  const navigate = useNavigate();

  const cargar = async () => {
    try {
      const res = await api.get("/locales");
      const ordenados = res.data.sort((a, b) => {
        if (a.promocionActiva && !b.promocionActiva) return -1;
        if (!a.promocionActiva && b.promocionActiva) return 1;
        return 0;
      });
      setLocales(ordenados);
    } catch {
      setLocales([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, []);

  const imagenesPromo = locales
    .filter((l) => l.promocionActiva && l.imagenesAnuncios?.length > 0)
    .flatMap((local) =>
      local.imagenesAnuncios.map((img) => ({
        imagen: img,
        localNombre: local.nombre,
        localId: local._id,
        anuncio: local.anuncio,
        monto: local.montoMinimoPromocion,
      }))
    );

  useEffect(() => {
    if (imagenesPromo.length === 0) return;
    const interval = setInterval(() => {
      setImagenActiva((prev) => (prev + 1) % imagenesPromo.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [imagenesPromo.length]);

  if (cargando) return (
    <div className="ml-wrap">
      <div className="ml-orb-1" /><div className="ml-orb-2" />
      <div className="ml-loading">
        <div className="ml-loading-spinner" />
        <span>Cargando locales...</span>
      </div>
    </div>
  );

  return (
    <div className="ml-wrap">
      <div className="ml-orb-1" />
      <div className="ml-orb-2" />
      <div className="ml-particles" aria-hidden="true">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="ml-p" style={{ '--dur': `${6 + i}s`, '--delay': `${i * 0.85}s`, left: `${6 + i * 12}%`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px` }} />
        ))}
      </div>

      <div className="ml-inner">

        {/* ── Header ── */}
        <div className="ml-header">
          <div className="ml-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <h2 className="ml-title">Locales disponibles</h2>
            <p className="ml-subtitle">{locales.length} local{locales.length !== 1 ? "es" : ""} en tu campus</p>
          </div>
        </div>

        {/* ── Carrusel promociones ── */}
        {imagenesPromo.length > 0 && (
          <div className="ml-carrusel">
            <div className="ml-carrusel-img-wrap">
              <img
                src={`http://localhost:5000${imagenesPromo[imagenActiva].imagen}`}
                alt="Promoción"
                className="ml-carrusel-img"
              />
              <div className="ml-carrusel-overlay" />
              {/* Puntos de navegación */}
              {imagenesPromo.length > 1 && (
                <div className="ml-carrusel-dots">
                  {imagenesPromo.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImagenActiva(i)}
                      className={`ml-dot${i === imagenActiva ? " ml-dot--active" : ""}`}
                      aria-label={`Ir a promoción ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="ml-carrusel-info">
              <div className="ml-carrusel-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Envío gratis
              </div>
              <p className="ml-carrusel-nombre">
                {imagenesPromo[imagenActiva].localNombre}
                <span className="ml-carrusel-monto">en pedidos +${imagenesPromo[imagenActiva].monto}</span>
              </p>
              {imagenesPromo[imagenActiva].anuncio && (
                <p className="ml-carrusel-anuncio">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {imagenesPromo[imagenActiva].anuncio}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Lista de locales ── */}
        {locales.length === 0 ? (
          <div className="ml-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <p>No hay locales disponibles por ahora.</p>
          </div>
        ) : (
          <div className="ml-locales-lista">
            {locales.map((local, i) => (
              <div
                key={local._id}
                onClick={() => navigate(`/local/${local._id}`)}
                className={`ml-local-card${local.promocionActiva ? " ml-local-card--promo" : ""}`}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                {/* Badge promoción */}
                {local.promocionActiva && (
                  <div className="ml-promo-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Envío gratis +${local.montoMinimoPromocion}
                  </div>
                )}

                <div className="ml-local-row">
                  {/* Imagen */}
                  {local.fotos?.[0] ? (
                    <img
                      src={`http://localhost:5000${local.fotos[0]}`}
                      alt={local.nombre}
                      className="ml-local-img"
                    />
                  ) : (
                    <div className="ml-local-img-placeholder">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </div>
                  )}

                  {/* Info */}
                  <div className="ml-local-info">
                    <p className="ml-local-nombre">{local.nombre}</p>
                    <p className="ml-local-desc">{local.descripcion}</p>
                    <div className="ml-local-dir">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {local.direccion}
                    </div>

                    <div className="ml-local-rating">
                      <div className="ml-stars-mini">
                        {[1,2,3,4,5].map(n => (
                          <svg key={n} width="11" height="11" viewBox="0 0 24 24"
                            fill={n <= Math.round(local.calificacionPromedio || 0) ? "#FF5C0A" : "none"}
                            stroke={n <= Math.round(local.calificacionPromedio || 0) ? "#FF5C0A" : "rgba(255,255,255,0.18)"}
                            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                        ))}
                      </div>
                      {local.totalCalificaciones > 0 ? (
                        <span className="ml-rating-txt">({local.totalCalificaciones} reseñas)</span>
                      ) : (
                        <span className="ml-rating-txt ml-rating-txt--empty">Sin calificaciones</span>
                      )}
                    </div>

                    {local.anuncio && (
                      <div className="ml-anuncio-chip">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/>
                        </svg>
                        {local.anuncio}
                      </div>
                    )}
                  </div>

                  {/* Flecha */}
                  <div className="ml-local-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default MenuLocales;