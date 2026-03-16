import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/auth/RecuperarContrasena.css";

export default function RecuperarContrasena() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(["","","","","",""]);
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const inputRefs = useRef([]);
  const codigo = digits.join("");

  useEffect(() => {
    if (paso === 2) setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [paso]);

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

  const solicitarCodigo = async () => {
    if (!email) return setError("Ingresa tu correo");
    setCargando(true); setError("");
    try {
      await api.post("/auth/recuperar-contrasena", { email });
      setMensaje("Código enviado a tu correo");
      setPaso(2);
    } catch (err) {
      setError(err.response?.data?.message || "Error al enviar el código");
    } finally { setCargando(false); }
  };

  const verificarCodigo = async () => {
    if (codigo.length !== 6) return setError("Ingresa el código completo");
    setCargando(true); setError("");
    try {
      await api.post("/auth/verificar-recuperacion", { email, codigo });
      setMensaje("Código correcto, ahora pon tu nueva contraseña");
      setPaso(3);
    } catch (err) {
      setError(err.response?.data?.message || "Código incorrecto");
      setDigits(["","","","","",""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally { setCargando(false); }
  };

  const resetearContrasena = async () => {
    if (!nuevaContrasena) return setError("Ingresa tu nueva contraseña");
    if (nuevaContrasena.length < 6) return setError("Mínimo 6 caracteres");
    setCargando(true); setError("");
    try {
      await api.post("/auth/resetear-contrasena", { email, codigo, nuevaContrasena });
      setMensaje("¡Contraseña actualizada! Redirigiendo...");
      setTimeout(() => navigate("/login"), 2200);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cambiar la contraseña");
    } finally { setCargando(false); }
  };

  /* ── Indicador de pasos ── */
  const pasos = ["Correo", "Código", "Nueva clave"];

  return (
    <div className="rc-wrap">
      {/* Partículas */}
      <div className="rc-particles">
        {[...Array(7)].map((_,i) => <div key={i} className="rc-p" />)}
      </div>
      <div className="rc-orb rc-orb-1" />
      <div className="rc-orb rc-orb-2" />

      <div className="rc-card">

        {/* Logo */}
        <div className="rc-logo">
          <div className="rc-logo-icon">
            <svg className="rc-logo-svg" viewBox="0 0 24 24">
              <circle cx="5.5" cy="17.5" r="2.5"/>
              <circle cx="18.5" cy="17.5" r="2.5"/>
              <path d="M3 5h11l2 7H5L3 5z"/>
              <path d="M15 12h4l2 5"/>
            </svg>
          </div>
          <span className="rc-logo-text">Favorcito</span>
        </div>

        {/* Stepper */}
        <div className="rc-stepper">
          {pasos.map((label, i) => (
            <div key={i} className="rc-step-wrap">
              <div className={`rc-step-circle ${paso === i+1 ? "rc-step--active" : paso > i+1 ? "rc-step--done" : ""}`}>
                {paso > i+1 ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : i+1}
              </div>
              <span className={`rc-step-label ${paso === i+1 ? "rc-step-label--active" : paso > i+1 ? "rc-step-label--done" : ""}`}>
                {label}
              </span>
              {i < pasos.length - 1 && (
                <div className={`rc-step-line ${paso > i+1 ? "rc-step-line--done" : ""}`} />
              )}
            </div>
          ))}
        </div>

        {/* Mensajes */}
        {mensaje && (
          <div className="rc-msg-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
            {mensaje}
          </div>
        )}
        {error && (
          <div className="rc-msg-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* ── PASO 1: Email ── */}
        {paso === 1 && (
          <div className="rc-section">
            <div className="rc-section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 className="rc-title">Recuperar contraseña</h2>
            <p className="rc-subtitle">Ingresa tu correo y te enviamos un código de verificación</p>

            <div className="rc-field">
              <label className="rc-label">Correo electrónico</label>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && solicitarCodigo()}
                className="rc-input"
                placeholder="tu@email.com"
              />
            </div>

            <button onClick={solicitarCodigo} disabled={cargando} className="rc-btn">
              {cargando ? "Enviando..." : "Enviar código"}
            </button>
          </div>
        )}

        {/* ── PASO 2: Código OTP ── */}
        {paso === 2 && (
          <div className="rc-section">
            <div className="rc-section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <h2 className="rc-title">Verifica tu identidad</h2>
            <p className="rc-subtitle">
              Código enviado a <span className="rc-email-highlight">{email}</span>
            </p>

            <div className="rc-otp-group" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text" inputMode="numeric" maxLength={1} value={d}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={`rc-otp-input ${d ? "rc-otp-filled" : ""} ${error ? "rc-otp-error" : ""}`}
                />
              ))}
            </div>

            {/* Progress dots */}
            <div className="rc-dots">
              {digits.map((d,i) => <div key={i} className={`rc-dot ${d ? "rc-dot-filled" : ""}`}/>)}
            </div>

            <button onClick={verificarCodigo} disabled={cargando || codigo.length !== 6} className="rc-btn">
              {cargando ? "Verificando..." : "Verificar código"}
            </button>
          </div>
        )}

        {/* ── PASO 3: Nueva contraseña ── */}
        {paso === 3 && (
          <div className="rc-section">
            <div className="rc-section-icon rc-section-icon--green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h2 className="rc-title">Nueva contraseña</h2>
            <p className="rc-subtitle">Elige una contraseña segura de mínimo 6 caracteres</p>

            <div className="rc-field">
              <label className="rc-label">Nueva contraseña</label>
              <div className="rc-input-wrap">
                <input
                  type={verContrasena ? "text" : "password"}
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && resetearContrasena()}
                  className="rc-input rc-input--pr"
                  placeholder="Mínimo 6 caracteres"
                />
                <button type="button" onClick={() => setVerContrasena(!verContrasena)} className="rc-pw-toggle">
                  {verContrasena ? (
                    <svg className="rc-toggle-svg" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg className="rc-toggle-svg" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {/* Barra de fortaleza */}
              {nuevaContrasena.length > 0 && (
                <div className="rc-strength">
                  <div className="rc-strength-bars">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`rc-strength-bar ${
                        nuevaContrasena.length >= (i+1)*2
                          ? nuevaContrasena.length < 6 ? "rc-bar-weak"
                          : nuevaContrasena.length < 10 ? "rc-bar-medium"
                          : "rc-bar-strong"
                          : ""
                      }`}/>
                    ))}
                  </div>
                  <span className={`rc-strength-label ${
                    nuevaContrasena.length < 6 ? "rc-label-weak"
                    : nuevaContrasena.length < 10 ? "rc-label-medium"
                    : "rc-label-strong"
                  }`}>
                    {nuevaContrasena.length < 6 ? "Débil" : nuevaContrasena.length < 10 ? "Media" : "Fuerte"}
                  </span>
                </div>
              )}
            </div>

            <button onClick={resetearContrasena} disabled={cargando} className="rc-btn">
              {cargando ? "Guardando..." : "Cambiar contraseña"}
            </button>
          </div>
        )}

        {/* Volver */}
        <button onClick={() => navigate("/login")} className="rc-back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver al login
        </button>

      </div>
    </div>
  );
}