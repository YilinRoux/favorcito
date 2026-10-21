/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import socket from "../services/socket";
import { getApiBaseUrl } from "../utils/runtimeUrls";

export const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notificaciones, setNotificaciones] = useState({});
  const [chatActivo, setChatActivo] = useState(null);
  const { usuario } = useContext(AuthContext);

  useEffect(() => {
    if (!usuario) {
      socket.disconnect();
      return;
    }

    const registrarYUnirse = () => {
      socket.emit("registrarUsuario", usuario.id);

      const unirseAPedidos = async () => {
        try {
          let url = "";
          if (usuario.rol === "estudiante") url = "/pedidos/mis-pedidos";
          if (usuario.rol === "vendedor") url = "/pedidos/vendedor";
          if (!url) return;

          const baseUrl = getApiBaseUrl();
          const res = await fetch(`${baseUrl}/api${url}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });

          const pedidos = await res.json();

          if (Array.isArray(pedidos)) {
            pedidos.forEach((p) => socket.emit("unirsePedido", p._id));
          }
        } catch (err) {
          console.error("Error uniendose a pedidos:", err);
        }
      };

      unirseAPedidos();
    };

    socket.on("connect", registrarYUnirse);
    if (socket.connected) registrarYUnirse();
    else socket.connect();

    return () => {
      socket.off("connect", registrarYUnirse);
      socket.disconnect();
    };
  }, [usuario]);

  useEffect(() => {
    const handler = ({ pedidoId, emisorId }) => {
      if (!usuario) return;

      if (String(emisorId) === String(usuario.id || usuario._id)) {
        return;
      }

      if (pedidoId === chatActivo) {
        return;
      }

      setNotificaciones((prev) => ({
        ...prev,
        [pedidoId]: (prev[pedidoId] || 0) + 1,
      }));
    };

    socket.on("nuevaNotificacion", handler);
    return () => socket.off("nuevaNotificacion", handler);
  }, [chatActivo, usuario]);

  const entrarAlChat = (pedidoId) => {
    setChatActivo(pedidoId);
    setNotificaciones((prev) => {
      const copia = { ...prev };
      delete copia[pedidoId];
      return copia;
    });
  };

  const salirDelChat = () => setChatActivo(null);

  const total = Object.values(notificaciones).reduce(
    (acc, val) => acc + val,
    0
  );

  return (
    <NotificationContext.Provider
      value={{ notificaciones, total, entrarAlChat, salirDelChat }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
