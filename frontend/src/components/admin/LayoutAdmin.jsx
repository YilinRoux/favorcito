import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SidebarAdmin from "../layout/SidebarAdmin";
import "../../styles/estudiante/PaletaEstudiante.css";
import "../../styles/admin/PaletaAdmin.css";

export default function LayoutAdmin({ children }) {
  const [tema, setTema] = useState(() => localStorage.getItem("favorcito-tema") || "claro");
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    const cerrar = (event) => { if (event.key === "Escape") setMenu(false); };
    window.addEventListener("keydown", cerrar);
    return () => window.removeEventListener("keydown", cerrar);
  }, []);
  const cambiarTema = () => {
    const siguiente = tema === "claro" ? "oscuro" : "claro";
    setTema(siguiente);
    localStorage.setItem("favorcito-tema", siguiente);
    window.dispatchEvent(new Event("favorcito-theme-change"));
  };
  return <div className={`st-shell ad-shell st-${tema}`}>
    <a href="#admin-contenido" className="ad-skip">Ir al contenido</a>
    <svg className="st-waves" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
      <path className="st-wave-soft" d="M0 130C190 40 400 40 610 118C800 188 1010 230 1200 205L1440 140V320H0Z" />
      <path className="st-wave-navy" d="M330 320C470 215 640 190 820 235C960 270 1090 275 1215 245L1440 285V320Z" />
      <path className="st-wave-orange" d="M820 320C1010 250 1200 215 1440 150V320Z" />
    </svg>
    <div className="ad-topbar">
      <button type="button" className="ad-menu-toggle" aria-expanded={menu} aria-controls="admin-navegacion" onClick={() => setMenu(!menu)}>{menu ? "Cerrar menú" : "☰ Menú"}</button>
      <Link to="/admin/dashboard">Administración</Link>
      <button type="button" onClick={cambiarTema} aria-label={`Cambiar a modo ${tema === "claro" ? "oscuro" : "claro"}`}>{tema === "claro" ? "Modo oscuro" : "Modo claro"}</button>
    </div>
    <div id="admin-navegacion" className={menu ? "ad-sidebar ad-sidebar--open" : "ad-sidebar"} key={pathname} onClick={(event) => { if (event.target.closest("a,button")) setMenu(false); }}><SidebarAdmin /></div>
    {menu && <button className="ad-menu-backdrop" aria-label="Cerrar navegación" onClick={() => setMenu(false)} />}
    <main id="admin-contenido" className="ad-main">{children}</main>
  </div>;
}
