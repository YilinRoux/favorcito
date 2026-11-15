import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import MarcoAuth from "../../components/auth/MarcoAuth";
import "../../styles/vendedor/SolicitarAlta.css";
import ImageWithFallback from "../../components/common/ImageWithFallback";
import { prepareImageFiles } from "../../utils/filePreviews";

function SolicitarAlta() {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [fotos, setFotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [tema, setTema] = useState(() => localStorage.getItem("favorcito-tema") || "claro");
  const navigate = useNavigate();

  const aplicarTema = (nuevo) => {
    setTema(nuevo);
    localStorage.setItem("favorcito-tema", nuevo);
  };

  const handleFotos = async (e) => {
    const { files, previews } = await prepareImageFiles(e.target.files, 3);
    setFotos(files);
    setPreviews(previews);
    e.target.value = "";
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
    <MarcoAuth
      tema={tema}
      aplicarTema={aplicarTema}
      titulo={<>Dale un lugar a tu <em>local</em><br />dentro de Favorcito</>}
      descripcion="Cuéntanos sobre tu negocio. Un administrador revisará la información antes de publicarlo."
    >
      <span className="sa-chip">Alta de local</span>
      <h2 className="rg-title">Registra tu local</h2>
      <p className="sa-subtitle">Completa los datos básicos y agrega hasta 3 fotografías.</p>

      {error && <div className="sa-error">{error}</div>}

      <form onSubmit={handleSubmit} className="sa-form">
        <div className="sa-field">
          <label className="sa-label">Nombre del local</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="rg-input" placeholder="Ej. Tacos El Güero" />
        </div>

        <div className="sa-field">
          <label className="sa-label">Descripción</label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="rg-textarea" rows={3} placeholder="¿Qué vendes y qué hace especial a tu local?" />
        </div>

        <div className="sa-field">
          <label className="sa-label">Dirección</label>
          <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="rg-input" placeholder="Ej. Edificio A, planta baja" />
        </div>

        <div className="sa-field">
          <label className="sa-label">Fotos del local <span>máx. 3</span></label>
          <label className="sa-file">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            <span>{fotos.length ? `${fotos.length} imagen(es) seleccionada(s)` : "Seleccionar imágenes"}</span>
            <input type="file" accept="image/*" multiple onChange={handleFotos} />
          </label>

          {previews.length > 0 && (
            <div className="sa-previews">
              {previews.map((preview, i) => (
                <ImageWithFallback key={`${preview.name}-${i}`} src={preview.src} className="sa-preview-img" alt={preview.name || `preview-${i}`} />
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={cargando} className="rg-btn">
          {cargando ? "Enviando..." : "Enviar solicitud"}
        </button>
      </form>
    </MarcoAuth>
  );
}

export default SolicitarAlta;
