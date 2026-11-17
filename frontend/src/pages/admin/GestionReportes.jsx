import { AdminError, useAdminList } from "../../components/admin/AdminTools";
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/admin/GestionReportes.css";

const motivoLabels = {
  mal_servicio:               "Mal servicio",
  producto_en_mal_estado:     "Producto en mal estado",
  cancelacion_injustificada:  "Cancelación injustificada",
  comportamiento_inapropiado: "Comportamiento inapropiado",
  otro:                       "Otro",
  no_pago:                    "No pagó",
  no_recibio_pedido:          "No recibió el pedido",
  cliente_ausente:            "Cliente ausente",
  pedido_incompleto:          "Pedido incompleto",
  pedido_sucio_danado:        "Pedido sucio o dañado",
  pedido_equivocado:          "Pedido equivocado",
  mal_trato:                  "Mal trato",
  no_entrego:                 "No entregó",
};

const contextoLabels = {
  repartidor_a_cliente: "Repartidor → Cliente",
  cliente_a_repartidor: "Cliente → Repartidor",
};

const describirSancion = (sancion) => {
  if (!sancion) return "";
  const base = `Falta registrada (${sancion.faltas} en total). `;
  if (sancion.accion === "suspension") return `${base}Cuenta suspendida ${sancion.dias} días.`;
  if (sancion.accion === "baja") return `${base}Baja definitiva de la cuenta.`;
  if (sancion.accion === "sospechoso") return `${base}Cuenta marcada como sospechosa.`;
  return `${base}Se le avisará al iniciar sesión.`;
};


function GestionReportes() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [filtro, setFiltro] = useState("pendiente");

  const cargar = useCallback(async () => {
    try {
      setErrorCarga("");
      const res = await api.get("/admin/reportes");
      setReportes(res.data);
    } catch {
        setErrorCarga("Revisa tu conexión y vuelve a intentar.");
      setReportes([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const resolver = async (id, decision) => {
    if (procesando) return;
    const pregunta = decision === "procedente"
      ? "¿Confirmar el reporte? Se registrará una falta al usuario reportado."
      : "¿Marcar como improcedente? No habrá sanción y quedará en el historial de quien reportó.";
    if (!confirm(pregunta)) return;
    setProcesando(true);
    try {
      const res = await api.put(`/admin/reportes/${id}/resolver`, { decision });
      if (res.data.sancion) alert(describirSancion(res.data.sancion));
      await cargar();
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al resolver reporte");
    } finally {
      setProcesando(false);
    }
  };

  const saldar = async (id) => {
    if (procesando) return;
    if (!confirm("¿El cliente ya cubrió el adeudo? Se le permitirá pedir de nuevo.")) return;
    setProcesando(true);
    try {
      await api.put(`/admin/reportes/${id}/saldar`);
      await cargar();
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al saldar adeudo");
    } finally {
      setProcesando(false);
    }
  };

  const reportesFiltrados = reportes.filter((r) => (filtro === "pendiente" ? r.estado === "pendiente" : r.estado !== "pendiente"));
  const countPendiente = reportes.filter((r) => r.estado === "pendiente").length;
  const countResuelto  = reportes.filter((r) => r.estado !== "pendiente").length;

  const lista = useAdminList(reportesFiltrados, (reporte) => [reporte.reportante?.nombre_completo, reporte.estudianteReportado?.nombre_completo, reporte.localReportado?.nombre, motivoLabels[reporte.motivo], reporte.descripcion, reporte.pedido?.alias].join(" "), filtro);

  if (errorCarga) return <AdminError mensaje={errorCarga} />;

  if (cargando) return (
    <div className="gr-wrap">
      <div className="gr-orb-1" /><div className="gr-orb-2" />
      <div className="gr-loading">
        <div className="gr-loading-spinner" />
        <span>Cargando reportes...</span>
      </div>
    </div>
  );

  return (
    <div className="gr-wrap">
      <div className="gr-orb-1" />
      <div className="gr-orb-2" />
      <div className="gr-particles" aria-hidden="true">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="gr-p" style={{ '--dur': `${6 + i}s`, '--delay': `${i * 0.9}s`, left: `${8 + i * 13}%`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px` }} />
        ))}
      </div>

      <div className="gr-inner">

        {/* ── Header ── */}
        <div className="gr-header">
          <div className="gr-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
          </div>
          <div>
            <h2 className="gr-title">Gestión de Reportes</h2>
            <p className="gr-subtitle">
              {countPendiente} pendiente{countPendiente !== 1 ? "s" : ""} · {countResuelto} resuelto{countResuelto !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <p className="ad-help">Revisa el contexto antes de decidir. Resolver un reporte no confirma una entrega ni una devolución de comida. La lista incluye hasta los 500 reportes más recientes.</p>
        {/* ── Filtros ── */}
        <div className="gr-filtros">
          <button
            onClick={() => setFiltro("pendiente")}
            className={`gr-filtro-btn${filtro === "pendiente" ? " gr-filtro-btn--active gr-filtro-btn--pendiente" : ""}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Pendientes
            <span className="gr-filtro-count">{countPendiente}</span>
          </button>
          <button
            onClick={() => setFiltro("resuelto")}
            className={`gr-filtro-btn${filtro === "resuelto" ? " gr-filtro-btn--active gr-filtro-btn--resuelto" : ""}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Resueltos
            <span className="gr-filtro-count">{countResuelto}</span>
          </button>
        </div>

        {/* ── Empty state ── */}
        {lista.controles}
        {lista.visibles.length === 0 ? (
          <div className="gr-empty">
            <div className="gr-empty-icon">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
            </div>
            <p>{reportesFiltrados.length ? "No hay reportes que coincidan con tu búsqueda." : `No hay reportes ${filtro === "pendiente" ? "pendientes" : "resueltos"}.`}</p>
          </div>
        ) : (
          <div className="gr-lista">
            {lista.visibles.map((reporte, i) => (
              <div key={reporte._id} className={`gr-card gr-card--${reporte.estado === "pendiente" ? "pendiente" : "resuelto"}`} style={{ animationDelay: `${i * 0.07}s` }}>

                <div className="gr-card-body">
                  {/* ── Chips de tipo y motivo ── */}
                  <div className="gr-chips">
                    <span className={`gr-chip gr-chip--tipo-${reporte.tipoReportado}`}>
                      {reporte.tipoReportado === "local" ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      )}
                      {reporte.tipoReportado === "local" ? "Local" : "Estudiante"}
                    </span>
                    <span className="gr-chip gr-chip--motivo">
                      {motivoLabels[reporte.motivo] || reporte.motivo}
                    </span>
                    {contextoLabels[reporte.contexto] && (
                      <span className="gr-chip gr-chip--contexto">{contextoLabels[reporte.contexto]}</span>
                    )}
                  </div>

                  {/* ── Detalle ── */}
                  <div className="gr-detalle">
                    <p className="gr-reportante">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      {reporte.reportante?.nombre_completo}
                      <span className="gr-reportante-rol">({reporte.reportante?.rol})</span>
                    </p>

                    {reporte.tipoReportado === "local" && (
                      <p className="gr-reportado">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        </svg>
                        Local: <strong>{reporte.localReportado?.nombre}</strong>
                      </p>
                    )}

                    {reporte.tipoReportado === "estudiante" && (
                      <p className="gr-reportado">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        Estudiante: <strong>{reporte.estudianteReportado?.nombre_completo}</strong>
                        <span className="gr-faltas">
                          {" "}· {reporte.estudianteReportado?.faltas ?? 0} falta(s)
                          {reporte.estudianteReportado?.bloqueoPorPago ? " · bloqueado por pago" : ""}
                          {reporte.estudianteReportado?.activo === false ? " · cuenta suspendida" : ""}
                        </span>
                      </p>
                    )}

                    {reporte.pedido && <details className="ad-order-context"><summary>Ver pedido relacionado{reporte.pedido.alias ? ` · ${reporte.pedido.alias}` : ""}</summary>
                      <p>Estado: <strong>{{ enviado: "Enviado", aceptado: "Aceptado", en_preparacion: "En preparación", listo: "Listo", en_camino: "En camino", entregado: "Entregado", cancelado: "Cancelado" }[reporte.pedido.estado] || "No disponible"}</strong> · Total: ${reporte.pedido.total}</p>
                      {reporte.pedido.devolucion && <p>{reporte.pedido.devolucion.estado === "pendiente" ? "Devolución solicitada: falta que el local confirme la recepción." : "El local confirmó la recepción de la devolución."}</p>}
                      <ul>{reporte.pedido.productos?.map((producto, index) => <li key={index}>{producto.cantidad} × {producto.nombre}</li>)}</ul>
                    </details>}
                    {reporte.descripcion && (
                      <blockquote className="gr-descripcion">
                        "{reporte.descripcion}"
                      </blockquote>
                    )}

                    <p className="gr-fecha">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {new Date(reporte.createdAt).toLocaleDateString("es-MX", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* ── Acción ── */}
                <div className="gr-card-action">
                  {reporte.estado === "pendiente" && (
                    <div className="gr-decisiones">
                      <button disabled={procesando} aria-busy={procesando} onClick={() => resolver(reporte._id, "procedente")} className="gr-btn-resolver">
                        Procedente
                      </button>
                      <button disabled={procesando} aria-busy={procesando} onClick={() => resolver(reporte._id, "improcedente")} className="gr-btn-rechazar">
                        Improcedente
                      </button>
                    </div>
                  )}
                  {reporte.estado !== "pendiente" && (
                    <div className="gr-resuelto-badge">
                      {reporte.estado === "procedente" ? "Procedente" : reporte.estado === "improcedente" ? "Improcedente" : "Resuelto"}
                    </div>
                  )}
                  {reporte.estado === "procedente" && reporte.motivo === "no_pago" && (
                    reporte.saldado
                      ? <div className="gr-resuelto-badge">Adeudo saldado</div>
                      : <button disabled={procesando} aria-busy={procesando} onClick={() => saldar(reporte._id)} className="gr-btn-resolver">Marcar como pagado</button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

        {lista.paginacion}
      </div>
    </div>
  );
}

export default GestionReportes;