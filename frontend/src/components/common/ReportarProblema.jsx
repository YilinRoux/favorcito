import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../services/api";
import "../../styles/common/ReportarProblema.css";

const TEXTOS = {
  repartidor: {
    boton: "Problema con el cliente",
    titulo: "¿Qué pasó con el cliente?",
    ayuda: "La administración revisará tu reporte. Si se confirma, el cliente recibe una falta.",
    motivos: [
      ["no_pago", "No me pagó", "No entregó el dinero del pedido y del servicio."],
      ["no_recibio_pedido", "No quiso recibir el pedido", "Rechazó el pedido al llegar."],
      ["cliente_ausente", "No estaba o no respondió", "No apareció ni contestó en el chat."],
    ],
  },
  cliente: {
    boton: "Reportar problema con el repartidor",
    titulo: "¿Qué problema hubo con tu pedido?",
    ayuda: "La administración revisará tu reporte. Si se confirma, el repartidor recibe una falta.",
    motivos: [
      ["pedido_incompleto", "Pedido incompleto", "Faltaron productos."],
      ["pedido_sucio_danado", "Sucio o dañado", "Llegó derramado, sucio o en mal estado."],
      ["pedido_equivocado", "No era mi pedido", "Me entregaron algo distinto."],
      ["mal_trato", "Mal trato", "Fue grosero o irrespetuoso."],
      ["no_entrego", "No me lo entregó", "Marcó la entrega pero no recibí nada."],
    ],
  },
};

function ReportarProblema({ pedidoId, rol }) {
  const textos = TEXTOS[rol];
  const [abierto, setAbierto] = useState(false);
  const [reportado, setReportado] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    api.get(`/reportes/pedido/${pedidoId}/mio`)
      .then((res) => { if (activo) setReportado(Boolean(res.data.reportado)); })
      .catch(() => { if (activo) setReportado(false); });
    return () => { activo = false; };
  }, [pedidoId]);

  useEffect(() => {
    if (!abierto) return undefined;
    const cerrarConEsc = (e) => { if (e.key === "Escape") setAbierto(false); };
    window.addEventListener("keydown", cerrarConEsc);
    return () => window.removeEventListener("keydown", cerrarConEsc);
  }, [abierto]);

  const enviar = async () => {
    if (!motivo) { setError("Elige qué ocurrió"); return; }
    setEnviando(true);
    setError("");
    try {
      await api.post(`/reportes/pedido/${pedidoId}`, { motivo, descripcion });
      setReportado(true);
      setAbierto(false);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo enviar el reporte");
      if (err.response?.status === 409) setReportado(true);
    } finally {
      setEnviando(false);
    }
  };

  if (reportado === null) return null;

  if (reportado) {
    return <p className="rpt-enviado">Reporte enviado · en revisión</p>;
  }

  return (
    <>
      <button type="button" className="rpt-trigger" onClick={() => setAbierto(true)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
        </svg>
        {textos.boton}
      </button>

      {abierto && createPortal(
        <div className="rpt-overlay" role="presentation" onClick={() => !enviando && setAbierto(false)}>
          <div className="rpt-modal" role="dialog" aria-modal="true" aria-labelledby="rpt-titulo" onClick={(e) => e.stopPropagation()}>
            <h3 id="rpt-titulo">{textos.titulo}</h3>
            <p className="rpt-ayuda">{textos.ayuda}</p>

            <div className="rpt-opciones" role="radiogroup" aria-label="Motivo del reporte">
              {textos.motivos.map(([valor, titulo, detalle]) => (
                <label key={valor} className={`rpt-opcion${motivo === valor ? " is-activa" : ""}`}>
                  <input type="radio" name="motivo" value={valor} checked={motivo === valor} onChange={() => setMotivo(valor)} />
                  <span><strong>{titulo}</strong><small>{detalle}</small></span>
                </label>
              ))}
            </div>

            <textarea
              className="rpt-texto"
              maxLength={300}
              rows={3}
              placeholder="Cuéntanos más (opcional)"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
            {error && <p className="rpt-error" role="alert">{error}</p>}

            <div className="rpt-acciones">
              <button type="button" className="rpt-btn rpt-btn--ghost" onClick={() => setAbierto(false)} disabled={enviando}>Cancelar</button>
              <button type="button" className="rpt-btn rpt-btn--primary" onClick={enviar} disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar reporte"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default ReportarProblema;
