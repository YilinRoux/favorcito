/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from "react";
import socket from "../services/socket";
import { getApiBaseUrl } from "../utils/runtimeUrls";

export const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notificaciones, setNotificaciones] = useState({});
  const [chatActivo, setChatActivo] = useState(null);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) return;

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

    if (socket.connected) {
      registrarYUnirse();
    } else {
      socket.connect();
      socket.on("connect", registrarYUnirse);
    }

    return () => {
      socket.off("connect", registrarYUnirse);
    };
  }, []);

  useEffect(() => {
    const handler = ({ pedidoId, emisorId }) => {
      const usuario = JSON.parse(localStorage.getItem("usuario"));

      if (emisorId === usuario?.id) {
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
  }, [chatActivo]);

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
