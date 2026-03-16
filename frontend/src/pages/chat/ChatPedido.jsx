import { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../../services/socket";
import api from "../../services/api";
import { NotificationContext } from "../../context/NotificationContext";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/chat/ChatPedido.css";

const estadoLabel = {
  enviado:        "Enviado",
  aceptado:       "Aceptado",
  en_preparacion: "En preparación",
  listo:          "Listo",
  en_camino:      "En camino",
  entregado:      "Entregado",
  cancelado:      "Cancelado",
};

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

  return (
    <div className="chat-wrap">

      {/* ── Header ── */}
      <div className="chat-header">
        <button onClick={() => navigate(-1)} className="chat-back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Volver
        </button>

        <div className="chat-header-info">
          <div className="chat-header-top">
            <div className="chat-header-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span className="chat-header-titulo">Chat del Pedido</span>
            {/* Indicador online */}
            <span className="chat-online-dot" />
          </div>
          {pedido && (
            <div className="chat-header-meta">
              <span className="chat-local-nombre">{pedido.local?.nombre}</span>
              <span className="chat-header-sep">·</span>
              <span className={`chat-estado-chip chat-estado-chip--${pedido.estado}`}>
                {estadoLabel[pedido.estado]}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Área de mensajes ── */}
      <div className="chat-mensajes">
        {mensajes.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p>Sé el primero en escribir</p>
          </div>
        )}

        {mensajes.map((m, i) => {
          const esMio = m.emisor?._id === usuario?.id || m.emisor === usuario?.id;
          return (
            <div key={m._id || i} className={`chat-msg-wrap${esMio ? " chat-msg-wrap--mio" : ""}`}>
              <span className="chat-msg-autor">
                {esMio ? "Tú" : (m.emisor?.nombre_completo || m.rol || "Usuario")}
              </span>
              <div className={`chat-burbuja${esMio ? " chat-burbuja--mia" : " chat-burbuja--otro"}`}>
                {m.mensaje || m.contenido}
              </div>
            </div>
          );
        })}

        {escribiendo && (
          <div className="chat-escribiendo">
            <span className="chat-escribiendo-dots">
              <span /><span /><span />
            </span>
            <span>{escribiendo} está escribiendo...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="chat-input-bar">
        <input
          value={mensaje}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          className="chat-input"
        />
        <button onClick={enviarMensaje} className="chat-send-btn" aria-label="Enviar mensaje">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

    </div>
  );
}