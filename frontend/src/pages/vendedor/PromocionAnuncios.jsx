import { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/vendedor/PromocionAnuncios.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://192.168.1.132:5000";

function PromocionAnuncios() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [promocionActiva, setPromocionActiva] = useState(false);
  const [montoMinimo, setMontoMinimo] = useState(200);
  const [anuncio, setAnuncio] = useState("");
  const [imagenesAnuncios, setImagenesAnuncios] = useState([]);
  const [nuevasImagenes, setNuevasImagenes] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get("/locales/mi-local");
        setPromocionActiva(res.data.promocionActiva);
        setMontoMinimo(res.data.montoMinimoPromocion);
        setAnuncio(res.data.anuncio || "");
        setImagenesAnuncios(res.data.imagenesAnuncios || []);
      } catch {
        setError("Error al cargar información");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const handleImagenes = (e) => {
    const files = Array.from(e.target.files);
    setNuevasImagenes(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleGuardar = async () => {
    setError("");
    setMensaje("");
    setGuardando(true);
    try {
      const formData = new FormData();
      formData.append("promocionActiva", promocionActiva);
      formData.append("montoMinimoPromocion", Number(montoMinimo));
      formData.append("anuncio", anuncio);
      nuevasImagenes.forEach((f) => formData.append("imagenesAnuncios", f));
      const res = await api.put("/locales/mi-local/promocion", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImagenesAnuncios(res.data.local.imagenesAnuncios || []);
      setNuevasImagenes([]);
      setPreviews([]);
      setMensaje("Configuración guardada correctamente");
    } catch {
      setError("Error al guardar configuración");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarImagen = async (imagen) => {
    if (!confirm("¿Eliminar esta imagen?")) return;
    try {
      const res = await api.put("/locales/mi-local/eliminar-imagen", { imagen });
      setImagenesAnuncios(res.data.local.imagenesAnuncios || []);
    } catch {
      alert("Error al eliminar imagen");
    }
  };

  if (cargando) return (
    <div className="pa-wrap">
      <div className="pa-orbe pa-orbe-1" />
      <div className="pa-orbe pa-orbe-2" />
      <p className="pa-loading">Cargando...</p>
    </div>
  );

  return (
    <div className="pa-wrap">
      <div className="pa-orbe pa-orbe-1" />
      <div className="pa-orbe pa-orbe-2" />

      <div className="pa-container">

        <h2 className="pa-page-title">
          <svg viewBox="0 0 24 24" fill="none" width="26" height="26">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Promoción y Anuncios
        </h2>

        {error && (
          <div className="pa-error">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}
        {mensaje && (
          <div className="pa-success">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            {mensaje}
          </div>
        )}

        {/* Anuncio de texto */}
        <div className="pa-card">
          <div className="pa-card-top-border" />
          <h3 className="pa-card-title">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Anuncio del local
          </h3>
          <p className="pa-card-desc">Este anuncio aparecerá en el menú principal para todos los estudiantes.</p>
          <textarea
            value={anuncio}
            onChange={(e) => setAnuncio(e.target.value)}
            className="pa-textarea"
            rows={3}
            placeholder="Ej: 🔥 2x1 en tacos hoy de 12 a 2pm"
            maxLength={150}
          />
          <p className="pa-char-count">{anuncio.length}/150</p>
        </div>

        {/* Imágenes */}
        <div className="pa-card">
          <div className="pa-card-top-border" />
          <h3 className="pa-card-title">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#FF5C0A" strokeWidth="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" stroke="#FF5C0A" strokeWidth="2"/>
              <path d="M21 15l-5-5L5 21" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Imágenes del local
          </h3>
          <p className="pa-card-desc">Agrega fotos de tus productos o promociones. Máximo 5 imágenes.</p>

          {imagenesAnuncios.length > 0 && (
            <div className="pa-img-grid">
              {imagenesAnuncios.map((img, i) => (
                <div key={i} className="pa-img-wrap">
                  {/* ✅ Cambiado: usa BASE_URL en lugar de localhost hardcodeado */}
                  <img src={`${BASE_URL}${img}`} className="pa-img" alt={`imagen-${i}`} />
                  <button onClick={() => eliminarImagen(img)} className="pa-img-delete">
                    <svg viewBox="0 0 12 12" fill="currentColor" width="10" height="10">
                      <path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="pa-file-label">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Subir imágenes
            <input type="file" accept="image/*" multiple onChange={handleImagenes} className="pa-file-input" />
          </label>

          {previews.length > 0 && (
            <div className="pa-img-grid pa-img-grid-preview">
              {previews.map((src, i) => (
                <img key={i} src={src} className="pa-img pa-img-preview" alt={`preview-${i}`} />
              ))}
            </div>
          )}
        </div>

        {/* Promoción Favorcito */}
        <div className="pa-card">
          <div className="pa-card-top-border" />
          <h3 className="pa-card-title">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-4 12a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4zm1-10H9a2 2 0 00-2 2v6h12v-6a2 2 0 00-2-2z" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Promoción Favorcito
          </h3>
          <p className="pa-card-desc">Cuando un estudiante pida por Favorcito y su pedido supere el monto mínimo, el envío será gratis. Tú pagas al repartidor.</p>

          <div className="pa-toggle-row">
            <div>
              <p className="pa-toggle-label">Activar promoción</p>
              <p className={`pa-toggle-status ${promocionActiva ? "pa-status-on" : "pa-status-off"}`}>
                {promocionActiva ? "Promoción activa" : "Promoción inactiva"}
              </p>
            </div>
            <button
              onClick={() => setPromocionActiva(!promocionActiva)}
              className={`pa-toggle-btn ${promocionActiva ? "pa-toggle-off" : "pa-toggle-on"}`}
            >
              {promocionActiva ? "Desactivar" : "Activar"}
            </button>
          </div>

          <div className="pa-field">
            <label className="pa-label">MONTO MÍNIMO PARA PROMOCIÓN ($)</label>
            <input
              type="number"
              value={montoMinimo}
              onChange={(e) => setMontoMinimo(e.target.value)}
              className={`pa-input ${!promocionActiva ? "pa-input-disabled" : ""}`}
              min="0"
              disabled={!promocionActiva}
            />
            {promocionActiva && (
              <p className="pa-promo-hint">
                Pedidos mayores a ${montoMinimo} tendrán envío gratis por Favorcito
              </p>
            )}
          </div>
        </div>

        <button onClick={handleGuardar} disabled={guardando} className="pa-btn-save">
          <span className="pa-btn-shimmer" />
          {guardando ? "Guardando..." : "Guardar configuración"}
        </button>

      </div>
    </div>
  );
}

export default PromocionAnuncios;