/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../../services/api";

function VerificarCodigo() {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email || "";

  const handleVerificar = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);

    if (!codigo.trim()) {
      setError("Debes ingresar el código de verificación");
      setCargando(false);
      return;
    }

    if (codigo.length !== 6) {
      setError("El código debe tener 6 dígitos");
      setCargando(false);
      return;
    }

    try {
      await api.post("/auth/verificar-codigo", {
        email,
        codigo
      });

      setMensaje("¡Cuenta verificada exitosamente!");
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.mensaje || "Código inválido o expirado");
    } finally {
      setCargando(false);
    }
  };

  const reenviarCodigo = async () => {
    setError("");
    setMensaje("");
    setCargando(true);

    try {
      await api.post("/auth/reenviar-codigo", { email });
      setMensaje("Código reenviado a tu correo");
    } catch (err) {
      setError("Error al reenviar el código");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Verificar Código</h2>
          <p className="text-gray-600 mt-2">
            Hemos enviado un código de verificación a:
          </p>
          <p className="font-semibold text-blue-600 mt-1">{email}</p>
        </div>

        <form onSubmit={handleVerificar}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {mensaje && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{mensaje}</span>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Código de verificación
            </label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg text-center text-3xl tracking-[0.5em] font-bold focus:border-blue-500 focus:outline-none transition"
              placeholder="000000"
            />
            <p className="text-sm text-gray-500 mt-2 text-center">
              ⏱️ El código expira en 10 minutos
            </p>
          </div>

          <button
            type="submit"
            disabled={cargando || codigo.length !== 6}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition duration-200 shadow-lg"
          >
            {cargando ? "Verificando..." : "Verificar Cuenta"}
          </button>

          <button
            type="button"
            onClick={reenviarCodigo}
            disabled={cargando}
            className="w-full mt-3 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition duration-200"
          >
            {cargando ? "Reenviando..." : "Reenviar código"}
          </button>

          <p className="mt-6 text-center text-gray-600">
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Volver al login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default VerificarCodigo;