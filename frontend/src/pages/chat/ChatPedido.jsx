import { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../../services/socket";
import api from "../../services/api";
import { NotificationContext } from "../../context/NotificationContext";
import { AuthContext } from "../../context/AuthContext";

export default function ChatPedido() {
  const { pedidoId } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const { entrarAlChat, salirDelChat } = useContext(NotificationContext);

  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [escribiendo, setEscribiendo] = useState("");
  const [pedido, setPedido] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    entrarAlChat(pedidoId);
    return () => salirDelChat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId]);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [mensajesRes, pedidoRes] = await Promise.all([
          api.get(`/chat/${pedidoId}`),
          api.get(`/pedidos/${pedidoId}`)
        ]);
        setMensajes(mensajesRes.data);
        setPedido(pedidoRes.data);
      } catch (error) {
        console.error("Error cargando chat:", error);
      }
    };
    cargar();
  }, [pedidoId]);

  useEffect(() => {
    socket.emit("unirsePedido", pedidoId);
    if (usuario) socket.emit("registrarUsuario", usuario.id);

    socket.on("nuevoMensaje", (msg) => {
      setMensajes((prev) => [...prev, msg]);
    });

    socket.on("usuarioEscribiendo", (nombre) => {
      setEscribiendo(nombre);
      setTimeout(() => setEscribiendo(""), 2000);
    });

    return () => {
      socket.off("nuevoMensaje");
      socket.off("usuarioEscribiendo");
    };
  }, [pedidoId, usuario]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const enviarMensaje = async () => {
    if (!mensaje.trim()) return;
    try {
      await api.post(`/chat/${pedidoId}`, { mensaje });
      setMensaje("");
    } catch (error) {
      console.error("Error enviando mensaje:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  const handleInputChange = (e) => {
    setMensaje(e.target.value);
    socket.emit("escribiendo", { pedidoId, usuario: usuario?.nombre || "Alguien" });
  };

  const estadoLabel = {
    enviado: "Enviado",
    aceptado: "Aceptado",
    en_preparacion: "En preparación",
    listo: "Listo",
    en_camino: "En camino",
    entregado: "Entregado",
    cancelado: "Cancelado",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: "700px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", background: "white" }}>
        <button onClick={() => navigate(-1)} style={{ marginRight: "12px", color: "#6b7280" }}>
          ← Volver
        </button>
        <strong>Chat del Pedido</strong>
        {pedido && (
          <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
            {pedido.local?.nombre} —
            <span style={{ fontWeight: "600", marginLeft: "4px" }}>
              Estado: {estadoLabel[pedido.estado]}
            </span>
          </div>
        )}
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {mensajes.map((m, i) => {
          const esMio = m.emisor?._id === usuario?.id || m.emisor === usuario?.id;
          return (
            <div
              key={m._id || i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: esMio ? "flex-end" : "flex-start",
              }}
            >
              <span style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "2px" }}>
                {esMio ? "Tú" : (m.emisor?.nombre_completo || m.rol || "Usuario")}
              </span>
              <div style={{
                background: esMio ? "#3b82f6" : "#f3f4f6",
                color: esMio ? "white" : "#111827",
                padding: "8px 12px",
                borderRadius: esMio ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                maxWidth: "70%",
                fontSize: "14px",
              }}>
                {m.mensaje || m.contenido}
              </div>
            </div>
          );
        })}
        {escribiendo && (
          <p style={{ fontSize: "12px", color: "#9ca3af" }}>{escribiendo} está escribiendo...</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb", background: "white", display: "flex", gap: "8px" }}>
        <input
          value={mensaje}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          style={{
            flex: 1,
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          onClick={enviarMensaje}
          style={{
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}