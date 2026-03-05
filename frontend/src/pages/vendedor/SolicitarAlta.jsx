import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Solicitar Alta de Local</h2>
        <p className="text-gray-500 mb-6">Llena el formulario y un administrador revisará tu solicitud.</p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Nombre del local</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border-2 border-gray-300 px-4 py-2 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Ej: Tacos El Güero"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full border-2 border-gray-300 px-4 py-2 rounded-lg focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="¿Qué vendes?"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Dirección</label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="w-full border-2 border-gray-300 px-4 py-2 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Ej: Edificio A, planta baja"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Fotos del local (máx. 3)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFotos}
              className="w-full border-2 border-gray-300 px-4 py-2 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            {previews.length > 0 && (
              <div className="flex gap-2 mt-3">
                {previews.map((src, i) => (
                  <img key={i} src={src} className="w-20 h-20 object-cover rounded-lg border" />
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400 transition"
          >
            {cargando ? "Enviando..." : "Enviar Solicitud"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SolicitarAlta;