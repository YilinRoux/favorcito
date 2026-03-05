import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function MenuLocales() {
  const [locales, setLocales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [imagenActiva, setImagenActiva] = useState(0);
  const navigate = useNavigate();

  const cargar = async () => {
    try {
      const res = await api.get("/locales");
      const ordenados = res.data.sort((a, b) => {
        if (a.promocionActiva && !b.promocionActiva) return -1;
        if (!a.promocionActiva && b.promocionActiva) return 1;
        return 0;
      });
      setLocales(ordenados);
    } catch {
      setLocales([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // Refrescar cada 30 segundos para capturar cambios de promoción
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, []);

  // Solo imágenes de locales con promoción activa
  const imagenesPromo = locales
    .filter((l) => l.promocionActiva && l.imagenesAnuncios?.length > 0)
    .flatMap((local) =>
      local.imagenesAnuncios.map((img) => ({
        imagen: img,
        localNombre: local.nombre,
        localId: local._id,
        anuncio: local.anuncio,
        monto: local.montoMinimoPromocion,
      }))
    );

  useEffect(() => {
    if (imagenesPromo.length === 0) return;
    const interval = setInterval(() => {
      setImagenActiva((prev) => (prev + 1) % imagenesPromo.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [imagenesPromo.length]);

  if (cargando) return <div style={{ padding: "40px" }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "16px" }}>

      <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>🏪 Locales disponibles</h2>

      {/* Carrusel solo de locales con promoción */}
      {imagenesPromo.length > 0 && (
        <div style={{ marginBottom: "20px", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", position: "relative" }}>
          <img
            src={`http://localhost:5000${imagenesPromo[imagenActiva].imagen}`}
            alt="Promoción"
            style={{ width: "100%", height: "180px", objectFit: "cover" }}
          />
          <div style={{ padding: "10px 14px", background: "#f0fdf4", borderTop: "1px solid #bbf7d0" }}>
            <p style={{ fontWeight: "700", fontSize: "14px", margin: 0 }}>
              🎉 {imagenesPromo[imagenActiva].localNombre} — Envío gratis en pedidos +${imagenesPromo[imagenActiva].monto}
            </p>
            {imagenesPromo[imagenActiva].anuncio && (
              <p style={{ color: "#6b7280", fontSize: "13px", margin: "4px 0 0 0" }}>
                📢 {imagenesPromo[imagenActiva].anuncio}
              </p>
            )}
          </div>

          {/* Puntos navegación */}
          {imagenesPromo.length > 1 && (
            <div style={{ position: "absolute", top: "8px", right: "8px", display: "flex", gap: "4px" }}>
              {imagenesPromo.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImagenActiva(i)}
                  style={{ width: "8px", height: "8px", borderRadius: "50%", border: "none", cursor: "pointer", background: i === imagenActiva ? "white" : "rgba(255,255,255,0.5)" }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lista de locales */}
      {locales.length === 0 ? (
        <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px 0" }}>No hay locales disponibles.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {locales.map((local) => (
            <div
              key={local._id}
              onClick={() => navigate(`/local/${local._id}`)}
              style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "14px", cursor: "pointer", position: "relative" }}
            >
              {/* Badge promoción */}
              {local.promocionActiva && (
                <div style={{ position: "absolute", top: "10px", right: "10px", background: "#22c55e", color: "white", fontSize: "11px", padding: "3px 10px", borderRadius: "20px", fontWeight: "600" }}>
                  🎉 Envío gratis +${local.montoMinimoPromocion}
                </div>
              )}

              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                {/* Imagen */}
                {local.fotos?.[0] ? (
                  <img
                    src={`http://localhost:5000${local.fotos[0]}`}
                    alt={local.nombre}
                    style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "10px", border: "1px solid #e5e7eb", flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: "70px", height: "70px", background: "#f3f4f6", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", flexShrink: 0 }}>
                    🏪
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: "700", fontSize: "15px", margin: 0 }}>{local.nombre}</p>
                  <p style={{ color: "#6b7280", fontSize: "13px", margin: "3px 0" }}>{local.descripcion}</p>
                  <p style={{ color: "#9ca3af", fontSize: "12px", margin: 0 }}>📍 {local.direccion}</p>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                    <span style={{ fontSize: "13px" }}>
                      {"⭐".repeat(Math.round(local.calificacionPromedio || 0)) || "Sin calificaciones"}
                    </span>
                    {local.totalCalificaciones > 0 && (
                      <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                        ({local.totalCalificaciones} reseñas)
                      </span>
                    )}
                  </div>

                  {local.anuncio && (
                    <div style={{ marginTop: "6px", background: "#fefce8", border: "1px solid #fde68a", borderRadius: "8px", padding: "5px 10px" }}>
                      <p style={{ color: "#92400e", fontSize: "12px", margin: 0 }}>📢 {local.anuncio}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MenuLocales;