import { useEffect, useRef, useState, useContext } from "react";
import api from "../../services/api";
import { NotificationContext } from "../../context/NotificationContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import socket from "../../services/socket";
import { activarSonido, desactivarSonido, reanudarEnPrimerToque, sonar, sonidoActivado } from "../../utils/avisoPedidos";
import { agruparCocina, tiempoCocina } from "../../utils/cocina";
import hojas from "../../assets/dashboard/hojas-dashboard.png";
import "../../styles/vendedor/DashboardVendedor.css";

const estadoLabel = {
  enviado: "Nuevo",
  aceptado: "Aceptado",
  en_preparacion: "En preparación",
  listo: "Listo",
  en_camino: "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const siguienteEstado = {
  aceptado: "en_preparacion",
  en_preparacion: "listo",
  listo: "entregado",
};

const siguienteLabel = {
  aceptado: "Marcar en preparación",
  en_preparacion: "Marcar listo",
  listo: "Cliente recogió ✅",
};


const Ic = ({ children, size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const grupoEstado = (estado) =>
  estado === "enviado" ? "nuevo" : estado === "entregado" ? "ok" : estado === "cancelado" ? "cancel" : "proceso";

const hace = (fecha) => {
  const min = Math.floor((new Date() - new Date(fecha)) / 60000);
  if (!Number.isFinite(min) || min < 1) return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `Hace ${horas} h`;
  return `Hace ${Math.floor(horas / 24)} d`;
};

/* Fondo decorativo: mismas olas y hojas que el login, para que ambas pantallas combinen */
const Fondo = () => (
  <>
    <svg className="dv-waves" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
      <path className="dv-wv-soft" d="M0 130C190 40 400 40 610 118C800 188 1010 230 1200 205C1300 192 1380 170 1440 140V320H0Z" />
      <path className="dv-wv-navy" d="M330 320C470 215 640 190 820 235C960 270 1090 275 1215 245C1300 225 1370 255 1440 285V320Z" />
      <path className="dv-wv-orange" d="M820 320C1010 250 1200 215 1440 150V320H0Z" />
    </svg>
    <img className="dv-leaf dv-leaf--page" src={hojas} alt="" aria-hidden="true" />
  </>
);

/* Tarjeta de la vista de cocina: letra grande y un solo botón por pedido. */
function TarjetaCocina({ pedido, resaltado, mensajes, onAceptar, onAvanzar, ocupado }) {
  const tiempo = tiempoCocina(pedido);
  const alias = pedido.alias || `#${pedido._id.slice(-6).toUpperCase()}`;
  return (
    <article className={`dv-k-card${tiempo.clase}${resaltado ? " is-nueva" : ""}`}>
      <header className="dv-k-head">
        <strong className="dv-k-alias">{alias}</strong>
        <span className={`dv-k-tipo dv-k-tipo--${pedido.tipoEntrega}`}>{pedido.tipoEntrega === "favorcito" ? "Favorcito" : "Recoger"}</span>
        <span className="dv-k-time">{tiempo.etiqueta}: {tiempo.texto}</span>
      </header>
      {!pedido.alias && <p className="dv-k-cliente">{pedido.estudiante?.nombre_completo || "Cliente"}</p>}
      <ul className="dv-k-items">
        {pedido.productos?.map((item, i) => (
          <li key={i}><b>{item.cantidad}×</b> {item.nombre}</li>
        ))}
      </ul>
      {pedido.notas && <p className="dv-k-notas"><strong>Notas:</strong> {pedido.notas}</p>}
      {pedido.atendidoPor && <p className="dv-k-atiende">Prepara: {pedido.atendidoPor}</p>}
      <div className="dv-k-acciones">
        {pedido.estado === "enviado" && (
          <button type="button" className="dv-k-btn" disabled={ocupado} onClick={() => onAceptar(pedido._id)}>Aceptar y preparar</button>
        )}
        {["aceptado", "en_preparacion"].includes(pedido.estado) && (
          <button type="button" className="dv-k-btn" disabled={ocupado} onClick={() => onAvanzar(pedido._id, pedido.estado)}>
            {pedido.estado === "aceptado" ? "Marcar en preparación" : "Marcar listo"}
          </button>
        )}
        {pedido.estado === "listo" && pedido.tipoEntrega === "recoger" && (
          <button type="button" className="dv-k-btn" disabled={ocupado} onClick={() => onAvanzar(pedido._id, "listo")}>Cliente recogió</button>
        )}
        {pedido.estado === "listo" && pedido.tipoEntrega === "favorcito" && <p className="dv-k-nota">Esperando repartidor…</p>}
        {pedido.estado === "en_camino" && <p className="dv-k-nota">En camino con el repartidor</p>}
        <Link to={`/chat/${pedido._id}`} className="dv-k-chat" aria-label={`Chat del pedido ${alias}`}>
          <Ic size={18}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Ic>
          {mensajes > 0 && <span className="dv-chat-badge">{mensajes}</span>}
        </Link>
      </div>
    </article>
  );
}

function DashboardVendedor() {
  const [pedidos, setPedidos] = useState([]);
  const [local, setLocal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tabElegida, setTab] = useState(null);
  const [pagina, setPagina] = useState(1);
  const pedidosPorPagina = 5;
  const [mostrarMensajes, setMostrarMensajes] = useState(false);
  const [tema, setTema] = useState(() => localStorage.getItem("favorcito-tema") || "claro");
  const [sonido, setSonido] = useState(sonidoActivado);
  const [resaltados, setResaltados] = useState([]);
  const [modoCocina, setModoCocina] = useState(() => localStorage.getItem("favorcito-cocina") === "1");
  const [colElegida, setColCocina] = useState(null);
  const [ayudaCocina, setAyudaCocina] = useState(() => localStorage.getItem("favorcito-ayuda-cocina") !== "oculta");
  const [ocupados, setOcupados] = useState([]);
  const bloqueosCocina = useRef(new Set());
  const [atiende, setAtiende] = useState(() => localStorage.getItem("favorcito-atiende") || "");
  const [aviso, setAviso] = useState("");
  // Equipos modestos (pocos núcleos o poca memoria): se quitan decoraciones y sombras.
  const [ligero] = useState(() => (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4);
  const conocidos = useRef(null);
  const { notificaciones, total } = useContext(NotificationContext);
  const navigate = useNavigate();
  const location = useLocation();

  const cambiarTema = () => {
    const siguiente = tema === "claro" ? "oscuro" : "claro";
    setTema(siguiente);
    localStorage.setItem("favorcito-tema", siguiente);
    window.dispatchEvent(new Event("favorcito-theme-change"));
  };

  const alternarCocina = () => {
    const siguiente = !modoCocina;
    setModoCocina(siguiente);
    localStorage.setItem("favorcito-cocina", siguiente ? "1" : "0");
  };

  // El local comparte una sola cuenta: cada persona indica su nombre para saber quién prepara qué.
  const cambiarAtiende = () => {
    const nombre = window.prompt("¿Quién atiende? Tu nombre aparecerá en los pedidos que aceptes.", atiende);
    if (nombre === null) return;
    const limpio = nombre.trim().slice(0, 20);
    setAtiende(limpio);
    localStorage.setItem("favorcito-atiende", limpio);
  };

  const avisarConflicto = () => {
    setAviso("Otra persona ya movió ese pedido. Se actualizó la lista.");
    cargar();
    setTimeout(() => setAviso(""), 4000);
  };

  const alternarSonido = async () => {
    if (sonido) {
      desactivarSonido();
      setSonido(false);
    } else if (await activarSonido()) {
      setSonido(true);
    }
  };

  // Compara con la carga anterior: lo que aparece por primera vez como "enviado" es un pedido nuevo.
  const detectarNuevos = (lista) => {
    const ids = lista.filter((p) => p.estado === "enviado").map((p) => p._id);
    if (conocidos.current) {
      const recientes = ids.filter((id) => !conocidos.current.has(id));
      if (recientes.length) {
        setResaltados(recientes);
        if (sonidoActivado()) sonar();
        setTimeout(() => setResaltados([]), 10000);
      }
    }
    conocidos.current = new Set(ids);
  };

  const cargar = async () => {
    try {
      const localRes = await api.get("/locales/mi-local");
      setLocal(localRes.data);
      if (!localRes.data.aprobado) { navigate("/vendedor/estado"); return; }
      const pedidosRes = await api.get("/pedidos/vendedor");
      detectarNuevos(pedidosRes.data);
      setPedidos(pedidosRes.data);
    } catch {
      navigate("/vendedor/solicitar");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    const alCambiar = () => cargar();
    socket.on("estadoActualizado", alCambiar);
    socket.on("nuevoPedido", alCambiar);
    const interval = setInterval(cargar, 15000);
    const quitarReanudar = reanudarEnPrimerToque();
    return () => {
      socket.off("estadoActualizado", alCambiar);
      socket.off("nuevoPedido", alCambiar);
      clearInterval(interval);
      quitarReanudar();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Mantiene la pantalla encendida mientras el panel está abierto (útil en celular).
  useEffect(() => {
    let candado = null;
    const pedir = async () => {
      try {
        if (document.visibilityState === "visible" && "wakeLock" in navigator) {
          candado = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Sin soporte o con ahorro de batería: no pasa nada.
      }
    };
    pedir();
    document.addEventListener("visibilitychange", pedir);
    return () => {
      document.removeEventListener("visibilitychange", pedir);
      candado?.release?.().catch(() => {});
    };
  }, []);

  const aceptarPedido = async (pedidoId) => {
    try {
      const res = await api.put(`/pedidos/${pedidoId}/aceptar`, { tiempoEstimado: 20, atiende });
      setPedidos((prev) => prev.map((p) => (p._id === pedidoId ? res.data.pedido : p)));
    } catch (error) {
      if ([400, 409].includes(error.response?.status)) { avisarConflicto(); return; }
      alert("Error al aceptar pedido");
    }
  };

  const avanzarEstado = async (pedidoId, estadoActual) => {
    const nuevoEstado = siguienteEstado[estadoActual];
    if (!nuevoEstado) return;
    try {
      const res = await api.put(`/pedidos/${pedidoId}/estado`, { nuevoEstado });
      setPedidos((prev) => prev.map((p) => (p._id === pedidoId ? res.data.pedido : p)));
    } catch (error) {
      if (error.response?.status === 409) { avisarConflicto(); return; }
      alert("Error al cambiar estado");
    }
  };

  const cancelarPorVendedor = async (pedidoId) => {
    if (!window.confirm("¿Cancelar este pedido? Esta acción no penalizará al estudiante.")) return;
    try {
      const res = await api.put(`/pedidos/${pedidoId}/cancelar-vendedor`);
      setPedidos((prev) => prev.map((p) => p._id === pedidoId ? res.data.pedido : p));
    } catch (error) {
      const mensaje = error.response?.data?.mensaje || "Error al cancelar pedido";
      window.alert(mensaje);
      console.error("Error al cancelar pedido:", error);
    }
  };

  const reportarEstudiante = async (estudianteId) => {
    if (!confirm("¿Reportar a este estudiante por cancelación injustificada?")) return;
    try {
      await api.post("/reportes", {
        tipoReportado: "estudiante",
        estudianteReportado: estudianteId,
        motivo: "cancelacion_injustificada",
      });
      alert("Reporte enviado al administrador");
    } catch { alert("Error al reportar"); }
  };

  const pedidosNuevos = pedidos.filter((p) => p.estado === "enviado");
  const pedidosEnProceso = pedidos.filter((p) => ["aceptado", "en_preparacion", "listo", "en_camino"].includes(p.estado));
  const pedidosCompletados = pedidos.filter((p) => ["entregado", "cancelado"].includes(p.estado));

  // Prioriza trabajo pendiente hasta que el vendedor elija una pestaña.
  const tab = tabElegida ?? (pedidosNuevos.length ? "nuevos" : pedidosEnProceso.length ? "proceso" : "nuevos");

  const pedidosActivos =
    tab === "nuevos" ? pedidosNuevos :
    tab === "proceso" ? pedidosEnProceso :
    pedidosCompletados;

  const totalPaginas = Math.max(1, Math.ceil(pedidosActivos.length / pedidosPorPagina));
  const inicioPagina = (pagina - 1) * pedidosPorPagina;
  const pedidosPaginados = pedidosActivos.slice(inicioPagina, inicioPagina + pedidosPorPagina);

  const cambiarTab = (nuevoTab) => {
    setTab(nuevoTab);
    setPagina(1);
  };

  const irPagina = (nuevaPagina) => {
    setTab(tab);
    setPagina(Math.min(Math.max(nuevaPagina, 1), totalPaginas));
  };


  useEffect(() => {
    if (cargando || location.hash !== "#pedidos") return;
    document.getElementById("pedidos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [cargando, location.hash, location.key]);

  const hoy = new Date().toDateString();
  const pedidosHoy = pedidos.filter((p) => new Date(p.createdAt).toDateString() === hoy);
  const ventasHoy = pedidosHoy.filter((p) => p.estado === "entregado").reduce((acc, p) => acc + p.total, 0);
  const columnasCocina = agruparCocina(pedidos);
  const colCocina = columnasCocina.some(([clave, , lista]) => clave === colElegida && lista.length)
    ? colElegida : columnasCocina.find(([, , lista]) => lista.length)?.[0] || colElegida || "nuevos";
  const pedidosEnCamino = pedidos.filter((p) => p.estado === "en_camino");

  const alternarAyuda = () => {
    setAyudaCocina(!ayudaCocina);
    localStorage.setItem("favorcito-ayuda-cocina", ayudaCocina ? "oculta" : "visible");
  };
  const accionCocina = async (id, accion) => {
    if (bloqueosCocina.current.has(id)) return;
    bloqueosCocina.current.add(id);
    setOcupados([...bloqueosCocina.current]);
    try { await accion(); }
    finally {
      bloqueosCocina.current.delete(id);
      setOcupados([...bloqueosCocina.current]);
    }
  };

  useEffect(() => {
    const original = document.title;
    document.title = pedidosNuevos.length > 0 ? `(${pedidosNuevos.length}) ${original}` : original;
    return () => { document.title = original; };
  }, [pedidosNuevos.length]);

  const hayPromo = Boolean(local?.promocionActiva && local?.imagenesAnuncios?.length > 0);


  if (cargando) return (
    <div className={`dv-wrap dv-theme-${tema}${ligero ? " dv-ligero" : ""}`}>
      <Fondo />
      <p className="dv-loading">Cargando...</p>
    </div>
  );

  const CardPedido = ({ pedido }) => (
    <article className={`dv-card-pedido is-${grupoEstado(pedido.estado)}${resaltados.includes(pedido._id) ? " is-nueva" : ""}`}>
      {pedido.estudiante?.sospechoso && (
        <div className="dv-alerta-sospechoso">
          <Ic size={15}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" /></Ic>
          Usuario con cancelaciones frecuentes ({pedido.estudiante.cancelaciones} cancelaciones)
        </div>
      )}

      <div className="dv-pedido-header">
        <span className="dv-pedido-icon"><Ic size={18}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" /></Ic></span>
        <div className="dv-pedido-main">
          <p className="dv-pedido-id">{pedido.alias ? <strong className="dv-alias">{pedido.alias}</strong> : <>Pedido #{pedido._id.slice(-6).toUpperCase()}</>} <span className="dv-pedido-time">{hace(pedido.createdAt)}</span></p>
          <p className="dv-pedido-cliente">Cliente: {pedido.estudiante?.nombre_completo || "Desconocido"}</p>
          {pedido.estudiante?.cancelaciones > 0 && !pedido.estudiante?.sospechoso && (
            <p className="dv-pedido-warning">{pedido.estudiante.cancelaciones} cancelación(es) previa(s)</p>
          )}
          <p className="dv-pedido-tipo">
            {pedido.tipoEntrega === "favorcito" ? (
              <><Ic size={13}><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3m-4 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm1-10H9a2 2 0 0 0-2 2v6h12v-6a2 2 0 0 0-2-2z" /></Ic>Favorcito</>
            ) : (
              <><Ic size={13}><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></Ic>Recoger en local</>
            )}
          </p>
          {pedido.notas && <p className="dv-pedido-notas">⚠ {pedido.notas}</p>}
          {pedido.atendidoPor && <p className="dv-pedido-atiende">Prepara: {pedido.atendidoPor}</p>}
        </div>
        <div className="dv-pedido-right">
          <span className={`dv-pill dv-pill--${grupoEstado(pedido.estado)}`}>{estadoLabel[pedido.estado]}</span>
          <p className="dv-pedido-total">${pedido.total}</p>
          {pedido.promocionAplicada && (
            <p className="dv-pedido-promo">Envío gratis</p>
          )}
        </div>
      </div>

      <div className="dv-pedido-productos">
        {pedido.productos?.map((item, i) => (
          <div key={i} className="dv-producto-row">
            <span>{item.cantidad}x {item.nombre}</span>
            <span>${item.precio * item.cantidad}</span>
          </div>
        ))}
      </div>

      <div className="dv-pedido-actions">
        <Link to={`/chat/${pedido._id}`} className="dv-btn dv-btn-chat">
          <Ic size={14}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Ic>
          Chat
          {notificaciones[pedido._id] > 0 && (
            <span className="dv-chat-badge">{notificaciones[pedido._id]}</span>
          )}
        </Link>

        {pedido.estado === "enviado" && (
          <button onClick={() => aceptarPedido(pedido._id)} className="dv-btn dv-btn-aceptar">
            <Ic size={14}><path d="m5 12 5 5 9-10" /></Ic>
            Aceptar y preparar
          </button>
        )}

        {["aceptado", "en_preparacion"].includes(pedido.estado) && (
          <button type="button" onClick={() => cancelarPorVendedor(pedido._id)} className="dv-btn dv-btn-cancelar">
            <Ic size={14}><path d="M18 6 6 18M6 6l12 12" /></Ic>
            Cancelar pedido
          </button>
        )}

        {pedido.estado !== "listo" && siguienteEstado[pedido.estado] && pedido.estado !== "enviado" && (
          <button onClick={() => avanzarEstado(pedido._id, pedido.estado)} className="dv-btn dv-btn-avanzar">
            <Ic size={14}><path d="M5 12h14M12 5l7 7-7 7" /></Ic>
            {siguienteLabel[pedido.estado]}
          </button>
        )}

        {pedido.estado === "listo" && pedido.tipoEntrega === "recoger" && (
          <button onClick={() => avanzarEstado(pedido._id, pedido.estado)} className="dv-btn dv-btn-aceptar">
            <Ic size={14}><path d="m5 12 5 5 9-10" /></Ic>
            Cliente recogió
          </button>
        )}

        {pedido.estado === "listo" && pedido.tipoEntrega === "favorcito" && (
          <p className="dv-status-note">Esperando repartidor...</p>
        )}

        {pedido.estado === "en_camino" && (
          <p className="dv-status-note">En camino al cliente</p>
        )}

        {pedido.estado === "cancelado" && pedido.estudiante?._id && (
          <button onClick={() => reportarEstudiante(pedido.estudiante._id)} className="dv-btn dv-btn-cancelar">
            <Ic size={14}><path d="M3 3l18 18M10.58 10.59a2 2 0 0 0 2.83 2.83M9.36 5.37A9.47 9.47 0 0 1 12 5c4.48 0 8.27 2.94 9.54 7a10 10 0 0 1-4.13 5.41" /></Ic>
            Reportar estudiante
          </button>
        )}
      </div>
    </article>
  );

  return (
    <div className={`dv-wrap dv-theme-${tema}${ligero ? " dv-ligero" : ""}`}>
      <Fondo />

      <div className="dv-container">
        <header className="dv-top">
          <div className="dv-heading">
            <span className="dv-eyebrow">Panel del vendedor</span>
            <h1>{modoCocina ? "Vista de cocina" : <>Pedidos de <strong>tu local</strong></>}</h1>
            <p>{modoCocina ? local?.nombre : "Acepta los nuevos pedidos y da seguimiento a los que estás preparando."}</p>
          </div>

          <div className="dv-top-actions">
            <button type="button" className={`dv-modo${modoCocina ? " is-on" : ""}`} onClick={alternarCocina} aria-pressed={modoCocina}>
              <Ic size={18}><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 9.18 0A4 4 0 0 1 18 13.87V21H6zM6 17h12" /></Ic>
              {modoCocina ? "Volver al panel" : "Vista de cocina"}
            </button>

            <button
              type="button"
              className={`dv-bell dv-sound${sonido ? " is-on" : ""}`}
              onClick={alternarSonido}
              aria-pressed={sonido}
              aria-label={sonido ? "Desactivar sonido de pedidos nuevos" : "Activar sonido de pedidos nuevos"}
              title={sonido ? "Sonido de pedidos: activado" : "Activar sonido de pedidos"}
            >
              {sonido ? (
                <Ic size={20}><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></Ic>
              ) : (
                <Ic size={20}><path d="M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6" /></Ic>
              )}
              <span className="dv-sound-label">Sonido {sonido ? "activo" : "apagado"}</span>
            </button>

            <button
              type="button"
              className="dv-bell"
              aria-label={total > 0 ? `${total} mensajes sin leer` : "Sin mensajes nuevos"}
              title={total > 0 ? `${total} mensajes sin leer` : "Sin mensajes nuevos"}
              aria-expanded={mostrarMensajes}
              onClick={() => total > 0 && setMostrarMensajes(!mostrarMensajes)}
            >
              <Ic size={20}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></Ic>
              {total > 0 && <i className="dv-bell-dot" />}
            </button>


            <button
              type="button"
              className={`dv-toggle is-${tema}`}
              onClick={cambiarTema}
              aria-label={tema === "claro" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
              title={tema === "claro" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
              aria-pressed={tema === "oscuro"}
            >
              <span className="dv-toggle-opt dv-toggle-sun"><Ic size={16}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41" /></Ic></span>
              <span className="dv-toggle-opt dv-toggle-moon"><Ic size={16}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" /></Ic></span>
            </button>
          </div>
        </header>

        {aviso && <p className="dv-aviso" role="status">{aviso}</p>}

        {modoCocina ? (
          <section className="dv-cocina" id="pedidos">
            <div className="dv-cocina-bar">
              <button type="button" className="dv-atiende" onClick={cambiarAtiende}>
                Quién prepara: <strong>{atiende || "indica tu nombre"}</strong>
              </button>
              <button type="button" className="dv-help-toggle" aria-expanded={ayudaCocina} aria-controls="guia-cocina" onClick={alternarAyuda}>{ayudaCocina ? "Ocultar ayuda" : "Cómo funciona"}</button>
            </div>
            {ayudaCocina && (
              <aside className="dv-k-help" id="guia-cocina" aria-label="Cómo usar la vista de cocina">
                <h2>Del pedido a la entrega</h2>
                <ol>
                  <li><strong>1. Acepta</strong><span>Revisa productos y notas. Pulsa «Aceptar y preparar».</span></li>
                  <li><strong>2. Prepara</strong><span>Al terminar, pulsa «Marcar listo».</span></li>
                  <li><strong>3. Entrega</strong><span>En el local, confirma «Cliente recogió». En Favorcito, espera al repartidor.</span></li>
                </ol>
                <p>Indica quién prepara antes de aceptar: su nombre quedará en el pedido. Amarillo: 10 min; rojo: 20 min en espera o preparación. Sin historial, se muestra el tiempo desde el pedido.</p>
              </aside>
            )}
            <div className="dv-cocina-tabs" aria-label="Secciones de cocina">
              {columnasCocina.map(([clave, titulo, lista], i) => (
                <button key={clave} type="button" aria-pressed={colCocina === clave} className={`dv-tab${colCocina === clave ? " is-active" : ""}`} onClick={() => setColCocina(clave)}>
                  <span>{i + 1}. {titulo}</span><span className="dv-tab-badge">{lista.length}</span>
                </button>
              ))}
            </div>
            <div className="dv-cocina-cols">
              {columnasCocina.map(([clave, titulo, lista]) => (
                <div key={clave} className={`dv-col dv-col--${clave}${colCocina === clave ? " is-visible" : ""}`}>
                  <h2 className="dv-col-titulo">{titulo}<span>{lista.length}</span></h2>
                  {lista.length === 0 ? (
                    <p className="dv-col-vacia">Sin pedidos</p>
                  ) : (
                    [...lista].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((p) => (
                      <TarjetaCocina key={p._id} pedido={p} resaltado={resaltados.includes(p._id)} mensajes={notificaciones[p._id] || 0} ocupado={ocupados.includes(p._id)} onAceptar={(id) => accionCocina(id, () => aceptarPedido(id))} onAvanzar={(id, estado) => accionCocina(id, () => avanzarEstado(id, estado))} />
                    ))
                  )}
                </div>
              ))}
            </div>
            {pedidosEnCamino.length > 0 && (
              <details className="dv-k-transit">
                <summary>En camino con repartidor · {pedidosEnCamino.length}</summary>
                <p>Estos pedidos ya salieron del local.</p>
                <div className="dv-k-transit-list">{pedidosEnCamino.map((p) => <TarjetaCocina key={p._id} pedido={p} mensajes={notificaciones[p._id] || 0} />)}</div>
              </details>
            )}
          </section>
        ) : (
        <>
        {local && (
          <section className="dv-local-strip" aria-label="Tu local">
            <span className="dv-local-icon" aria-hidden="true">
              <Ic size={24}><path d="M3 9l1.5-5h15L21 9M4 9v11h16V9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /></Ic>
            </span>
            <div className="dv-local-info">
              <div className="dv-local-header">
                <h2 className="dv-local-nombre">{local.nombre}</h2>
                <span className="dv-local-badge"><Ic size={13}><path d="m5 12 5 5 9-10" /></Ic>Aprobado</span>
              </div>
              <p className="dv-local-status">{hayPromo ? "Promoción con anuncio activo" : local.promocionActiva ? "Promoción activa" : "Sin promoción activa"}</p>
            </div>
            <Link to="/vendedor/estado" className="dv-local-details">Ver estado del local <span aria-hidden="true">→</span></Link>
          </section>
        )}

        {total > 0 && (
          <section className="dv-message-notice">
            <div className="dv-message-notice-header">
              <span className="dv-message-notice-icon"><Ic size={18}><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6" /></Ic></span>
              <div className="dv-message-notice-content">
                <p className="dv-message-notice-title">{total} mensajes sin leer</p>
                <p className="dv-message-notice-subtitle">Conversaciones de tus pedidos</p>
              </div>
              <button type="button" className="dv-message-notice-toggle" aria-expanded={mostrarMensajes} onClick={() => setMostrarMensajes(!mostrarMensajes)}>
                {mostrarMensajes ? "Ocultar" : "Ver mensajes"}
              </button>
            </div>
            {mostrarMensajes && (
              <div className="dv-message-list">
                {pedidos.filter(p => notificaciones[p._id] > 0).map(p => (
                  <Link key={p._id} className="dv-message-list-item" to={`/chat/${p._id}`}>
                    <span className="dv-message-list-info">
                      <strong>{p.alias || `Pedido #${p._id.slice(-6).toUpperCase()}`}</strong>
                      <small>{p.estudiante?.nombre_completo || "Cliente"}</small>
                    </span>
                    <span className="dv-message-list-count">{notificaciones[p._id]} sin leer</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="dv-stats-grid">
          <div className="dv-stat-card">
            <span className="dv-stat-icon"><Ic size={26}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" /></Ic></span>
            <div>
              <p className="dv-stat-label">Creados hoy</p>
              <p className="dv-stat-value">{pedidosHoy.length}</p>
              <p className="dv-stat-hint">Todos los estados</p>
            </div>
            <img className="dv-leaf dv-leaf--stat" src={hojas} alt="" aria-hidden="true" />
          </div>
          <div className="dv-stat-card dv-stat-card--proceso">
            <span className="dv-stat-icon"><Ic size={26}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Ic></span>
            <div>
              <p className="dv-stat-label">En proceso · todos</p>
              <p className="dv-stat-value">{pedidosEnProceso.length}</p>
              <p className="dv-stat-hint">Incluye días anteriores</p>
            </div>
            <img className="dv-leaf dv-leaf--stat" src={hojas} alt="" aria-hidden="true" />
          </div>
          <div className="dv-stat-card dv-stat-card--ventas">
            <span className="dv-stat-icon"><Ic size={26}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></Ic></span>
            <div>
              <p className="dv-stat-label">Ventas hoy</p>
              <p className="dv-stat-value">${ventasHoy}</p>
              <p className="dv-stat-hint">Pedidos de hoy entregados</p>
            </div>
            <img className="dv-leaf dv-leaf--stat" src={hojas} alt="" aria-hidden="true" />
          </div>
        </div>

        <section className="dv-orders-layout" id="pedidos">
          <div className="dv-orders-panel">
            <div className="dv-panel-heading">
              <span className="dv-heading-icon"><Ic size={20}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></Ic></span>
              <h2>Actividad de pedidos</h2>
            </div>

            <div className="dv-tabs" role="tablist">
              <button role="tab" aria-selected={tab === "nuevos"} onClick={() => cambiarTab("nuevos")} className={`dv-tab dv-tab--nuevos ${tab === "nuevos" ? "is-active" : ""}`}>
                <Ic size={15}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" /></Ic>
                Nuevos
                {pedidosNuevos.length > 0 && <span className="dv-tab-badge">{pedidosNuevos.length}</span>}
              </button>
              <button role="tab" aria-selected={tab === "proceso"} onClick={() => cambiarTab("proceso")} className={`dv-tab dv-tab--proceso ${tab === "proceso" ? "is-active" : ""}`}>
                <Ic size={15}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Ic>
                En proceso
                {pedidosEnProceso.length > 0 && <span className="dv-tab-badge">{pedidosEnProceso.length}</span>}
              </button>
              <button role="tab" aria-selected={tab === "completados"} onClick={() => cambiarTab("completados")} className={`dv-tab dv-tab--completados ${tab === "completados" ? "is-active" : ""}`}>
                <Ic size={15}><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></Ic>
                Historial
                {pedidosCompletados.length > 0 && <span className="dv-tab-badge">{pedidosCompletados.length}</span>}
              </button>
            </div>

            <p className="dv-orders-scope">{tab === "completados" ? "Entregados y cancelados · pedidos creados en los últimos 14 días." : "Pedidos pendientes de todos los días, hasta que se cierren."}</p>
            <div className="dv-tab-content">
              {pedidosActivos.length === 0 ? (
                <p className="dv-empty-msg">
                  {tab === "nuevos" ? "Sin pedidos nuevos." : tab === "proceso" ? "Sin pedidos en proceso." : "Sin pedidos entregados ni cancelados en los últimos 14 días."}
                </p>
              ) : (
                <>
                  {pedidosPaginados.map((p) => <CardPedido key={p._id} pedido={p} />)}

                  {totalPaginas > 1 && (
                    <nav className="dv-pagination" aria-label="Paginación de pedidos">
                      <button type="button" className="dv-page-arrow" onClick={() => irPagina(pagina - 1)} disabled={pagina === 1} aria-label="Página anterior">‹</button>

                      <div className="dv-page-numbers">
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((numero) => (
                          <button
                            type="button"
                            key={numero}
                            className={`dv-page-number ${pagina === numero ? "is-active" : ""}`}
                            onClick={() => irPagina(numero)}
                            aria-current={pagina === numero ? "page" : undefined}
                          >
                            {numero}
                          </button>
                        ))}
                      </div>

                      <button type="button" className="dv-page-arrow" onClick={() => irPagina(pagina + 1)} disabled={pagina === totalPaginas} aria-label="Página siguiente">›</button>

                      <span className="dv-page-summary">
                        {inicioPagina + 1}–{Math.min(inicioPagina + pedidosPorPagina, pedidosActivos.length)} de {pedidosActivos.length}
                      </span>
                    </nav>
                  )}
                </>
              )}
            </div>
          </div>


        </section>
        </>
        )}
      </div>
    </div>
  );
}

export default DashboardVendedor;
