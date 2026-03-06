import { useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

function ConfirmarPedido() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);

  const carrito = state?.carrito || [];
  const local = state?.local || null;

  const [tipoEntrega, setTipoEntrega] = useState("recoger");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [aceptoTerminos, setAceptoTerminos] = useState(false);

  const subtotal = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  const costoEnvio = tipoEntrega === "favorcito" ? 15 : 0;
  const total = subtotal + costoEnvio;

  const envioGratis =
    local?.promocionActiva &&
    tipoEntrega === "favorcito" &&
    subtotal >= local?.montoMinimoPromocion;

  if (!carrito.length || !local) {
    navigate("/menu");
    return null;
  }

  // Bloquear si es sospechoso
  if (usuario?.sospechoso) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "12px", padding: "24px", textAlign: "center" }}>
          <p style={{ fontSize: "40px", margin: "0 0 12px 0" }}>🚨</p>
          <p style={{ fontWeight: "700", fontSize: "18px", color: "#dc2626", margin: "0 0 10px 0" }}>
            Tu cuenta está restringida
          </p>
          <p style={{ color: "#dc2626", fontSize: "14px", margin: "0 0 8px 0" }}>
            Has acumulado demasiadas cancelaciones. No puedes realizar pedidos hasta que se resuelva tu caso.
          </p>
          <p style={{ color: "#dc2626", fontSize: "13px", margin: "0 0 16px 0" }}>
            Un administrador revisará tu situación. Es posible que tu cuenta sea suspendida si el comportamiento continúa.
          </p>
          <button
            onClick={() => navigate("/mis-pedidos")}
            style={{ padding: "10px 20px", background: "#dc2626", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
          >
            Ver mis pedidos
          </button>
        </div>
      </div>
    );
  }

  const handleConfirmar = async () => {
    if (!aceptoTerminos) {
      setError("Debes aceptar los términos antes de continuar.");
      return;
    }
    setError("");
    setCargando(true);

    try {
      const res = await api.post("/pedidos", {
        productos: carrito.map((p) => ({
          producto: p.producto,
          cantidad: p.cantidad,
        })),
        tipoEntrega,
      });

      navigate(`/rastreo/${res.data.pedido._id}`);
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al crear pedido");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "20px" }}>
        🛒 Confirmar Pedido
      </h2>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "12px", marginBottom: "16px", color: "#dc2626", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* Info del local */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
        <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 4px 0" }}>Local</p>
        <p style={{ fontWeight: "700", fontSize: "16px", margin: "0 0 2px 0" }}>{local.nombre}</p>
        <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>📍 {local.direccion}</p>
      </div>

      {/* Productos */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
        <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 12px 0" }}>Productos</p>
        {carrito.map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#374151", padding: "3px 0" }}>
            <span>{item.nombre} x{item.cantidad}</span>
            <span>${item.precio * item.cantidad}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid #f3f4f6", marginTop: "10px", paddingTop: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", padding: "2px 0" }}>
            <span>Subtotal</span>
            <span>${subtotal}</span>
          </div>
          {tipoEntrega === "favorcito" && !envioGratis && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6b7280", padding: "2px 0" }}>
              <span>Envío</span>
              <span>${costoEnvio}</span>
            </div>
          )}
          {envioGratis && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#16a34a", padding: "2px 0" }}>
              <span>Envío</span>
              <span>🎉 Gratis</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", fontSize: "15px", padding: "6px 0 0 0", borderTop: "1px solid #f3f4f6", marginTop: "6px" }}>
            <span>Total</span>
            <span style={{ color: "#3b82f6" }}>${envioGratis ? subtotal : total}</span>
          </div>
        </div>
      </div>

      {/* Tipo de entrega */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
        <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 12px 0" }}>Tipo de entrega</p>

        <button
          onClick={() => setTipoEntrega("recoger")}
          style={{ width: "100%", padding: "14px", borderRadius: "10px", border: tipoEntrega === "recoger" ? "2px solid #3b82f6" : "2px solid #e5e7eb", background: tipoEntrega === "recoger" ? "#eff6ff" : "white", textAlign: "left", cursor: "pointer", marginBottom: "10px" }}
        >
          <p style={{ fontWeight: "600", fontSize: "14px", margin: "0 0 2px 0" }}>🏃 Recoger en local</p>
          <p style={{ color: "#6b7280", fontSize: "12px", margin: 0 }}>Recoge tu pedido directamente en el local</p>
        </button>

        <button
          onClick={() => setTipoEntrega("favorcito")}
          style={{ width: "100%", padding: "14px", borderRadius: "10px", border: tipoEntrega === "favorcito" ? "2px solid #3b82f6" : "2px solid #e5e7eb", background: tipoEntrega === "favorcito" ? "#eff6ff" : "white", textAlign: "left", cursor: "pointer" }}
        >
          <p style={{ fontWeight: "600", fontSize: "14px", margin: "0 0 2px 0" }}>🛵 Favorcito</p>
          <p style={{ color: "#6b7280", fontSize: "12px", margin: "0 0 4px 0" }}>Un estudiante te lo lleva — costo de envío: <strong>$15</strong></p>
          {local.promocionActiva && (
            <p style={{ color: "#16a34a", fontSize: "12px", margin: 0 }}>
              {subtotal >= local.montoMinimoPromocion
                ? "🎉 ¡Envío gratis activado!"
                : `Agrega $${local.montoMinimoPromocion - subtotal} más para envío gratis`}
            </p>
          )}
        </button>

        {tipoEntrega === "favorcito" && (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "10px 12px", marginTop: "10px" }}>
            <p style={{ color: "#1d4ed8", fontSize: "13px", fontWeight: "600", margin: "0 0 2px 0" }}>
              💵 El repartidor cobra en efectivo al entregar
            </p>
            <p style={{ color: "#1d4ed8", fontSize: "12px", margin: 0 }}>
              Ten listo el dinero exacto al momento de recibir tu pedido.
            </p>
          </div>
        )}
      </div>

      {/* Aviso de pago y fraude */}
      <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
        <p style={{ fontWeight: "700", fontSize: "13px", color: "#92400e", margin: "0 0 8px 0" }}>
          ⚠️ Aviso importante
        </p>
        <p style={{ color: "#92400e", fontSize: "13px", margin: "0 0 6px 0" }}>
          • Todos los pagos se realizan <strong>en efectivo</strong> al momento de recibir tu pedido.
        </p>
        <p style={{ color: "#92400e", fontSize: "13px", margin: "0 0 6px 0" }}>
          • Las cancelaciones injustificadas afectan tu reputación en la plataforma.
        </p>
        <p style={{ color: "#92400e", fontSize: "13px", margin: 0 }}>
          • Cualquier intento de fraude, abuso o comportamiento deshonesto será reportado a las autoridades universitarias correspondientes.
        </p>
      </div>

      {/* Checkbox de aceptación */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "16px" }}>
        <input
          type="checkbox"
          id="terminos"
          checked={aceptoTerminos}
          onChange={(e) => setAceptoTerminos(e.target.checked)}
          style={{ marginTop: "2px", cursor: "pointer", width: "16px", height: "16px" }}
        />
        <label htmlFor="terminos" style={{ fontSize: "13px", color: "#374151", cursor: "pointer" }}>
          Entiendo que el pago es en efectivo y acepto las condiciones de uso de la plataforma.
        </label>
      </div>

      <button
        onClick={handleConfirmar}
        disabled={cargando || !aceptoTerminos}
        style={{ width: "100%", padding: "14px", background: cargando || !aceptoTerminos ? "#d1d5db" : "#3b82f6", color: "white", border: "none", borderRadius: "10px", cursor: cargando || !aceptoTerminos ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "16px" }}
      >
        {cargando ? "Procesando..." : "Confirmar Pedido"}
      </button>
    </div>
  );
}

export default ConfirmarPedido;