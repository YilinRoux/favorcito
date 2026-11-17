import { useEffect, useState } from "react";
import api from "../../services/api";
import socket from "../../services/socket";
import "../../styles/vendedor/ReposicionesPendientes.css";
export default function DevolucionesPendientes() {
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try { const res = await api.get("/pedidos/devoluciones-pendientes"); if (activo) { setPedidos(res.data); setError(""); } }
      catch { if (activo) setError("No se pudieron consultar las devoluciones pendientes."); }
    };
    cargar(); socket.on("estadoActualizado", cargar);
    const timer = setInterval(cargar, 30000);
    return () => { activo = false; clearInterval(timer); socket.off("estadoActualizado", cargar); };
  }, []);
  const recibir = async (id) => {
    if (guardando || !window.confirm("¿Ya recibiste físicamente el pedido completo? Después decidirás qué unidades pueden reponerse.")) return;
    setGuardando(true); setError("");
    try {
      await api.put(`/pedidos/${id}/devolucion/recibir`);
      setPedidos((prev) => prev.filter((p) => p._id !== id));
      window.dispatchEvent(new Event("favorcito-revisar-stock"));
    } catch (err) { setError(err.response?.data?.mensaje || "No se pudo confirmar la recepción"); }
    finally { setGuardando(false); }
  };
  if (!pedidos.length && !error) return null;
  return <section className="rs-wrap rs-pending" aria-label="Devoluciones por recibir">
    {error && <p className="rs-error" role="alert">{error}</p>}
    {pedidos.length > 0 && <><h2 className="rs-return-title">Devoluciones por recibir · {pedidos.length}</h2><p className="rs-help">El estudiante conserva la comida y debe traerla al local. Confirma solo cuando la recibas físicamente; el stock todavía no se repone.</p>
      {pedidos.map((p) => <div className="rs-item" key={p._id}><span><strong>{p.alias || `Pedido #${p._id.slice(-6)}`}</strong><small>{p.productos.map((i) => `${i.cantidad}× ${i.nombre}`).join(" · ")}</small></span><button type="button" className="rs-receive" disabled={guardando} onClick={() => recibir(p._id)}>Confirmar recepción</button></div>)}</>}
  </section>;
}
