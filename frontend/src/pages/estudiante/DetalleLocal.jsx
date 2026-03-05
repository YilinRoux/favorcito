import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

function DetalleLocal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);

  const [local, setLocal] = useState(null);
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState("menu");
  const [comentario, setComentario] = useState("");
  const [estrellas, setEstrellas] = useState(0);
  const [reporteAbierto, setReporteAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarLocal = async () => {
    try {
      const localRes = await api.get(`/locales/${id}`);
      setLocal(localRes.data);
      const productosRes = await api.get(`/productos/local/${id}`);
      setProductos(productosRes.data);
    } catch {
      navigate("/menu");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarLocal();
  }, [id]);

  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((p) => p.producto === producto._id);
      if (existe) return prev.map((p) => p.producto === producto._id ? { ...p, cantidad: p.cantidad + 1 } : p);
      return [...prev, { producto: producto._id, nombre: producto.nombre, precio: producto.precio, cantidad: 1 }];
    });
  };

  const quitarDelCarrito = (productoId) => {
    setCarrito((prev) => {
      const existe = prev.find((p) => p.producto === productoId);
      if (existe && existe.cantidad > 1) return prev.map((p) => p.producto === productoId ? { ...p, cantidad: p.cantidad - 1 } : p);
      return prev.filter((p) => p.producto !== productoId);
    });
  };

  const totalCarrito = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

  const handleCalificar = async (estrella) => {
    try {
      await api.post(`/locales/${id}/calificar`, { estrellas: estrella });
      setEstrellas(estrella);
      const localRes = await api.get(`/locales/${id}`);
      setLocal(localRes.data);
      setMensaje("¡Calificación guardada!");
    } catch {
      alert("Error al calificar");
    }
  };

  const handleComentar = async () => {
    if (!comentario.trim()) return;
    try {
      await api.post(`/locales/${id}/comentar`, { texto: comentario });
      setLocal((prev) => ({
        ...prev,
        comentarios: [...(prev.comentarios || []), { usuario: { nombre_completo: usuario?.nombre_completo }, texto: comentario, fecha: new Date() }]
      }));
      setComentario("");
      setMensaje("Comentario agregado");
    } catch {
      alert("Error al comentar");
    }
  };

  const handleReportar = async () => {
    if (!motivo) return;
    try {
      await api.post("/reportes", { tipoReportado: "local", localReportado: id, motivo });
      setReporteAbierto(false);
      setMotivo("");
      setMensaje("Reporte enviado al administrador");
    } catch {
      alert("Error al reportar");
    }
  };

  if (cargando) return <div style={{ padding: "40px" }}>Cargando...</div>;
  if (!local) return null;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "16px 16px 120px 16px" }}>

      {/* Info del local */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>{local.nombre}</h2>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "4px 0 2px 0" }}>{local.descripcion}</p>
            <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>📍 {local.direccion}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
              <span>{"⭐".repeat(Math.round(local.calificacionPromedio || 0))}</span>
              <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                {local.totalCalificaciones > 0 ? `${local.calificacionPromedio?.toFixed(1)} (${local.totalCalificaciones} reseñas)` : "Sin calificaciones"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setReporteAbierto(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "13px" }}
          >
            🚩 Reportar
          </button>
        </div>

        {/* Promoción */}
        {local.promocionActiva && (
          <div style={{ marginTop: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "8px 12px" }}>
            <p style={{ color: "#15803d", fontWeight: "600", fontSize: "13px", margin: 0 }}>
              🎉 Envío gratis en pedidos mayores a ${local.montoMinimoPromocion} por Favorcito
            </p>
          </div>
        )}

        {/* Anuncio */}
        {local.anuncio && (
          <div style={{ marginTop: "8px", background: "#fefce8", border: "1px solid #fde68a", borderRadius: "8px", padding: "8px 12px" }}>
            <p style={{ color: "#92400e", fontSize: "13px", margin: 0 }}>📢 {local.anuncio}</p>
          </div>
        )}

        {/* Imágenes anuncios */}
        {local.imagenesAnuncios?.length > 0 && (
          <div style={{ display: "flex", gap: "8px", marginTop: "10px", overflowX: "auto", paddingBottom: "4px" }}>
            {local.imagenesAnuncios.map((img, i) => (
              <img key={i} src={`http://localhost:5000${img}`} style={{ width: "100px", height: "70px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e5e7eb", flexShrink: 0 }} />
            ))}
          </div>
        )}
      </div>

      {/* Mensaje de éxito */}
      {mensaje && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "13px" }}>
          {mensaje}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid #e5e7eb", marginBottom: "16px" }}>
        <button
          onClick={() => setTab("menu")}
          style={{ padding: "8px 16px", fontSize: "14px", fontWeight: "600", cursor: "pointer", border: "none", background: "none", borderBottom: tab === "menu" ? "2px solid #3b82f6" : "2px solid transparent", color: tab === "menu" ? "#3b82f6" : "#6b7280", marginBottom: "-2px" }}
        >
          🍽️ Menú
        </button>
        <button
          onClick={() => setTab("resenas")}
          style={{ padding: "8px 16px", fontSize: "14px", fontWeight: "600", cursor: "pointer", border: "none", background: "none", borderBottom: tab === "resenas" ? "2px solid #3b82f6" : "2px solid transparent", color: tab === "resenas" ? "#3b82f6" : "#6b7280", marginBottom: "-2px" }}
        >
          💬 Reseñas ({local.comentarios?.length || 0})
        </button>
      </div>

      {/* TAB MENÚ */}
      {tab === "menu" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {productos.length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>Este local no tiene productos aún.</p>
          ) : (
            productos.map((producto) => {
              const enCarrito = carrito.find((p) => p.producto === producto._id);
              return (
                <div key={producto._id} style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "12px", display: "flex", gap: "12px", alignItems: "center" }}>
                  {/* Imagen producto */}
                  {producto.imagen ? (
                    <img src={`http://localhost:5000${producto.imagen}`} style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e5e7eb", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: "70px", height: "70px", background: "#f3f4f6", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>🍽️</div>
                  )}

                  {/* Info producto */}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "700", fontSize: "14px", margin: 0 }}>{producto.nombre}</p>
                    {producto.descripcion && (
                      <p style={{ color: "#6b7280", fontSize: "12px", margin: "2px 0" }}>{producto.descripcion}</p>
                    )}
                    <p style={{ fontWeight: "700", color: "#3b82f6", fontSize: "14px", margin: "2px 0 0 0" }}>${producto.precio}</p>
                    <p style={{ color: "#9ca3af", fontSize: "11px", margin: 0 }}>Stock: {producto.stock}</p>
                  </div>

                  {/* Controles carrito */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    {enCarrito ? (
                      <>
                        <button onClick={() => quitarDelCarrito(producto._id)} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #e5e7eb", background: "white", cursor: "pointer", fontWeight: "700", fontSize: "16px" }}>-</button>
                        <span style={{ fontWeight: "700", fontSize: "15px", minWidth: "20px", textAlign: "center" }}>{enCarrito.cantidad}</span>
                        <button onClick={() => agregarAlCarrito(producto)} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "none", background: "#3b82f6", color: "white", cursor: "pointer", fontWeight: "700", fontSize: "16px" }}>+</button>
                      </>
                    ) : (
                      <button onClick={() => agregarAlCarrito(producto)} style={{ padding: "6px 14px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                        Agregar
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB RESEÑAS */}
      {tab === "resenas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Calificar */}
          <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
            <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 10px 0" }}>⭐ Califica este local</p>
            <div style={{ display: "flex", gap: "8px" }}>
              {[1, 2, 3, 4, 5].map((e) => (
                <button
                  key={e}
                  onClick={() => handleCalificar(e)}
                  style={{ fontSize: "28px", background: "none", border: "none", cursor: "pointer", opacity: e <= estrellas ? 1 : 0.3 }}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          {/* Comentar */}
          <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}>
            <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 10px 0" }}>💬 Deja un comentario</p>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="¿Cómo fue tu experiencia?"
              rows={3}
              style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", outline: "none", resize: "none", boxSizing: "border-box" }}
            />
            <button
              onClick={handleComentar}
              style={{ marginTop: "8px", padding: "8px 16px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
            >
              Comentar
            </button>
          </div>

          {/* Lista comentarios */}
          {(local.comentarios || []).length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>No hay comentarios aún.</p>
          ) : (
            [...(local.comentarios || [])].reverse().map((c, i) => (
              <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "12px" }}>
                <p style={{ fontWeight: "600", fontSize: "14px", margin: 0 }}>{c.usuario?.nombre_completo || "Usuario"}</p>
                <p style={{ color: "#374151", fontSize: "13px", margin: "4px 0" }}>{c.texto}</p>
                <p style={{ color: "#9ca3af", fontSize: "11px", margin: 0 }}>{new Date(c.fecha).toLocaleDateString("es-MX")}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Carrito flotante */}
      {carrito.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #e5e7eb", padding: "12px 16px" }}>
          <div style={{ maxWidth: "700px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: "700", fontSize: "14px", margin: 0 }}>
                {carrito.reduce((acc, p) => acc + p.cantidad, 0)} producto(s)
              </p>
              <p style={{ fontWeight: "700", color: "#3b82f6", fontSize: "16px", margin: "2px 0 0 0" }}>${totalCarrito}</p>
              {local.promocionActiva && totalCarrito >= local.montoMinimoPromocion && (
                <p style={{ color: "#16a34a", fontSize: "12px", margin: 0 }}>🎉 ¡Envío gratis activado!</p>
              )}
              {local.promocionActiva && totalCarrito < local.montoMinimoPromocion && (
                <p style={{ color: "#9ca3af", fontSize: "12px", margin: 0 }}>
                  Agrega ${local.montoMinimoPromocion - totalCarrito} más para envío gratis
                </p>
              )}
            </div>
            <button
              onClick={() => navigate("/confirmar", { state: { carrito, local } })}
              style={{ padding: "10px 20px", background: "#3b82f6", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}
            >
              Ver carrito →
            </button>
          </div>
        </div>
      )}

      {/* Modal reporte */}
      {reporteAbierto && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "360px" }}>
            <p style={{ fontWeight: "700", fontSize: "16px", margin: "0 0 16px 0" }}>🚩 Reportar local</p>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", marginBottom: "16px", outline: "none" }}
            >
              <option value="">Selecciona un motivo</option>
              <option value="mal_servicio">Mal servicio</option>
              <option value="producto_en_mal_estado">Producto en mal estado</option>
              <option value="comportamiento_inapropiado">Comportamiento inapropiado</option>
              <option value="otro">Otro</option>
            </select>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleReportar}
                disabled={!motivo}
                style={{ flex: 1, padding: "8px", background: motivo ? "#ef4444" : "#d1d5db", color: "white", border: "none", borderRadius: "8px", cursor: motivo ? "pointer" : "not-allowed", fontWeight: "600" }}
              >
                Reportar
              </button>
              <button
                onClick={() => setReporteAbierto(false)}
                style={{ flex: 1, padding: "8px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetalleLocal;