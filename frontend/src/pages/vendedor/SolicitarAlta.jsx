import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/vendedor/SolicitarAlta.css";

function SolicitarAlta() {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [fotos, setFotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleFotos = (e) => {
    const files = Array.from(e.target.files);
    setFotos(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    if (!nombre.trim() || !descripcion.trim() || !direccion.trim()) {
      setError("Todos los campos son obligatorios");
      setCargando(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("descripcion", descripcion);
      formData.append("direccion", direccion);
      fotos.forEach((f) => formData.append("fotos", f));

      await api.post("/locales", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/vendedor/estado");
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al enviar solicitud");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="sa-wrap">
      <div className="sa-orbe sa-orbe-1" />
      <div className="sa-orbe sa-orbe-2" />

      <div className="sa-card">
        <div className="sa-card-top-border" />

        <div className="sa-logo-wrap">
          <div className="sa-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" className="sa-logo-svg">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="sa-logo-text">Favorcito</span>
        </div>

        <div className="sa-badge">
          <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" fill="#22C55E"/>
          </svg>
          Alta de Local
        </div>

        <h2 className="sa-title">Registra tu local</h2>
        <p className="sa-subtitle">Un administrador revisará tu solicitud antes de publicarla</p>

        {error && (
          <div className="sa-error">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="sa-form">
          <div className="sa-field">
            <label className="sa-label">NOMBRE DEL LOCAL</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="sa-input"
              placeholder="Ej: Tacos El Güero"
            />
          </div>

          <div className="sa-field">
            <label className="sa-label">DESCRIPCIÓN</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="sa-input sa-textarea"
              rows={3}
              placeholder="¿Qué vendes?"
            />
          </div>

          <div className="sa-field">
            <label className="sa-label">DIRECCIÓN</label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="sa-input"
              placeholder="Ej: Edificio A, planta baja"
            />
          </div>

          <div className="sa-field">
            <label className="sa-label">FOTOS DEL LOCAL (MÁX. 3)</label>
            <label className="sa-file-label">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#FF5C0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Seleccionar imágenes
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFotos}
                className="sa-file-input"
              />
            </label>
            {previews.length > 0 && (
              <div className="sa-previews">
                {previews.map((src, i) => (
                  <img key={i} src={src} className="sa-preview-img" />
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={cargando} className="sa-btn">
            <span className="sa-btn-shimmer" />
            {cargando ? "Enviando..." : "Enviar Solicitud"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SolicitarAlta;