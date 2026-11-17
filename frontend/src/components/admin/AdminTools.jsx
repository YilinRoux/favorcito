/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";

export function AdminError({ mensaje }) {
  return <div className="ad-error" role="alert"><h2>No pudimos cargar esta información</h2><p>{mensaje}</p><button type="button" onClick={() => window.location.reload()}>Volver a intentar</button></div>;
}

export function useAdminList(items, texto, contexto = "") {
  const [busqueda, setBusqueda] = useState("");
  const [posicion, setPosicion] = useState({ clave: "", pagina: 1 });
  const normalizar = (valor) => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const resultados = items.filter((item) => normalizar(texto(item)).includes(normalizar(busqueda.trim())));
  const clave = `${contexto}:${busqueda}`;
  const paginas = Math.max(1, Math.ceil(resultados.length / 10));
  const pagina = Math.min(posicion.clave === clave ? posicion.pagina : 1, paginas);
  const controles = <div className="ad-list-tools"><label>Buscar en esta lista<input type="search" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPosicion({ clave: "", pagina: 1 }); }} placeholder="Nombre, correo o detalle…" /></label><p role="status">{resultados.length} resultado{resultados.length === 1 ? "" : "s"}</p></div>;
  const paginacion = resultados.length > 10 && <nav className="ad-pagination" aria-label="Paginación de resultados"><button disabled={pagina === 1} onClick={() => setPosicion({ clave, pagina: pagina - 1 })}>Anterior</button><span>Página {pagina} de {paginas}</span><button disabled={pagina === paginas} onClick={() => setPosicion({ clave, pagina: pagina + 1 })}>Siguiente</button></nav>;
  return { visibles: resultados.slice((pagina - 1) * 10, pagina * 10), controles, paginacion };
}
