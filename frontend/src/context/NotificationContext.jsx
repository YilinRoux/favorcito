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

  // Reconciliar con la base de datos: los eventos de socket pueden perderse.
  useEffect(() => {
    if (!usuario || !["estudiante", "vendedor"].includes(usuario.rol)) {
      setNotificaciones({});
      return;
    }

    let activo = true;
    const actualizarNoLeidos = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };
      const baseUrl = getApiBaseUrl();
      const ruta = usuario.rol === "vendedor" ? "/pedidos/vendedor" : "/pedidos/mis-pedidos";

      try {
        const respuesta = await fetch(`${baseUrl}/api${ruta}`, { headers });
        if (!respuesta.ok) return;
        const pedidos = await respuesta.json();
        if (!Array.isArray(pedidos)) return;

        const conteos = await Promise.all(
          pedidos.map(async (pedido) => {
            try {
              const res = await fetch(`${baseUrl}/api/chat/${pedido._id}/no-leidos`, { headers });
              if (!res.ok) return null;
              const data = await res.json();
              return [pedido._id, Number(data.noLeidos) || 0];
            } catch {
              return null;
            }
          })
        );

        if (!activo) return;
        setNotificaciones((prev) => {
          const siguiente = {};
          for (const item of conteos) {
            if (item && item[1] > 0 && item[0] !== chatActivo) siguiente[item[0]] = item[1];
          }
          // Mantener valores anteriores si alguna consulta individual falló.
          for (const pedido of pedidos) {
            if (!conteos.some((item) => item?.[0] === pedido._id) && prev[pedido._id] && pedido._id !== chatActivo) {
              siguiente[pedido._id] = prev[pedido._id];
            }
          }
          return siguiente;
        });
      } catch (error) {
        console.error("Error consultando mensajes no leídos:", error);
      }
    };

    actualizarNoLeidos();
    const intervalo = setInterval(actualizarNoLeidos, 10000);
    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, [usuario, chatActivo]);

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
