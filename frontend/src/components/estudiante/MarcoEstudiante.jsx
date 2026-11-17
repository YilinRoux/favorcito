import { useEffect, useState } from "react";
import hojas from "../../assets/dashboard/hojas-dashboard.png";
import "../../styles/estudiante/PaletaEstudiante.css";
import "../../styles/estudiante/EstructuraEstudiante.css";

export default function MarcoEstudiante({ children }) {
  const [tema, setTema] = useState(() => localStorage.getItem("favorcito-tema") || "claro");
  useEffect(() => {
    const sincronizar = () => setTema(localStorage.getItem("favorcito-tema") || "claro");
    window.addEventListener("storage", sincronizar);
    window.addEventListener("favorcito-theme-change", sincronizar);
    return () => { window.removeEventListener("storage", sincronizar); window.removeEventListener("favorcito-theme-change", sincronizar); };
  }, []);
  const cambiarTema = () => {
    const nuevo = tema === "claro" ? "oscuro" : "claro";
    setTema(nuevo); localStorage.setItem("favorcito-tema", nuevo);
    window.dispatchEvent(new Event("favorcito-theme-change"));
  };
  return <div className={`st-shell st-${tema}`}>
    <svg className="st-waves" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
      <path className="st-wave-soft" d="M0 130C190 40 400 40 610 118C800 188 1010 230 1200 205C1300 192 1380 170 1440 140V320H0Z" />
      <path className="st-wave-navy" d="M330 320C470 215 640 190 820 235C960 270 1090 275 1215 245C1300 225 1370 255 1440 285V320Z" />
      <path className="st-wave-orange" d="M820 320C1010 250 1200 215 1440 150V320H0Z" />
    </svg>
    <img className="st-leaf" src={hojas} alt="" aria-hidden="true" />
    <div className="st-toolbar"><button type="button" onClick={cambiarTema} aria-label={tema === "claro" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}>{tema === "claro" ? "Modo oscuro" : "Modo claro"}</button></div>
    <div className="st-content">{children}</div>
  </div>;
}
