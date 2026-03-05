import { useEffect, useState } from "react";
import api from "../../services/api";

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
    const coincide = u.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email?.toLowerCase().includes(busqueda.toLowerCase());
    return coincide;
  });

  if (cargando) return <div style={{ padding: "40px" }}>Cargando...</div>;

  const CardUsuario = ({ usuario }) => (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <p style={{ fontWeight: "700", fontSize: "15px", margin: 0 }}>{usuario.nombre_completo}</p>
            {!usuario.activo && (
              <span style={{ background: "#fee2e2", color: "#dc2626", fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: "600" }}>
                Suspendido
              </span>
            )}
            {usuario.sospechoso && (
              <span style={{ background: "#fef3c7", color: "#d97706", fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: "600" }}>
                ⚠️ Sospechoso
              </span>
            )}
          </div>
          <p style={{ color: "#6b7280", fontSize: "13px", margin: "2px 0" }}>{usuario.email}</p>
          <p style={{ color: "#6b7280", fontSize: "13px", margin: "2px 0" }}>
            Rol: <strong>{usuario.rol}</strong>
          </p>
          {usuario.cancelaciones > 0 && (
            <p style={{ color: "#dc2626", fontSize: "13px", margin: "4px 0 0 0", fontWeight: "600" }}>
              Cancelaciones: {usuario.cancelaciones}
            </p>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {usuario.activo ? (
            <button
              onClick={() => suspender(usuario._id)}
              style={{ padding: "6px 14px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
            >
              Suspender
            </button>
          ) : (
            <button
              onClick={() => reactivar(usuario._id)}
              style={{ padding: "6px 14px", background: "#22c55e", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
            >
              Reactivar
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "20px" }}>👥 Gestión de Usuarios</h2>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid #e5e7eb", marginBottom: "20px" }}>
        <button
          onClick={() => setTab("sospechosos")}
          style={{ padding: "10px 16px", fontSize: "14px", fontWeight: "600", cursor: "pointer", border: "none", background: "none", borderBottom: tab === "sospechosos" ? "2px solid #f59e0b" : "2px solid transparent", color: tab === "sospechosos" ? "#f59e0b" : "#6b7280", marginBottom: "-2px" }}
        >
          ⚠️ Sospechosos {usuarios.length > 0 && (
            <span style={{ background: "#f59e0b", color: "white", borderRadius: "50%", padding: "1px 6px", fontSize: "11px", marginLeft: "4px" }}>
              {usuarios.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("todos")}
          style={{ padding: "10px 16px", fontSize: "14px", fontWeight: "600", cursor: "pointer", border: "none", background: "none", borderBottom: tab === "todos" ? "2px solid #3b82f6" : "2px solid transparent", color: tab === "todos" ? "#3b82f6" : "#6b7280", marginBottom: "-2px" }}
        >
          👥 Todos ({todos.length})
        </button>
        <button
          onClick={() => setTab("suspendidos")}
          style={{ padding: "10px 16px", fontSize: "14px", fontWeight: "600", cursor: "pointer", border: "none", background: "none", borderBottom: tab === "suspendidos" ? "2px solid #ef4444" : "2px solid transparent", color: tab === "suspendidos" ? "#ef4444" : "#6b7280", marginBottom: "-2px" }}
        >
          🚫 Suspendidos ({todos.filter(u => !u.activo).length})
        </button>
      </div>

      {/* Tab sospechosos */}
      {tab === "sospechosos" && (
        usuarios.length === 0 ? (
          <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>No hay usuarios sospechosos.</p>
        ) : (
          usuarios.map((u) => <CardUsuario key={u._id} usuario={u} />)
        )
      )}

      {/* Tab todos */}
      {tab === "todos" && (
        <>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", marginBottom: "16px", outline: "none", boxSizing: "border-box" }}
          />
          {usuariosFiltrados.length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center" }}>No se encontraron usuarios.</p>
          ) : (
            usuariosFiltrados.map((u) => <CardUsuario key={u._id} usuario={u} />)
          )}
        </>
      )}

      {/* Tab suspendidos */}
      {tab === "suspendidos" && (
        todos.filter(u => !u.activo).length === 0 ? (
          <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>No hay usuarios suspendidos.</p>
        ) : (
          todos.filter(u => !u.activo).map((u) => <CardUsuario key={u._id} usuario={u} />)
        )
      )}
    </div>
  );
}

export default UsuariosSospechosos;