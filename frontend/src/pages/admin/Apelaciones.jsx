import { useEffect, useState } from "react";
import api from "../../services/api";

function Apelaciones() {
  const [apelaciones, setApelaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("pendiente");

  const cargar = async () => {
    try {
      const res = await api.get("/apelaciones");
      setApelaciones(res.data);
    } catch {
      setApelaciones([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const resolver = async (id, decision) => {
    const texto = decision === "aprobada" ? "¿Aprobar y reactivar esta cuenta?" : "¿Rechazar esta apelación?";
    if (!confirm(texto)) return;
    try {
      await api.put(`/apelaciones/${id}/resolver`, { decision });
      cargar();
    } catch {
      alert("Error al resolver apelación");
    }
  };

  const filtradas = apelaciones.filter((a) => a.estado === filtro);

  if (cargando) return <div style={{ padding: "40px" }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "20px" }}>📝 Apelaciones</h2>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid #e5e7eb", marginBottom: "20px" }}>
        {["pendiente", "aprobada", "rechazada"].map((estado) => (
          <button
            key={estado}
            onClick={() => setFiltro(estado)}
            style={{ padding: "10px 16px", fontSize: "14px", fontWeight: "600", cursor: "pointer", border: "none", background: "none", borderBottom: filtro === estado ? "2px solid #3b82f6" : "2px solid transparent", color: filtro === estado ? "#3b82f6" : "#6b7280", marginBottom: "-2px", textTransform: "capitalize" }}
          >
            {estado} ({apelaciones.filter((a) => a.estado === estado).length})
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>No hay apelaciones {filtro}s.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtradas.map((apelacion) => (
            <div key={apelacion._id} style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: "700", fontSize: "15px", margin: "0 0 4px 0" }}>{apelacion.nombre}</p>
                  <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 2px 0" }}>{apelacion.email}</p>
                  <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 10px 0" }}>
                    {new Date(apelacion.createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                  <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "10px 12px" }}>
                    <p style={{ color: "#374151", fontSize: "13px", margin: 0 }}>{apelacion.motivo}</p>
                  </div>
                </div>

                {apelacion.estado === "pendiente" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginLeft: "16px" }}>
                    <button
                      onClick={() => resolver(apelacion._id, "aprobada")}
                      style={{ padding: "6px 14px", background: "#22c55e", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
                    >
                      ✅ Aprobar
                    </button>
                    <button
                      onClick={() => resolver(apelacion._id, "rechazada")}
                      style={{ padding: "6px 14px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
                    >
                      ❌ Rechazar
                    </button>
                  </div>
                )}

                {apelacion.estado === "aprobada" && (
                  <span style={{ color: "#16a34a", fontWeight: "600", fontSize: "13px", marginLeft: "16px" }}>✅ Aprobada</span>
                )}
                {apelacion.estado === "rechazada" && (
                  <span style={{ color: "#dc2626", fontWeight: "600", fontSize: "13px", marginLeft: "16px" }}>❌ Rechazada</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Apelaciones;