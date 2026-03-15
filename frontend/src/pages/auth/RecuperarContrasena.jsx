import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function RecuperarContrasena() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1); // 1=email, 2=código, 3=nueva contraseña
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const solicitarCodigo = async () => {
    if (!email) return setError("Ingresa tu correo");
    setCargando(true); setError("");
    try {
      await api.post("/auth/recuperar-contrasena", { email });
      setMensaje("Código enviado a tu correo");
      setPaso(2);
    } catch (err) {
      setError(err.response?.data?.message || "Error al enviar el código");
    } finally {
      setCargando(false);
    }
  };

  const verificarCodigo = async () => {
    if (!codigo) return setError("Ingresa el código");
    setCargando(true); setError("");
    try {
      await api.post("/auth/verificar-recuperacion", { email, codigo });
      setMensaje("Código correcto, ahora pon tu nueva contraseña");
      setPaso(3);
    } catch (err) {
      setError(err.response?.data?.message || "Código incorrecto");
    } finally {
      setCargando(false);
    }
  };

  const resetearContrasena = async () => {
    if (!nuevaContrasena) return setError("Ingresa tu nueva contraseña");
    if (nuevaContrasena.length < 6) return setError("Mínimo 6 caracteres");
    setCargando(true); setError("");
    try {
      await api.post("/auth/resetear-contrasena", { email, codigo, nuevaContrasena });
      setMensaje("¡Contraseña actualizada! Redirigiendo...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cambiar la contraseña");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 24 }}>
      <h2>Recuperar contraseña</h2>

      {mensaje && <p style={{ color: "green" }}>{mensaje}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {paso === 1 && (
        <>
          <p>Ingresa tu correo y te enviaremos un código</p>
          <input
            type="email" value={email} placeholder="Correo electrónico"
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 12 }}
          />
          <button onClick={solicitarCodigo} disabled={cargando} style={{ width: "100%", padding: 10 }}>
            {cargando ? "Enviando..." : "Enviar código"}
          </button>
        </>
      )}

      {paso === 2 && (
        <>
          <p>Ingresa el código de 6 dígitos que llegó a <strong>{email}</strong></p>
          <input
            type="text" value={codigo} placeholder="Código"
            maxLength={6} onChange={(e) => setCodigo(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 12, letterSpacing: 8, fontSize: 20, textAlign: "center" }}
          />
          <button onClick={verificarCodigo} disabled={cargando} style={{ width: "100%", padding: 10 }}>
            {cargando ? "Verificando..." : "Verificar código"}
          </button>
        </>
      )}

      {paso === 3 && (
        <>
          <p>Ingresa tu nueva contraseña</p>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <input
              type={verContrasena ? "text" : "password"}
              value={nuevaContrasena} placeholder="Nueva contraseña"
              onChange={(e) => setNuevaContrasena(e.target.value)}
              style={{ width: "100%", padding: 8, paddingRight: 36 }}
            />
            <span
              onClick={() => setVerContrasena(!verContrasena)}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}
            >
              {verContrasena ? "🙈" : "👁️"}
            </span>
          </div>
          <button onClick={resetearContrasena} disabled={cargando} style={{ width: "100%", padding: 10 }}>
            {cargando ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </>
      )}

      <p
        onClick={() => navigate("/login")}
        style={{ textAlign: "center", marginTop: 16, cursor: "pointer", color: "#6B7280" }}
      >
        ← Volver al login
      </p>
    </div>
  );
}