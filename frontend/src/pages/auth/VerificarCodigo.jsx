import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../../services/api";
import MarcoAuth from "../../components/auth/MarcoAuth";
import "../../styles/auth/VerificarCodigo.css";

function VerificarCodigo() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState(location.state?.mensaje || "");
  const [verificado, setVerificado] = useState(false);
  const [timer, setTimer] = useState(60);
  const [puedeReenviar, setPuedeReenviar] = useState(false);
  const [tema, setTema] = useState(() => localStorage.getItem("favorcito-tema") || "claro");

  const aplicarTema = (nuevo) => {
    setTema(nuevo);
    localStorage.setItem("favorcito-tema", nuevo);
  };

  const inputRefs = useRef([]);
  const codigo = digits.join("");

  useEffect(() => {
    if (location.state?.email) setEmail(location.state.email);
    if (location.state?.mensaje) setMensaje(location.state.mensaje);
  }, [location.state]);

  useEffect(() => {
    if (timer === 0) {
      setPuedeReenviar(true);
      return;
    }
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigit = (index, value) => {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    if (v && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
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

  const handleVerificar = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);

    if (!email.trim()) {
      setError("Escribe tu correo antes de verificar");
      setCargando(false);
      return;
    }
    if (codigo.length !== 6) {
      setError("Debes ingresar los 6 dígitos del código");
      setCargando(false);
      return;
    }

    try {
      await api.post("/auth/verificar-codigo", { email: email.trim(), codigo });
      setVerificado(true);
      setMensaje("¡Cuenta verificada exitosamente!");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.mensaje || "Código inválido o expirado");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setCargando(false);
    }
  };

  const reenviarCodigo = async () => {
    setError("");
    setMensaje("");
    setCargando(true);
    if (!email.trim()) {
      setError("Escribe tu correo antes de reenviar el código");
      setCargando(false);
      return;
    }
    try {
      await api.post("/auth/reenviar-codigo", { email: email.trim() });
      setMensaje("Código reenviado a tu correo");
      setPuedeReenviar(false);
      setTimer(60);
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch {
      setError("Error al reenviar el código");
    } finally {
      setCargando(false);
    }
  };

  return (
    <MarcoAuth
      tema={tema}
      aplicarTema={aplicarTema}
      titulo={<>Un último paso<br />para entrar a <em>Favorcito</em></>}
      descripcion="Verifica tu correo para proteger tu cuenta y mantener seguros tus pedidos."
    >
      {verificado ? (
        <div className="vc-success">
          <span className="vc-success-icon">✓</span>
          <h2 className="rg-title">¡Cuenta verificada!</h2>
          <p>Todo listo. Te llevamos al inicio de sesión.</p>
          <div className="vc-progress"><span /></div>
        </div>
      ) : (
        <>
          <h2 className="rg-title">Verifica tu cuenta</h2>

          {error && <div className="vc-message vc-message-error">{error}</div>}
          {mensaje && <div className="vc-message vc-message-ok">{mensaje}</div>}

          <form className="vc-form" onSubmit={handleVerificar}>
            <div className="rg-input-wrap">
              <svg className="rg-field-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/></svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rg-input rg-input--icon"
                placeholder="Correo electrónico"
              />
            </div>

            <p className="vc-copy">Ingresa el código de 6 dígitos que enviamos a tu correo.</p>

            <div className="vc-otp" onPaste={handlePaste}>
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
                  className="vc-otp-input"
                  aria-label={`Dígito ${i + 1}`}
                />
              ))}
            </div>

            <div className="vc-resend">
              {puedeReenviar ? (
                <button type="button" onClick={reenviarCodigo} disabled={cargando}>Reenviar código</button>
              ) : (
                <span>Podrás reenviar en <strong>{timer}s</strong></span>
              )}
            </div>

            <button type="submit" disabled={cargando || codigo.length !== 6} className="rg-btn">
              {cargando ? "Verificando..." : "Verificar cuenta"}
            </button>

            <p className="rg-footer">
              <Link to="/login" className="rg-link">← Volver al login</Link>
            </p>
          </form>
        </>
      )}
    </MarcoAuth>
  );
}

export default VerificarCodigo;
