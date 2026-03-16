import { useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/estudiante/ConfirmarPedido.css";

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
      <div className="cp-wrap">
        <div className="cp-orb-1" />
        <div className="cp-orb-2" />
        <div className="cp-inner">
          <div className="cp-card cp-card--bloqueado">
            <div className="cp-bloqueado-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <p className="cp-bloqueado-title">Tu cuenta está restringida</p>
            <p className="cp-bloqueado-text">
              Has acumulado demasiadas cancelaciones. No puedes realizar pedidos hasta que se resuelva tu caso.
            </p>
            <p className="cp-bloqueado-sub">
              Un administrador revisará tu situación. Es posible que tu cuenta sea suspendida si el comportamiento continúa.
            </p>
            <button onClick={() => navigate("/mis-pedidos")} className="cp-btn cp-btn--danger">
              Ver mis pedidos
            </button>
          </div>
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
    <div className="cp-wrap">
      <div className="cp-orb-1" />
      <div className="cp-orb-2" />
      <div className="cp-particles" aria-hidden="true">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="cp-p" style={{ '--dur': `${6 + i}s`, '--delay': `${i * 0.9}s`, left: `${8 + i * 13}%`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px` }} />
        ))}
      </div>

      <div className="cp-inner">

        {/* Header */}
        <div className="cp-header">
          <div className="cp-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <div>
            <h2 className="cp-title">Confirmar Pedido</h2>
            <p className="cp-subtitle">Revisa tu orden antes de enviarla</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="cp-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Info del local */}
        <div className="cp-card">
          <p className="cp-label">Local</p>
          <p className="cp-local-nombre">{local.nombre}</p>
          <div className="cp-local-dir">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {local.direccion}
          </div>
        </div>

        {/* Productos */}
        <div className="cp-card">
          <p className="cp-section-title">Productos</p>
          <div className="cp-productos-lista">
            {carrito.map((item, i) => (
              <div key={i} className="cp-producto-row" style={{ animationDelay: `${i * 0.07}s` }}>
                <span className="cp-producto-nombre">{item.nombre} <span className="cp-producto-qty">×{item.cantidad}</span></span>
                <span className="cp-producto-precio">${item.precio * item.cantidad}</span>
              </div>
            ))}
          </div>

          <div className="cp-totales">
            <div className="cp-total-row">
              <span>Subtotal</span>
              <span>${subtotal}</span>
            </div>
            {tipoEntrega === "favorcito" && !envioGratis && (
              <div className="cp-total-row">
                <span>Envío</span>
                <span>${costoEnvio}</span>
              </div>
            )}
            {envioGratis && (
              <div className="cp-total-row cp-total-row--gratis">
                <span>Envío</span>
                <div className="cp-chip-gratis">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Gratis
                </div>
              </div>
            )}
            <div className="cp-total-row cp-total-row--final">
              <span>Total</span>
              <span className="cp-total-monto">${envioGratis ? subtotal : total}</span>
            </div>
          </div>
        </div>

        {/* Tipo de entrega */}
        <div className="cp-card">
          <p className="cp-section-title">Tipo de entrega</p>

          <button
            onClick={() => setTipoEntrega("recoger")}
            className={`cp-entrega-btn${tipoEntrega === "recoger" ? " cp-entrega-btn--active" : ""}`}
          >
            <div className="cp-entrega-icono">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="cp-entrega-info">
              <p className="cp-entrega-nombre">Recoger en local</p>
              <p className="cp-entrega-desc">Recoge tu pedido directamente en el local</p>
            </div>
            <div className={`cp-entrega-radio${tipoEntrega === "recoger" ? " cp-entrega-radio--active" : ""}`} />
          </button>

          <button
            onClick={() => setTipoEntrega("favorcito")}
            className={`cp-entrega-btn${tipoEntrega === "favorcito" ? " cp-entrega-btn--active" : ""}`}
          >
            <div className="cp-entrega-icono">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div className="cp-entrega-info">
              <p className="cp-entrega-nombre">Favorcito <span className="cp-chip-envio">$15</span></p>
              <p className="cp-entrega-desc">Un estudiante te lo lleva a donde estés</p>
              {local.promocionActiva && (
                <p className={`cp-promo-txt${subtotal >= local.montoMinimoPromocion ? " cp-promo-txt--activa" : ""}`}>
                  {subtotal >= local.montoMinimoPromocion
                    ? "¡Envío gratis activado!"
                    : `Agrega $${local.montoMinimoPromocion - subtotal} más para envío gratis`}
                </p>
              )}
            </div>
            <div className={`cp-entrega-radio${tipoEntrega === "favorcito" ? " cp-entrega-radio--active" : ""}`} />
          </button>

          {tipoEntrega === "favorcito" && (
            <div className="cp-aviso-efectivo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <div>
                <p className="cp-aviso-efectivo-title">El repartidor cobra en efectivo al entregar</p>
                <p className="cp-aviso-efectivo-sub">Ten listo el dinero exacto al momento de recibir tu pedido.</p>
              </div>
            </div>
          )}
        </div>

        {/* Aviso de pago y fraude */}
        <div className="cp-aviso-fraude">
          <div className="cp-aviso-fraude-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Aviso importante
          </div>
          <ul className="cp-aviso-fraude-lista">
            <li>Todos los pagos se realizan <strong>en efectivo</strong> al momento de recibir tu pedido.</li>
            <li>Las cancelaciones injustificadas afectan tu reputación en la plataforma.</li>
            <li>Cualquier intento de fraude, abuso o comportamiento deshonesto será reportado a las autoridades universitarias.</li>
          </ul>
        </div>

        {/* Checkbox de aceptación */}
        <div className="cp-terminos">
          <div className="cp-checkbox-wrap">
            <input
              type="checkbox"
              id="terminos"
              checked={aceptoTerminos}
              onChange={(e) => setAceptoTerminos(e.target.checked)}
              className="cp-checkbox"
            />
            <span className="cp-checkbox-custom" />
          </div>
          <label htmlFor="terminos" className="cp-terminos-label">
            Entiendo que el pago es en efectivo y acepto las condiciones de uso de la plataforma.
          </label>
        </div>

        {/* Botón confirmar */}
        <button
          onClick={handleConfirmar}
          disabled={cargando || !aceptoTerminos}
          className={`cp-btn cp-btn--full${cargando || !aceptoTerminos ? " cp-btn--disabled" : ""}`}
        >
          {cargando ? (
            <>
              <span className="cp-btn-spinner" />
              Procesando...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Confirmar Pedido
            </>
          )}
        </button>

      </div>
    </div>
  );
}

export default ConfirmarPedido;