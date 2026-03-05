import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function MisEntregas() {
  const [entregas, setEntregas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get("/pedidos/favorcito/mis-entregas");
        setEntregas(res.data);
      } catch {
        setEntregas([]);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const estadoLabel = {
    en_camino: "En camino",
    entregado: "Entregado",
    cancelado: "Cancelado",
  };

  if (cargando) return <div style={{ padding: "40px" }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "16px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>📬 Mis Entregas</h2>

      {entregas.length === 0 ? (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "40px", textAlign: "center", color: "#9ca3af" }}>
          No has realizado entregas aún.
          <button
            onClick={() => navigate("/favorcito")}
            style={{ display: "block", margin: "16px auto 0", padding: "8px 16px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
          >
            Ver favorcitos disponibles
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {entregas.map((entrega) => (
            <div key={entrega._id} style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <p style={{ fontWeight: "700", fontSize: "15px", margin: 0 }}>{entrega.local?.nombre}</p>
                  <p style={{ color: "#6b7280", fontSize: "13px", margin: "4px 0 0 0" }}>
                    {new Date(entrega.createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: "700", color: "#3b82f6", margin: 0 }}>${entrega.total}</p>
                  <p style={{ fontSize: "12px", fontWeight: "600", margin: "4px 0 0 0", color: entrega.estado === "entregado" ? "#16a34a" : entrega.estado === "en_camino" ? "#7c3aed" : "#dc2626" }}>
                    {estadoLabel[entrega.estado] || entrega.estado}
                  </p>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #f3f4f6", padding: "8px 0" }}>
                {entrega.productos?.map((item, i) => (
                  <p key={i} style={{ fontSize: "13px", color: "#6b7280", margin: "2px 0" }}>
                    {item.cantidad}x {item.nombre}
                  </p>
                ))}
              </div>

              {entrega.estado === "en_camino" && (
                <button
                  onClick={() => navigate(`/pedido/${entrega._id}`)}
                  style={{ marginTop: "10px", width: "100%", padding: "8px", background: "#7c3aed", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}
                >
                  🛵 Ver entrega activa
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MisEntregas;