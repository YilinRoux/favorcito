import { useEffect, useRef, useState, useContext } from "react";
import api from "../../services/api";
import { NotificationContext } from "../../context/NotificationContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import socket from "../../services/socket";
import { activarSonido, desactivarSonido, reanudarEnPrimerToque, sonar, sonidoActivado } from "../../utils/avisoPedidos";
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

const HORAS_COCINA = 12;

const minutosDesde = (fecha) => Math.max(0, Math.floor((new Date() - new Date(fecha)) / 60000));
const urgenciaPedido = (pedido) => {
  if (!["enviado", "aceptado", "en_preparacion"].includes(pedido.estado)) return "";
  const minutos = minutosDesde(pedido.createdAt);
  return minutos >= 20 ? " is-rojo" : minutos >= 10 ? " is-ambar" : "";
};

/* Tarjeta de la vista de cocina: letra grande y un solo botón por pedido. */
function TarjetaCocina({ pedido, resaltado, mensajes, onAceptar, onAvanzar }) {
  const alias = pedido.alias || `#${pedido._id.slice(-6).toUpperCase()}`;
  return (
    <article className={`dv-k-card${urgenciaPedido(pedido)}${resaltado ? " is-nueva" : ""}`}>
      <header className="dv-k-head">
        <strong className="dv-k-alias">{alias}</strong>
        <span className={`dv-k-tipo dv-k-tipo--${pedido.tipoEntrega}`}>{pedido.tipoEntrega === "favorcito" ? "Favorcito" : "Recoger"}</span>
        <span className="dv-k-time">{hace(pedido.createdAt)}</span>
      </header>
      {!pedido.alias && <p className="dv-k-cliente">{pedido.estudiante?.nombre_completo || "Cliente"}</p>}
      <ul className="dv-k-items">
        {pedido.productos?.map((item, i) => (
          <li key={i}><b>{item.cantidad}×</b> {item.nombre}</li>
        ))}
      </ul>
      {pedido.notas && <p className="dv-k-notas">⚠ {pedido.notas}</p>}
      {pedido.atendidoPor && <p className="dv-k-atiende">Prepara: {pedido.atendidoPor}</p>}
      <div className="dv-k-acciones">
        {pedido.estado === "enviado" && (
          <button type="button" className="dv-k-btn" onClick={() => onAceptar(pedido._id)}>Aceptar y preparar</button>
        )}
        {["aceptado", "en_preparacion"].includes(pedido.estado) && (
          <button type="button" className="dv-k-btn" onClick={() => onAvanzar(pedido._id, pedido.estado)}>
            {pedido.estado === "aceptado" ? "Marcar en preparación" : "Listo"}
          </button>
        )}
        {pedido.estado === "listo" && pedido.tipoEntrega === "recoger" && (
          <button type="button" className="dv-k-btn" onClick={() => onAvanzar(pedido._id, "listo")}>Entregado</button>
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

// Cada sección conserva su propia página; se ajusta si un pedido cambia de estado.
function ListaPedidos({ titulo, pedidos, clase = "", descripcion, vacio, renderPedido, recientes = false }) {
  const [pagina, setPagina] = useState(1);
  const porPagina = 5;
  const paginas = Math.max(1, Math.ceil(pedidos.length / porPagina));
  const actual = Math.min(pagina, paginas);
  const ordenados = [...pedidos].sort((a, b) => recientes ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt));
  const inicio = (actual - 1) * porPagina;
  return (
    <section className={`dv-order-section ${clase}`} aria-label={titulo}>
      <header className="dv-section-head">
        <h2>{titulo} <span>{pedidos.length}</span></h2>
        {descripcion && <p>{descripcion}</p>}
      </header>
      {pedidos.length ? <div className="dv-order-list">{ordenados.slice(inicio, inicio + porPagina).map(renderPedido)}</div> : <p className="dv-section-empty">{vacio}</p>}
      {paginas > 1 && (
        <nav className="dv-pagination" aria-label={`Paginación: ${titulo}`}>
          <button type="button" className="dv-page-arrow" disabled={actual === 1} onClick={() => setPagina(actual - 1)} aria-label={`Página anterior: ${titulo}`}>‹</button>
          <span className="dv-page-summary">{inicio + 1}–{Math.min(inicio + porPagina, pedidos.length)} de {pedidos.length}</span>
          <button type="button" className="dv-page-arrow" disabled={actual === paginas} onClick={() => setPagina(actual + 1)} aria-label={`Página siguiente: ${titulo}`}>›</button>
        </nav>
      )}
    </section>
  );
}

function DashboardVendedor() {
  const [pedidos, setPedidos] = useState([]);
  const [local, setLocal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [verHistorial, setVerHistorial] = useState(false);
  const [mostrarMensajes, setMostrarMensajes] = useState(false);
  const [tema, setTema] = useState(() => localStorage.getItem("favorcito-tema") || "claro");
  const [sonido, setSonido] = useState(sonidoActivado);
  const [resaltados, setResaltados] = useState([]);
  const [modoCocina, setModoCocina] = useState(() => localStorage.getItem("favorcito-cocina") === "1");
  const [colCocina, setColCocina] = useState("nuevos");
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

  const pedidosPreparando = pedidosEnProceso.filter((p) => ["aceptado", "en_preparacion"].includes(p.estado));
  const pedidosPorEntregar = pedidosEnProceso.filter((p) => ["listo", "en_camino"].includes(p.estado));

  useEffect(() => {
    if (cargando || location.hash !== "#pedidos") return;
    document.getElementById("pedidos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [cargando, location.hash, location.key]);

  const hoy = new Date().toDateString();
  const pedidosHoy = pedidos.filter((p) => new Date(p.createdAt).toDateString() === hoy);
  const ventasHoy = pedidosHoy.filter((p) => p.estado === "entregado").reduce((acc, p) => acc + p.total, 0);
  // La cocina solo muestra lo de las últimas 12 horas. Lo abierto de días anteriores se avisa aparte
  // y sigue disponible en el panel normal, para que no se quede amontonado arriba de todo.
  const esReciente = (p) => new Date() - new Date(p.createdAt) < HORAS_COCINA * 36e5;
  const activosAnteriores = pedidosEnProceso.concat(pedidosNuevos).filter((p) => !esReciente(p));
  const cocinaPreparando = pedidos.filter((p) => ["aceptado", "en_preparacion"].includes(p.estado) && esReciente(p));
  const cocinaListos = pedidos.filter((p) => ["listo", "en_camino"].includes(p.estado) && esReciente(p));
  const columnasCocina = [
    ["nuevos", "Nuevos", pedidosNuevos.filter(esReciente)],
    ["preparando", "Preparando", cocinaPreparando],
    ["listos", "Listos", cocinaListos],
  ];

  useEffect(() => {
    const original = document.title;
    document.title = pedidosNuevos.length > 0 ? `(${pedidosNuevos.length}) ${original}` : original;
    return () => { document.title = original; };
  }, [pedidosNuevos.length]);



  if (cargando) return (
    <div className={`dv-wrap dv-workspace dv-theme-${tema}${ligero ? " dv-ligero" : ""}`}>
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
            <span><b className="dv-producto-cantidad">{item.cantidad}×</b> {item.nombre}</span>
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
    <div className={`dv-wrap dv-workspace dv-theme-${tema}${ligero ? " dv-ligero" : ""}`}>
      <Fondo />

      <div className="dv-container">
        <header className="dv-top">
          <div className="dv-heading">
            <h1>{local?.nombre || "Tu local"}</h1>
            <div className="dv-store-meta">
              <Link to="/vendedor/estado">Local aprobado</Link>
              <span aria-hidden="true">·</span>
              <Link to="/vendedor/promocion">{local?.promocionActiva ? "Promoción activa" : "Sin promoción activa"}</Link>
            </div>
          </div>

          <div className="dv-top-actions">
            <button type="button" className={`dv-modo${modoCocina ? " is-on" : ""}`} onClick={alternarCocina} aria-pressed={modoCocina}>
              <Ic size={18}><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 9.18 0A4 4 0 0 1 18 13.87V21H6zM6 17h12" /></Ic>
              {modoCocina ? "Salir de cocina" : "Modo cocina"}
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
            {activosAnteriores.length > 0 && (
              <p className="dv-aviso dv-aviso--anteriores">
                {activosAnteriores.length} pedido(s) de días anteriores sin cerrar.
                <button type="button" onClick={alternarCocina}>Revisarlos en el panel</button>
              </p>
            )}
            <div className="dv-cocina-bar">
              <div className="dv-cocina-tabs" role="tablist">
                {columnasCocina.map(([clave, titulo, lista]) => (
                  <button key={clave} role="tab" aria-selected={colCocina === clave} className={`dv-tab${colCocina === clave ? " is-active" : ""}`} onClick={() => setColCocina(clave)}>
                    {titulo}<span className="dv-tab-badge">{lista.length}</span>
                  </button>
                ))}
              </div>
              <button type="button" className="dv-atiende" onClick={cambiarAtiende}>
                Atiendes como: <strong>{atiende || "elige tu nombre"}</strong>
              </button>
            </div>
            <div className="dv-cocina-cols">
              {columnasCocina.map(([clave, titulo, lista]) => (
                <div key={clave} className={`dv-col dv-col--${clave}${colCocina === clave ? " is-visible" : ""}`}>
                  <h2 className="dv-col-titulo">{titulo}<span>{lista.length}</span></h2>
                  {lista.length === 0 ? (
                    <p className="dv-col-vacia">Sin pedidos</p>
                  ) : (
                    [...lista].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((p) => (
                      <TarjetaCocina key={p._id} pedido={p} resaltado={resaltados.includes(p._id)} mensajes={notificaciones[p._id] || 0} onAceptar={aceptarPedido} onAvanzar={avanzarEstado} />
                    ))
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : (
        <>
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

        <div className="dv-dayline">
          <p>Hoy <strong>{pedidosHoy.length} pedidos creados</strong><span aria-hidden="true">/</span><strong>${ventasHoy} en pedidos de hoy entregados</strong></p>
          <button type="button" className="dv-history-link" aria-pressed={verHistorial} onClick={() => setVerHistorial((prev) => !prev)}>
            {verHistorial ? "Volver a pendientes" : "Ver historial"} <span aria-hidden="true">↗</span>
          </button>
        </div>

        <section className="dv-workbench" id="pedidos" aria-label={verHistorial ? "Historial de pedidos" : "Pedidos pendientes"}>
          {verHistorial ? (
            <ListaPedidos titulo="Historial" recientes pedidos={pedidosCompletados} descripcion="Entregados y cancelados · pedidos creados en los últimos 14 días." vacio="Sin pedidos entregados ni cancelados en los últimos 14 días." renderPedido={(p) => <CardPedido key={p._id} pedido={p} />} />
          ) : (
            <>
              <ListaPedidos titulo="Por aceptar" pedidos={pedidosNuevos} clase="dv-incoming" vacio="Sin pedidos nuevos. Los que lleguen aparecerán aquí." renderPedido={(p) => <CardPedido key={p._id} pedido={p} />} />
              <ListaPedidos titulo="En preparación" pedidos={pedidosPreparando} descripcion="Incluye pedidos pendientes de días anteriores." vacio="No hay pedidos en preparación." renderPedido={(p) => <CardPedido key={p._id} pedido={p} />} />
              <ListaPedidos titulo="Listos y en camino" pedidos={pedidosPorEntregar} vacio="Todavía no hay pedidos listos para entregar." renderPedido={(p) => <CardPedido key={p._id} pedido={p} />} />
            </>
          )}
        </section>
        </>
        )}
      </div>
    </div>
  );
}

export default DashboardVendedor;
