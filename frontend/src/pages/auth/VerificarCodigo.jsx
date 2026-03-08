/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../../services/api";
import "../../styles/auth/Login.css";
import "../../styles/auth/VerificarCodigo.css";

function VerificarCodigo() {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [verificado, setVerificado] = useState(false);
  const [timer, setTimer] = useState(60);
  const [puedeReenviar, setPuedeReenviar] = useState(false);

  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  // Countdown timer para reenvío
  useEffect(() => {
    if (timer === 0) { setPuedeReenviar(true); return; }
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  // Foco al primer input al montar
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const codigo = digits.join("");

  /* ── Manejo de inputs OTP ── */
  const handleDigit = (index, value) => {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    if (v && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  /* ── Verificar ── */
  const handleVerificar = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);

    if (codigo.length !== 6) {
      setError("Debes ingresar los 6 dígitos del código");
      setCargando(false);
      return;
    }

    try {
      await api.post("/auth/verificar-codigo", { email, codigo });
      setVerificado(true);
      setMensaje("¡Cuenta verificada exitosamente!");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.mensaje || "Código inválido o expirado");
      // Sacude los inputs al error
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setCargando(false);
    }
  };

  /* ── Reenviar ── */
  const reenviarCodigo = async () => {
    setError("");
    setMensaje("");
    setCargando(true);
    try {
      await api.post("/auth/reenviar-codigo", { email });
      setMensaje("Código reenviado a tu correo ✉️");
      setPuedeReenviar(false);
      setTimer(60);
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err) {
      setError("Error al reenviar el código");
    } finally {
      setCargando(false);
    }
  };

  /* ── Pantalla de éxito ── */
  if (verificado) {
    return (
      <div className="auth-wrapper">
        <div className="auth-particles">
          {[...Array(8)].map((_, i) => <div key={i} className="auth-particle" />)}
        </div>
        <div className="auth-card ver-success-card">
          <div className="ver-success-ring">
            <div className="ver-success-icon-wrap">✅</div>
          </div>
          <h2 className="auth-title" style={{ textAlign: "center", marginTop: "20px" }}>
            ¡Cuenta verificada!
          </h2>
          <p className="auth-subtitle" style={{ textAlign: "center" }}>
            Redirigiendo al login...
          </p>
          <div className="ver-loading-bar">
            <div className="ver-loading-bar-fill" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-particles">
        {[...Array(8)].map((_, i) => <div key={i} className="auth-particle" />)}
      </div>

      <div className="auth-card">

        {/* Ícono de sobre animado */}
        <div className="ver-envelope-wrap">
          <div className="ver-envelope">✉️</div>
          <div className="ver-envelope-ring" />
          <div className="ver-envelope-ring ver-envelope-ring--2" />
        </div>

        <h2 className="auth-title" style={{ textAlign: "center" }}>
          Verifica tu cuenta
        </h2>
        <p className="auth-subtitle" style={{ textAlign: "center" }}>
          Enviamos un código de 6 dígitos a:
        </p>
        <p className="ver-email-chip">{email || "tu correo"}</p>

        <form className="auth-form" onSubmit={handleVerificar}>

          {/* Error */}
          {error && (
            <div className="auth-error ver-shake">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Mensaje éxito inline */}
          {mensaje && !verificado && (
            <div className="ver-success-msg">
              <span>✅</span> {mensaje}
            </div>
          )}

          {/* OTP Inputs */}
          <div className="ver-otp-group" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`ver-otp-input ${d ? "ver-otp-input--filled" : ""} ${error ? "ver-otp-input--error" : ""}`}
              />
            ))}
          </div>

          {/* Progress dots */}
          <div className="ver-otp-dots">
            {digits.map((d, i) => (
              <div
                key={i}
                className={`ver-otp-dot ${d ? "ver-otp-dot--filled" : ""}`}
              />
            ))}
          </div>

          {/* Timer + reenvío */}
          <div className="ver-resend-row">
            {puedeReenviar ? (
              <button
                type="button"
                onClick={reenviarCodigo}
                disabled={cargando}
                className="ver-resend-btn"
              >
                🔄 Reenviar código
              </button>
            ) : (
              <span className="ver-timer-text">
                Reenviar en <strong className="ver-timer-count">{timer}s</strong>
              </span>
            )}
          </div>

          {/* Hint expiración */}
          <p className="ver-expire-hint">⏱️ El código expira en 10 minutos</p>

          {/* Submit */}
          <button
            type="submit"
            disabled={cargando || codigo.length !== 6}
            className="auth-btn-submit"
          >
            {cargando ? "Verificando..." : "Verificar Cuenta"}
          </button>

          {/* Volver */}
          <p className="auth-footer">
            <Link to="/login" className="auth-link">← Volver al login</Link>
          </p>

        </form>
      </div>
    </div>
  );
}

export default VerificarCodigo;