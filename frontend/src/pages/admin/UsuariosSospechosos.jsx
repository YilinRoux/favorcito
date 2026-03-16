import { useEffect, useState } from "react";
import api from "../../services/api";
import "../../styles/admin/UsuariosSospechosos.css";

function UsuariosSospechosos() {
  const [usuarios, setUsuarios] = useState([]);
  const [todos, setTodos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState("sospechosos");
  const [busqueda, setBusqueda] = useState("");

  const cargar = async () => {
    try {
      const [sospechososRes, todosRes] = await Promise.all([
        api.get("/admin/usuarios/sospechosos"),
        api.get("/admin/usuarios"),
      ]);
      setUsuarios(sospechososRes.data);
      setTodos(todosRes.data);
    } catch {
      setUsuarios([]);
      setTodos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const suspender = async (id) => {
    if (!confirm("¿Suspender este usuario?")) return;
    try {
      await api.put(`/admin/usuarios/${id}/suspender`);
      cargar();
    } catch {
      alert("Error al suspender usuario");
    }
  };

  const reactivar = async (id) => {
    if (!confirm("¿Reactivar este usuario? Se limpiarán sus cancelaciones.")) return;
    try {
      await api.put(`/admin/usuarios/${id}/reactivar`);
      cargar();
    } catch {
      alert("Error al reactivar usuario");
    }
  };

  const usuariosFiltrados = todos.filter((u) => {
    const q = busqueda.toLowerCase();
    return (
      u.nombre_completo?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const countSuspendidos = todos.filter((u) => !u.activo).length;

  if (cargando) return (
    <div className="us-wrap">
      <div className="us-orb-1" /><div className="us-orb-2" />
      <div className="us-loading">
        <div className="us-loading-spinner" />
        <span>Cargando usuarios...</span>
      </div>
    </div>
  );

  const CardUsuario = ({ usuario }) => (
    <div className={`us-card${!usuario.activo ? " us-card--suspendido" : usuario.sospechoso ? " us-card--sospechoso" : ""}`}>
      <div className="us-card-body">

        {/* Nombre + chips */}
        <div className="us-card-top">
          <div className="us-avatar">
            {(usuario.nombre_completo || "U")[0].toUpperCase()}
          </div>
          <div className="us-card-info">
            <div className="us-nombre-row">
              <p className="us-nombre">{usuario.nombre_completo}</p>
              {!usuario.activo && (
                <span className="us-badge us-badge--suspendido">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Suspendido
                </span>
              )}
              {usuario.sospechoso && (
                <span className="us-badge us-badge--sospechoso">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  Sospechoso
                </span>
              )}
            </div>
            <p className="us-email">{usuario.email}</p>
            <p className="us-rol">
              Rol: <strong>{usuario.rol}</strong>
            </p>
            {usuario.cancelaciones > 0 && (
              <div className="us-cancelaciones">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {usuario.cancelaciones} cancelación{usuario.cancelaciones !== 1 ? "es" : ""}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Acción */}
      <div className="us-card-action">
        {usuario.activo ? (
          <button onClick={() => suspender(usuario._id)} className="us-btn us-btn--suspender">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Suspender
          </button>
        ) : (
          <button onClick={() => reactivar(usuario._id)} className="us-btn us-btn--reactivar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Reactivar
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="us-wrap">
      <div className="us-orb-1" />
      <div className="us-orb-2" />
      <div className="us-particles" aria-hidden="true">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="us-p" style={{ '--dur': `${6 + i}s`, '--delay': `${i * 0.9}s`, left: `${8 + i * 13}%`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px` }} />
        ))}
      </div>

      <div className="us-inner">

        {/* ── Header ── */}
        <div className="us-header">
          <div className="us-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <h2 className="us-title">Gestión de Usuarios</h2>
            <p className="us-subtitle">
              {todos.length} usuario{todos.length !== 1 ? "s" : ""} · {usuarios.length} sospechoso{usuarios.length !== 1 ? "s" : ""} · {countSuspendidos} suspendido{countSuspendidos !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="us-tabs">
          <button onClick={() => setTab("sospechosos")} className={`us-tab-btn${tab === "sospechosos" ? " us-tab-btn--active us-tab-btn--sospechosos" : ""}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Sospechosos
            {usuarios.length > 0 && <span className="us-tab-count us-tab-count--warn">{usuarios.length}</span>}
          </button>
          <button onClick={() => setTab("todos")} className={`us-tab-btn${tab === "todos" ? " us-tab-btn--active us-tab-btn--todos" : ""}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Todos
            <span className="us-tab-count">{todos.length}</span>
          </button>
          <button onClick={() => setTab("suspendidos")} className={`us-tab-btn${tab === "suspendidos" ? " us-tab-btn--active us-tab-btn--suspendidos" : ""}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Suspendidos
            <span className="us-tab-count">{countSuspendidos}</span>
          </button>
        </div>

        {/* ── Tab: Sospechosos ── */}
        {tab === "sospechosos" && (
          usuarios.length === 0 ? (
            <div className="us-empty">
              <div className="us-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <p>No hay usuarios sospechosos.</p>
            </div>
          ) : (
            <div className="us-lista">
              {usuarios.map((u) => <CardUsuario key={u._id} usuario={u} />)}
            </div>
          )
        )}

        {/* ── Tab: Todos ── */}
        {tab === "todos" && (
          <>
            <div className="us-search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="us-search-input"
              />
              {busqueda && (
                <button className="us-search-clear" onClick={() => setBusqueda("")} aria-label="Limpiar búsqueda">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
            {usuariosFiltrados.length === 0 ? (
              <div className="us-empty">
                <div className="us-empty-icon">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <p>No se encontraron usuarios.</p>
              </div>
            ) : (
              <div className="us-lista">
                {usuariosFiltrados.map((u) => <CardUsuario key={u._id} usuario={u} />)}
              </div>
            )}
          </>
        )}

        {/* ── Tab: Suspendidos ── */}
        {tab === "suspendidos" && (
          countSuspendidos === 0 ? (
            <div className="us-empty">
              <div className="us-empty-icon">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </div>
              <p>No hay usuarios suspendidos.</p>
            </div>
          ) : (
            <div className="us-lista">
              {todos.filter((u) => !u.activo).map((u) => <CardUsuario key={u._id} usuario={u} />)}
            </div>
          )
        )}

      </div>
    </div>
  );
}

export default UsuariosSospechosos;