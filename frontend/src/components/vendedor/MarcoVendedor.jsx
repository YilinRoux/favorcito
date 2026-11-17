import { useEffect, useState } from "react";
import hojas from "../../assets/dashboard/hojas-dashboard.png";
import "../../styles/vendedor/DashboardVendedor.css";
import "../../styles/vendedor/MarcoVendedor.css";

export default function MarcoVendedor({ children, titulo, descripcion, independiente = false, className = "" }) {
  const [tema, setTema] = useState(() => localStorage.getItem("favorcito-tema") || "claro");
  useEffect(() => {
    const sincronizar = () => setTema(localStorage.getItem("favorcito-tema") || "claro");
    window.addEventListener("favorcito-theme-change", sincronizar);
    window.addEventListener("storage", sincronizar);
    return () => {
      window.removeEventListener("favorcito-theme-change", sincronizar);
      window.removeEventListener("storage", sincronizar);
    };
  }, []);
  const cambiarTema = () => {
    const siguiente = tema === "claro" ? "oscuro" : "claro";
    setTema(siguiente);
    localStorage.setItem("favorcito-tema", siguiente);
    window.dispatchEvent(new Event("favorcito-theme-change"));
  };
  return (
    <main className={`dv-wrap dv-theme-${tema} vs-page ${independiente ? "vs-independent" : ""} ${className}`}>
      <svg className="dv-waves" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
        <path className="dv-wv-soft" d="M0 130C190 40 400 40 610 118C800 188 1010 230 1200 205C1300 192 1380 170 1440 140V320H0Z" />
        <path className="dv-wv-navy" d="M330 320C470 215 640 190 820 235C960 270 1090 275 1215 245C1300 225 1370 255 1440 285V320Z" />
        <path className="dv-wv-orange" d="M820 320C1010 250 1200 215 1440 150V320H0Z" />
      </svg>
      <img className="dv-leaf dv-leaf--page" src={hojas} alt="" aria-hidden="true" />
      <div className="vs-container">
        <header className="vs-header">
          <div><span className="dv-eyebrow">Favorcito · Vendedor</span><h1>{titulo}</h1><p>{descripcion}</p></div>
          <button type="button" className="vs-theme" onClick={cambiarTema} aria-label={tema === "claro" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}>{tema === "claro" ? "Modo oscuro" : "Modo claro"}</button>
        </header>
        {children}
      </div>
    </main>
  );
}
