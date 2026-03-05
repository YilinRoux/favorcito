import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

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

  if (cargando) return <div className="p-10 text-gray-500">Cargando...</div>;
  if (!pedido) return null;

  if (pedido.estado !== "entregado") {
    return (
      <div className="max-w-md mx-auto p-4 text-center mt-10">
        <div className="bg-white rounded-2xl shadow p-8">
          <p className="text-gray-500">Solo puedes calificar pedidos entregados.</p>
          <button
            onClick={() => navigate("/mis-pedidos")}
            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">⭐ Calificar Pedido</h2>

      {mensaje && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {mensaje}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-6 mb-4">
        <p className="text-gray-500 text-sm">Local</p>
        <p className="font-bold text-gray-800 text-lg">{pedido.local?.nombre}</p>
      </div>

      {/* Estrellas */}
      <div className="bg-white rounded-2xl shadow p-6 mb-4">
        <h3 className="font-bold text-gray-700 mb-4">¿Cómo fue tu experiencia?</h3>
        <div className="flex gap-3 justify-center">
          {[1, 2, 3, 4, 5].map((e) => (
            <button
              key={e}
              onClick={() => setEstrellas(e)}
              className={`text-4xl transition transform hover:scale-110 ${
                e <= estrellas ? "opacity-100" : "opacity-30"
              }`}
            >
              ⭐
            </button>
          ))}
        </div>
        {estrellas > 0 && (
          <p className="text-center text-gray-500 mt-2 text-sm">
            {estrellas === 1 && "Muy malo"}
            {estrellas === 2 && "Malo"}
            {estrellas === 3 && "Regular"}
            {estrellas === 4 && "Bueno"}
            {estrellas === 5 && "¡Excelente!"}
          </p>
        )}
      </div>

      {/* Comentario */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <h3 className="font-bold text-gray-700 mb-3">Deja un comentario (opcional)</h3>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg focus:border-blue-500 focus:outline-none"
          rows={3}
          placeholder="¿Qué tal estuvo el servicio?"
        />
      </div>

      <button
        onClick={handleCalificar}
        disabled={enviando || estrellas === 0}
        className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 disabled:bg-gray-400 transition"
      >
        {enviando ? "Enviando..." : "Enviar calificación"}
      </button>
    </div>
  );
}

export default CalificarPedido;