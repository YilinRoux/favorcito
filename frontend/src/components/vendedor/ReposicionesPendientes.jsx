import { useEffect, useState } from "react";
import api from "../../services/api";
import socket from "../../services/socket";
import "../../styles/vendedor/ReposicionesPendientes.css";

export default function ReposicionesPendientes({ onResuelta }) {
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState("");
  const [cantidades, setCantidades] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [pagina, setPagina] = useState(1);
  const paginas = Math.max(1, Math.ceil(pedidos.length / 5));
  const actual = Math.min(pagina, paginas);
  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        const res = await api.get("/pedidos/reposiciones-pendientes");
        if (activo) { setPedidos(res.data); setError(""); }
      } catch { if (activo) setError("No se pudo consultar el inventario pendiente de revisión."); }
    };
    cargar();
    socket.on("estadoActualizado", cargar);
    window.addEventListener("favorcito-revisar-stock", cargar);
    const timer = setInterval(cargar, 30000);
    return () => { activo = false; clearInterval(timer); socket.off("estadoActualizado", cargar); window.removeEventListener("favorcito-revisar-stock", cargar); };
  }, []);

  const guardar = async (e, pedido) => {
    e.preventDefault();
    if (guardando) return;
    const valores = pedido.productos.map((_, i) => Number(cantidades[pedido._id]?.[i] ?? 0));
    const total = valores.reduce((a, n) => a + n, 0);
    if (!window.confirm(`Se devolverán ${total} unidad(es) al stock. Las demás no se repondrán. ¿Guardar esta decisión?`)) return;
    setGuardando(true); setError(""); setMensaje("");
    try {
      await api.put(`/pedidos/${pedido._id}/reposicion`, { cantidades: valores });
      setPedidos((prev) => prev.filter((p) => p._id !== pedido._id));
      setMensaje(`Decisión guardada: ${total} unidad(es) repuestas. Los productos desactivados conservan su estado.`);
      // Actualizar el catálogo sin tocar lo escrito en su formulario.
      if (onResuelta) {
        try { await onResuelta(); }
        catch { setError("La reposición se guardó, pero debes actualizar la página para ver el stock actual."); }
      }
    } catch (err) { setError(err.response?.data?.mensaje || "No se pudo guardar la decisión. Intenta nuevamente."); }
    finally { setGuardando(false); }
  };

  if (!pedidos.length && !error && !mensaje) return null;
  return (
    <section className="rs-wrap" aria-label="Revisión de inventario por cancelaciones">
      {mensaje && <p className="rs-success" role="status">{mensaje}</p>}
      {error && <p className="rs-error" role="alert">{error}</p>}
      {pedidos.length > 0 && <details className="rs-pending">
        <summary>Cancelaciones · {pedidos.length} por revisar <span>Revisar inventario</span></summary>
        <p className="rs-help">El stock aún no se ha devuelto. Revisa qué productos puedes volver a vender; las unidades no recuperables se quedan fuera del inventario.</p>
        {pedidos.slice((actual - 1) * 5, actual * 5).map((pedido) => (
          <form key={pedido._id} onSubmit={(e) => guardar(e, pedido)} className="rs-order">
            <h3>{pedido.alias || `Pedido #${pedido._id.slice(-6).toUpperCase()}`}</h3>
            <p>Cancelado por {pedido.canceladoPor === "estudiante" ? "el estudiante" : "el vendedor"}. ¿Cuántas unidades puedes reponer?</p>
            <fieldset disabled={guardando}>
              <legend className="rs-legend">Unidades que volverán al stock</legend>
              {pedido.productos.map((item, i) => <label key={i} className="rs-item">
                <span><strong>{item.nombre}</strong><small>{item.cantidad} unidad(es) canceladas</small></span>
                <input aria-label={`Reponer ${item.nombre}`} type="number" min="0" max={item.cantidad} step="1" required value={cantidades[pedido._id]?.[i] ?? 0} onChange={(e) => setCantidades((prev) => ({ ...prev, [pedido._id]: { ...prev[pedido._id], [i]: e.target.value } }))} />
              </label>)}
              <div className="rs-actions">
                <button type="button" className="rs-all" onClick={() => setCantidades((prev) => ({ ...prev, [pedido._id]: Object.fromEntries(pedido.productos.map((p, i) => [i, p.cantidad])) }))}>Reponer todas</button>
                <button type="button" className="rs-all" onClick={() => setCantidades((prev) => ({ ...prev, [pedido._id]: {} }))}>No reponer ninguna</button>
                <button type="submit" className="rs-save">{guardando ? "Guardando…" : "Guardar decisión"}</button>
              </div>
            </fieldset>
            <p className="rs-help">0 significa que no se repone. La decisión se guarda una sola vez.</p>
          </form>
        ))}
        {paginas > 1 && <nav className="rs-pagination" aria-label="Paginación de cancelaciones"><button type="button" disabled={actual === 1 || guardando} onClick={() => setPagina(actual - 1)}>Anterior</button><span>{actual} de {paginas}</span><button type="button" disabled={actual === paginas || guardando} onClick={() => setPagina(actual + 1)}>Siguiente</button></nav>}
      </details>}
    </section>
  );
}
