import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/estudiante/DetalleLocal.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://192.168.1.132:5000";

function DetalleLocal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);

  const [local, setLocal] = useState(null);
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState("menu");
  const [comentario, setComentario] = useState("");
  const [estrellas, setEstrellas] = useState(0);
  const [reporteAbierto, setReporteAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarLocal = async () => {
    try {
      const localRes = await api.get(`/locales/${id}`);
      setLocal(localRes.data);
      const productosRes = await api.get(`/productos/local/${id}`);
      setProductos(productosRes.data);
    } catch {
      navigate("/menu");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarLocal();
  }, [id]);

  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((p) => p.producto === producto._id);
      if (existe) return prev.map((p) => p.producto === producto._id ? { ...p, cantidad: p.cantidad + 1 } : p);
      return [...prev, { producto: producto._id, nombre: producto.nombre, precio: producto.precio, cantidad: 1 }];
    });
  };

  const quitarDelCarrito = (productoId) => {
    setCarrito((prev) => {
      const existe = prev.find((p) => p.producto === productoId);
      if (existe && existe.cantidad > 1) return prev.map((p) => p.producto === productoId ? { ...p, cantidad: p.cantidad - 1 } : p);
      return prev.filter((p) => p.producto !== productoId);
    });
  };

  const totalCarrito = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

  const handleCalificar = async (estrella) => {
    try {
      await api.post(`/locales/${id}/calificar`, { estrellas: estrella });
      setEstrellas(estrella);
      const localRes = await api.get(`/locales/${id}`);
      setLocal(localRes.data);
      setMensaje("¡Calificación guardada!");
    } catch {
      alert("Error al calificar");
    }
  };

  const handleComentar = async () => {
    if (!comentario.trim()) return;
    try {
      await api.post(`/locales/${id}/comentar`, { texto: comentario });
      setLocal((prev) => ({
        ...prev,
        comentarios: [...(prev.comentarios || []), { usuario: { nombre_completo: usuario?.nombre_completo }, texto: comentario, fecha: new Date() }]
      }));
      setComentario("");
      setMensaje("Comentario agregado");
    } catch {
      alert("Error al comentar");
    }
  };

  const handleReportar = async () => {
    if (!motivo) return;
    try {
      await api.post("/reportes", { tipoReportado: "local", localReportado: id, motivo });
      setReporteAbierto(false);
      setMotivo("");
      setMensaje("Reporte enviado al administrador");
    } catch {
      alert("Error al reportar");
    }
  };

  if (cargando) return (
    <div className="dl-wrap">
      <div className="dl-orb-1" /><div className="dl-orb-2" />
      <div className="dl-loading">
        <div className="dl-loading-spinner" />
        <span>Cargando local...</span>
      </div>
    </div>
  );

  if (!local) return null;

  return (
    <div className="dl-wrap">
      <div className="dl-orb-1" />
      <div className="dl-orb-2" />
      <div className="dl-particles" aria-hidden="true">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="dl-p" style={{ '--dur': `${6 + i}s`, '--delay': `${i * 0.9}s`, left: `${8 + i * 13}%`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px` }} />
        ))}
      </div>

      <div className="dl-inner">

        {/* ── Info del local ── */}
        <div className="dl-card dl-card--local">
          <div className="dl-local-header">
            <div className="dl-local-info">
              <h2 className="dl-local-nombre">{local.nombre}</h2>
              <p className="dl-local-desc">{local.descripcion}</p>
              <div className="dl-local-dir">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {local.direccion}
              </div>
              <div className="dl-rating">
                <div className="dl-stars-row">
                  {[1,2,3,4,5].map(n => (
                    <svg key={n} width="14" height="14" viewBox="0 0 24 24"
                      fill={n <= Math.round(local.calificacionPromedio || 0) ? "#FF5C0A" : "none"}
                      stroke={n <= Math.round(local.calificacionPromedio || 0) ? "#FF5C0A" : "rgba(255,255,255,0.2)"}
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>
                <span className="dl-rating-txt">
                  {local.totalCalificaciones > 0
                    ? `${local.calificacionPromedio?.toFixed(1)} (${local.totalCalificaciones} reseñas)`
                    : "Sin calificaciones"}
                </span>
              </div>
            </div>
            <button onClick={() => setReporteAbierto(true)} className="dl-btn-reporte">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
              Reportar
            </button>
          </div>

          {local.promocionActiva && (
            <div className="dl-badge dl-badge--promo">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Envío gratis en pedidos mayores a ${local.montoMinimoPromocion} por Favorcito
            </div>
          )}

          {local.anuncio && (
            <div className="dl-badge dl-badge--anuncio">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/>
              </svg>
              {local.anuncio}
            </div>
          )}

          {local.imagenesAnuncios?.length > 0 && (
            <div className="dl-imagenes-scroll">
              {local.imagenesAnuncios.map((img, i) => (
                <img 
            key={i} 
            src={`${BASE_URL}${img}`} 
            className="dl-imagen-anuncio" 
            alt={`Anuncio ${i + 1}`} 
               />
              ))}
            </div>
          )}
        </div>

        {mensaje && (
          <div className="dl-success">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {mensaje}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="dl-tabs">
          <button onClick={() => setTab("menu")} className={`dl-tab-btn${tab === "menu" ? " dl-tab-btn--active" : ""}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
            </svg>
            Menú
          </button>
          <button onClick={() => setTab("resenas")} className={`dl-tab-btn${tab === "resenas" ? " dl-tab-btn--active" : ""}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Reseñas
            <span className="dl-tab-count">{local.comentarios?.length || 0}</span>
          </button>
        </div>

        {/* ── TAB MENÚ ── */}
        {tab === "menu" && (
          <div className="dl-productos-lista">
            {productos.length === 0 ? (
              <div className="dl-empty">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
                  <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
                </svg>
                <p>Este local no tiene productos aún.</p>
              </div>
            ) : (
              productos.map((producto, i) => {
                const enCarrito = carrito.find((p) => p.producto === producto._id);
                return (
                  <div key={producto._id} className="dl-producto-card" style={{ animationDelay: `${i * 0.06}s` }}>
                    {producto.imagen ? (
                      <img 
                      src={`${BASE_URL}${producto.imagen}`} 
                      className="dl-producto-img" 
                      alt={producto.nombre} 
                       />
                    ) : (
                      <div className="dl-producto-img-placeholder">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
                          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
                        </svg>
                      </div>
                    )}
                    <div className="dl-producto-info">
                      <p className="dl-producto-nombre">{producto.nombre}</p>
                      {producto.descripcion && <p className="dl-producto-desc">{producto.descripcion}</p>}
                      <p className="dl-producto-precio">${producto.precio}</p>
                      <p className="dl-producto-stock">Stock: {producto.stock}</p>
                    </div>
                    <div className="dl-carrito-ctrl">
                      {enCarrito ? (
                        <>
                          <button onClick={() => quitarDelCarrito(producto._id)} className="dl-qty-btn dl-qty-btn--minus">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </button>
                          <span className="dl-qty-num">{enCarrito.cantidad}</span>
                          <button onClick={() => agregarAlCarrito(producto)} className="dl-qty-btn dl-qty-btn--plus">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </button>
                        </>
                      ) : (
                        <button onClick={() => agregarAlCarrito(producto)} className="dl-btn-agregar">
                          Agregar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── TAB RESEÑAS ── */}
        {tab === "resenas" && (
          <div className="dl-resenas-lista">
            <div className="dl-card">
              <p className="dl-section-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                Califica este local
              </p>
              <div className="dl-stars-picker">
                {[1, 2, 3, 4, 5].map((e) => (
                  <button key={e} onClick={() => handleCalificar(e)} className={`dl-star-pick${e <= estrellas ? " dl-star-pick--active" : ""}`} aria-label={`${e} estrellas`}>
                    <svg width="30" height="30" viewBox="0 0 24 24"
                      fill={e <= estrellas ? "#FF5C0A" : "none"}
                      stroke={e <= estrellas ? "#FF5C0A" : "rgba(255,255,255,0.2)"}
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div className="dl-card">
              <p className="dl-section-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Deja un comentario
              </p>
              <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="¿Cómo fue tu experiencia?" rows={3} className="dl-input dl-textarea" />
              <button onClick={handleComentar} className="dl-btn dl-btn--sm">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Publicar
              </button>
            </div>

            {(local.comentarios || []).length === 0 ? (
              <div className="dl-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p>No hay comentarios aún.</p>
              </div>
            ) : (
              [...(local.comentarios || [])].reverse().map((c, i) => (
                <div key={i} className="dl-comentario-card" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="dl-comentario-header">
                    <div className="dl-comentario-avatar">{(c.usuario?.nombre_completo || "U")[0].toUpperCase()}</div>
                    <div>
                      <p className="dl-comentario-autor">{c.usuario?.nombre_completo || "Usuario"}</p>
                      <p className="dl-comentario-fecha">{new Date(c.fecha).toLocaleDateString("es-MX")}</p>
                    </div>
                  </div>
                  <p className="dl-comentario-texto">{c.texto}</p>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* ── Carrito flotante ── */}
      {carrito.length > 0 && (
        <div className="dl-carrito-float">
          <div className="dl-carrito-float-inner">
            <div className="dl-carrito-float-info">
              <p className="dl-carrito-float-count">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                {carrito.reduce((acc, p) => acc + p.cantidad, 0)} producto(s)
              </p>
              <p className="dl-carrito-float-total">${totalCarrito}</p>
              {local.promocionActiva && totalCarrito >= local.montoMinimoPromocion && (
                <p className="dl-carrito-float-promo dl-carrito-float-promo--activa">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ¡Envío gratis activado!
                </p>
              )}
              {local.promocionActiva && totalCarrito < local.montoMinimoPromocion && (
                <p className="dl-carrito-float-promo">Agrega ${local.montoMinimoPromocion - totalCarrito} más para envío gratis</p>
              )}
            </div>
            <button onClick={() => navigate("/confirmar", { state: { carrito, local } })} className="dl-btn dl-btn--carrito">
              Ver carrito
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Modal reporte ── */}
      {reporteAbierto && (
        <div className="dl-modal-overlay" onClick={() => setReporteAbierto(false)}>
          <div className="dl-modal" onClick={e => e.stopPropagation()}>
            <div className="dl-modal-header">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
              Reportar local
            </div>
            <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className="dl-input dl-select">
              <option value="">Selecciona un motivo</option>
              <option value="mal_servicio">Mal servicio</option>
              <option value="producto_en_mal_estado">Producto en mal estado</option>
              <option value="comportamiento_inapropiado">Comportamiento inapropiado</option>
              <option value="otro">Otro</option>
            </select>
            <div className="dl-modal-actions">
              <button onClick={handleReportar} disabled={!motivo} className={`dl-btn dl-btn--danger${!motivo ? " dl-btn--disabled" : ""}`}>
                Reportar
              </button>
              <button onClick={() => setReporteAbierto(false)} className="dl-btn dl-btn--ghost">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default DetalleLocal;