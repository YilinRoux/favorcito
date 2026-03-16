/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../../services/api";
import "../../styles/auth/VerificarCodigo.css";

function VerificarCodigo() {
  const [digits, setDigits] = useState(["","","","","",""]);
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
  const codigo = digits.join("");

  useEffect(() => {
    if (timer === 0) { setPuedeReenviar(true); return; }
    const t = setTimeout(() => setTimer(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const handleDigit = (index, value) => {
    const v = value.replace(/\D/g,"").slice(-1);
    const next = [...digits]; next[index] = v; setDigits(next);
    if (v && index < 5) inputRefs.current[index+1]?.focus();
  };
  const handleKeyDown = (index, e) => {
    if (e.key==="Backspace" && !digits[index] && index>0) inputRefs.current[index-1]?.focus();
    if (e.key==="ArrowLeft"  && index>0) inputRefs.current[index-1]?.focus();
    if (e.key==="ArrowRight" && index<5) inputRefs.current[index+1]?.focus();
  };
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if (pasted.length===6) { setDigits(pasted.split("")); inputRefs.current[5]?.focus(); }
    e.preventDefault();
  };

  const handleVerificar = async (e) => {
    e.preventDefault();
    setError(""); setMensaje(""); setCargando(true);
    if (codigo.length !== 6) {
      setError("Debes ingresar los 6 dígitos del código");
      setCargando(false); return;
    }
    try {
      await api.post("/auth/verificar-codigo", { email, codigo });
      setVerificado(true);
      setMensaje("¡Cuenta verificada exitosamente!");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.mensaje || "Código inválido o expirado");
      setDigits(["","","","","",""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally { setCargando(false); }
  };

  const reenviarCodigo = async () => {
    setError(""); setMensaje(""); setCargando(true);
    try {
      await api.post("/auth/reenviar-codigo", { email });
      setMensaje("Código reenviado a tu correo");
      setPuedeReenviar(false); setTimer(60);
      setDigits(["","","","","",""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err) {
      setError("Error al reenviar el código");
    } finally { setCargando(false); }
  };

  /* ── Pantalla de éxito ── */
  if (verificado) {
    return (
      <div className="vc-wrap">
        <div className="vc-orb vc-orb-1" />
        <div className="vc-card vc-card--success">
          <div className="vc-success-ring">
            <div className="vc-success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="30" height="30">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
          <h2 className="vc-title">¡Cuenta verificada!</h2>
          <p className="vc-subtitle">Redirigiendo al login...</p>
          <div className="vc-loading-bar"><div className="vc-loading-fill" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="vc-wrap">
      <div className="vc-particles">
        {[...Array(7)].map((_,i) => <div key={i} className="vc-p" />)}
      </div>
      <div className="vc-orb vc-orb-1" />
      <div className="vc-orb vc-orb-2" />

      <div className="vc-card">

        {/* Logo */}
        <div className="vc-logo">
          <div className="vc-logo-icon">
            <svg className="vc-logo-svg" viewBox="0 0 24 24">
              <circle cx="5.5" cy="17.5" r="2.5"/>
              <circle cx="18.5" cy="17.5" r="2.5"/>
              <path d="M3 5h11l2 7H5L3 5z"/>
              <path d="M15 12h4l2 5"/>
            </svg>
          </div>
          <span className="vc-logo-text">Favorcito</span>
        </div>

        {/* Ícono sobre animado */}
        <div className="vc-envelope-wrap">
          <div className="vc-env-ring" />
          <div className="vc-env-ring vc-env-ring-2" />
          <div className="vc-envelope">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="36" height="36">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
        </div>

        <h2 className="vc-title">Verifica tu cuenta</h2>
        <p className="vc-subtitle">Enviamos un código de 6 dígitos a:</p>
        <span className="vc-email-chip">{email || "tu correo"}</span>

        <form className="vc-form" onSubmit={handleVerificar}>

          {error && (
            <div className="vc-msg-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" width="15" height="15">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {mensaje && !verificado && (
            <div className="vc-msg-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {mensaje}
            </div>
          )}

          {/* OTP inputs */}
          <div className="vc-otp-group" onPaste={handlePaste}>
            {digits.map((d,i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`vc-otp-input ${d ? "vc-otp-filled" : ""} ${error ? "vc-otp-error" : ""}`}
              />
            ))}
          </div>

          {/* Progress dots */}
          <div className="vc-dots">
            {digits.map((d,i) => <div key={i} className={`vc-dot ${d ? "vc-dot-filled" : ""}`} />)}
          </div>

          {/* Timer / reenvío */}
          <div className="vc-resend-row">
            {puedeReenviar ? (
              <button type="button" onClick={reenviarCodigo} disabled={cargando} className="vc-resend-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                </svg>
                Reenviar código
              </button>
            ) : (
              <span className="vc-timer-text">
                Reenviar en <strong className="vc-timer-count">{timer}s</strong>
              </span>
            )}
          </div>

          <p className="vc-expire">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="12" height="12">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            El código expira en 10 minutos
          </p>

          <button type="submit" disabled={cargando || codigo.length !== 6} className="vc-btn">
            {cargando ? "Verificando..." : "Verificar Cuenta"}
          </button>

          <p className="vc-footer">
            <Link to="/login" className="vc-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Volver al login
            </Link>
          </p>

        </form>
      </div>
    </div>
  );
}

export default VerificarCodigo;