import { Link } from "react-router-dom";
import tacosLogin from "../../assets/login/tacos-login.png";
import logoClaro from "../../assets/login/login-light-bg.png";
import logoOscuro from "../../assets/login/login-dark-bg.png";
import hojasLogin from "../../assets/login/hojas-login.png";
import "../../styles/auth/Registro.css";

/* Marco de pantallas de acceso: mismo fondo, encabezado y decoración que el login */
export default function MarcoAuth({ tema, aplicarTema, titulo, descripcion, children }) {
  return (
    <div className={`rg-wrap rg-theme-${tema}`}>
      <svg className="rg-swoosh-top" viewBox="0 0 300 300" aria-hidden="true">
        <path className="rg-sw-soft" d="M0 0H250C190 40 120 100 80 175C55 220 25 255 0 285Z" />
        <path className="rg-sw-orange" d="M0 150C40 105 105 55 215 12C140 62 88 112 52 190C32 232 14 262 0 280Z" />
      </svg>
      <svg className="rg-waves" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
        <path className="rg-wv-soft" d="M0 130C190 40 400 40 610 118C800 188 1010 230 1200 205C1300 192 1380 170 1440 140V320H0Z" />
        <path className="rg-wv-navy" d="M330 320C470 215 640 190 820 235C960 270 1090 275 1215 245C1300 225 1370 255 1440 285V320Z" />
        <path className="rg-wv-orange" d="M820 320C1010 250 1200 215 1440 150V320Z" />
      </svg>
      <img className="rg-leaves rg-leaves-left" src={hojasLogin} alt="" aria-hidden="true" />
      <img className="rg-leaves rg-leaves-right" src={hojasLogin} alt="" aria-hidden="true" />
      <img className="rg-tacos" src={tacosLogin} alt="" aria-hidden="true" />

      <div className="rg-page">
        <header className="rg-top">
          <Link to="/" className="rg-brand" aria-label="Favorcito, ir al inicio">
            <img
              className="rg-brand-logo"
              src={tema === "claro" ? logoClaro : logoOscuro}
              alt=""
              aria-hidden="true"
            />
            <span className="rg-brand-name">Favorcito</span>
          </Link>

          <nav className="rg-nav" aria-label="Principal">
            <Link to="/" className="rg-nav-active">Inicio</Link>
            <span className="rg-nav-link">Acerca de</span>
          </nav>

          <div className="rg-toggle" role="group" aria-label="Tema de la página">
            <button
              type="button"
              className={`rg-toggle-opt${tema === "claro" ? " is-on" : ""}`}
              aria-pressed={tema === "claro"}
              aria-label="Modo claro"
              onClick={() => aplicarTema("claro")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41" /></svg>
            </button>
            <button
              type="button"
              className={`rg-toggle-opt${tema === "oscuro" ? " is-on" : ""}`}
              aria-pressed={tema === "oscuro"}
              aria-label="Modo oscuro"
              onClick={() => aplicarTema("oscuro")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8Z" /></svg>
            </button>
          </div>
        </header>

        <main className="rg-main">
          <section className="rg-hero">
            <h1>{titulo}</h1>
            <p>{descripcion}</p>
          </section>

          <div className="rg-card">{children}</div>
        </main>
      </div>
    </div>
  );
}
