import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import MarcoAuth from "../../components/auth/MarcoAuth";
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
  const [tema, setTema] = useState(() => localStorage.getItem("favorcito-tema") || "claro");

  const aplicarTema = (nuevo) => {
    setTema(nuevo);
    localStorage.setItem("favorcito-tema", nuevo);
  };

  const inputRefs = useRef([]);
  const codigo = digits.join("");

  useEffect(() => {
    if (paso === 2) setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [paso]);

  const handleDigit = (index, value) => {
    const v = value.replace(/\D/g,"").slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    if (v && index < 5) inputRefs.current[index+1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) inputRefs.current[index-1]?.focus();
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index-1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index+1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const solicitarCodigo = async () => {
    if (!email) return setError("Ingresa tu correo");
    setCargando(true);
    setError("");
    try {
      await api.post("/auth/recuperar-contrasena", { email });
      setMensaje("Código enviado a tu correo");
      setPaso(2);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.message || err.message || "Error al enviar el código");
    } finally {
      setCargando(false);
    }
  };

  const verificarCodigo = async () => {
    if (codigo.length !== 6) return setError("Ingresa el código completo");
    setCargando(true);
    setError("");
    try {
      await api.post("/auth/verificar-recuperacion", { email, codigo });
      setMensaje("Código correcto. Ahora crea tu nueva contraseña.");
      setPaso(3);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.message || err.message || "Código incorrecto");
      setDigits(["","","","","",""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setCargando(false);
    }
  };

  const resetearContrasena = async () => {
    if (!nuevaContrasena) return setError("Ingresa tu nueva contraseña");
    if (nuevaContrasena.length < 6) return setError("Mínimo 6 caracteres");
    setCargando(true);
    setError("");
    try {
      await api.post("/auth/resetear-contrasena", { email, codigo, nuevaContrasena });
      setMensaje("¡Contraseña actualizada! Redirigiendo...");
      setTimeout(() => navigate("/login"), 2200);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.message || err.message || "Error al cambiar la contraseña");
    } finally {
      setCargando(false);
    }
  };

  const pasos = ["Correo", "Código", "Nueva clave"];

  return (
    <MarcoAuth
      tema={tema}
      aplicarTema={aplicarTema}
      titulo={<>Recupera tu <em>acceso</em><br />sin complicarte</>}
      descripcion="Te acompañamos paso a paso para volver a entrar a Favorcito de forma segura."
    >
      <h2 className="rg-title">Recuperar contraseña</h2>

      <div className="rc-stepper">
        {pasos.map((label, i) => (
          <div key={label} className="rc-step">
            <span className={`rc-step-dot ${paso === i + 1 ? "is-active" : ""} ${paso > i + 1 ? "is-done" : ""}`}>
              {paso > i + 1 ? "✓" : i + 1}
            </span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {mensaje && <div className="rc-message rc-message-ok">{mensaje}</div>}
      {error && <div className="rc-message rc-message-error">{error}</div>}

      {paso === 1 && (
        <div className="rc-section">
          <p className="rc-copy">Escribe el correo asociado a tu cuenta y te enviaremos un código.</p>
          <div className="rg-input-wrap">
            <svg className="rg-field-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/></svg>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && solicitarCodigo()}
              className="rg-input rg-input--icon"
              placeholder="Correo electrónico"
            />
          </div>
          <button onClick={solicitarCodigo} disabled={cargando} className="rg-btn">
            {cargando ? "Enviando..." : "Enviar código"}
          </button>
        </div>
      )}

      {paso === 2 && (
        <div className="rc-section">
          <p className="rc-copy">Código enviado a <strong>{email}</strong></p>
          <div className="rc-otp" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="rc-otp-input"
                aria-label={`Dígito ${i + 1}`}
              />
            ))}
          </div>
          <button onClick={verificarCodigo} disabled={cargando || codigo.length !== 6} className="rg-btn">
            {cargando ? "Verificando..." : "Verificar código"}
          </button>
        </div>
      )}

      {paso === 3 && (
        <div className="rc-section">
          <p className="rc-copy">Elige una contraseña nueva de mínimo 6 caracteres.</p>
          <div className="rg-input-wrap">
            <svg className="rg-field-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>
            <input
              type={verContrasena ? "text" : "password"}
              value={nuevaContrasena}
              onChange={(e) => setNuevaContrasena(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && resetearContrasena()}
              className="rg-input rg-input--icon rg-input--pr"
              placeholder="Nueva contraseña"
            />
            <button type="button" onClick={() => setVerContrasena(!verContrasena)} className="rg-pw-toggle" aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}>
              <svg className="rg-pw-toggle-svg" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          {nuevaContrasena.length > 0 && (
            <div className="rc-strength">
              <span style={{width: `${Math.min(100, nuevaContrasena.length * 10)}%`}} />
            </div>
          )}
          <button onClick={resetearContrasena} disabled={cargando} className="rg-btn">
            {cargando ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </div>
      )}

      <button type="button" onClick={() => navigate("/login")} className="rc-back">← Volver al login</button>
    </MarcoAuth>
  );
}
