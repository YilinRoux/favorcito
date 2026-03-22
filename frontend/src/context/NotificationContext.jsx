/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from "react";
import socket from "../services/socket";

const BASE_URL = import.meta.env.VITE_API_URL || "http://192.168.1.132:5000";

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

          const res = await fetch(`${BASE_URL}/api${url}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });

          const pedidos = await res.json();

          if (Array.isArray(pedidos)) {
            pedidos.forEach((p) => socket.emit("unirsePedido", p._id));
          }
        } catch (err) {
          console.error("Error uniéndose a pedidos:", err);
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

  // 🔔 EFECTO DE NOTIFICACIONES CON LOGS TEMPORALES
  useEffect(() => {
    const handler = ({ pedidoId, emisorId }) => {
      console.log("🔔 nuevaNotificacion recibida:", { pedidoId, emisorId });

      const usuario = JSON.parse(localStorage.getItem("usuario"));
      console.log("👤 usuario actual:", usuario?.id);
      console.log("💬 chatActivo:", chatActivo);

      if (emisorId === usuario?.id) {
        console.log("❌ ignorada: soy el emisor");
        return;
      }

      if (pedidoId === chatActivo) {
        console.log("❌ ignorada: estoy en ese chat");
        return;
      }

      console.log("✅ notificacion contada");

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