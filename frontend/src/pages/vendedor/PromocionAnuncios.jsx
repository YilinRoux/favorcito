import { useEffect, useState } from "react";
import api from "../../services/api";

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

  if (cargando) return <div className="p-10 text-gray-500">Cargando...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🎉 Promoción y Anuncios</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      {mensaje && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {mensaje}
        </div>
      )}

      {/* Anuncio de texto */}
      <div className="bg-white rounded-2xl shadow p-6 mb-4">
        <h3 className="text-lg font-bold text-gray-700 mb-2">📢 Anuncio del local</h3>
        <p className="text-gray-500 text-sm mb-3">
          Este anuncio aparecerá en el menú principal para todos los estudiantes.
        </p>
        <textarea
          value={anuncio}
          onChange={(e) => setAnuncio(e.target.value)}
          className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg focus:border-blue-500 focus:outline-none"
          rows={3}
          placeholder="Ej: 🔥 2x1 en tacos hoy de 12 a 2pm"
          maxLength={150}
        />
        <p className="text-gray-400 text-xs mt-1 text-right">{anuncio.length}/150</p>
      </div>

      {/* Imágenes de anuncios */}
      <div className="bg-white rounded-2xl shadow p-6 mb-4">
        <h3 className="text-lg font-bold text-gray-700 mb-2">🖼️ Imágenes del local</h3>
        <p className="text-gray-500 text-sm mb-3">
          Agrega fotos de tus productos o promociones. Máximo 5 imágenes.
        </p>

        {/* Imágenes actuales */}
        {imagenesAnuncios.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {imagenesAnuncios.map((img, i) => (
              <div key={i} className="relative">
                <img
                  src={`http://localhost:5000${img}`}
                  className="w-full h-24 object-cover rounded-xl border"
                />
                <button
                  onClick={() => eliminarImagen(img)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Subir nuevas */}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImagenes}
          className="w-full border-2 border-gray-300 px-4 py-2 rounded-lg focus:outline-none"
        />

        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            {previews.map((src, i) => (
              <img key={i} src={src} className="w-full h-24 object-cover rounded-xl border opacity-70" />
            ))}
          </div>
        )}
      </div>

      {/* Promoción Favorcito */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-700 mb-2">🛵 Promoción Favorcito</h3>
        <p className="text-gray-500 text-sm mb-4">
          Cuando un estudiante pida por Favorcito y su pedido supere el monto mínimo,
          el envío será gratis. Tú pagas al repartidor.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-between mb-4">
  <div>
    <p className="font-medium text-gray-700">Activar promoción</p>
    <p className="text-gray-400 text-sm">
      {promocionActiva ? "✅ Promoción activa" : "❌ Promoción inactiva"}
    </p>
  </div>
  <button
    onClick={() => setPromocionActiva(!promocionActiva)}
    className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
      promocionActiva
        ? "bg-red-100 text-red-600 hover:bg-red-200"
        : "bg-green-100 text-green-600 hover:bg-green-200"
    }`}
  >
    {promocionActiva ? "Desactivar" : "Activar"}
  </button>
</div>
        {/* Monto mínimo */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Monto mínimo para promoción ($)
          </label>
          <input
            type="number"
            value={montoMinimo}
            onChange={(e) => setMontoMinimo(e.target.value)}
            className="w-full border-2 border-gray-300 px-4 py-2 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            min="0"
            disabled={!promocionActiva}
          />
          {promocionActiva && (
            <p className="text-green-600 text-sm mt-2">
              🎉 Pedidos mayores a ${montoMinimo} tendrán envío gratis por Favorcito
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleGuardar}
        disabled={guardando}
        className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400 transition"
      >
        {guardando ? "Guardando..." : "Guardar configuración"}
      </button>
    </div>
  );
}

export default PromocionAnuncios;