import { useRef } from "react";
import ImageWithFallback from "../common/ImageWithFallback";

export default function ImagenPromocion({ src, alt, className = "" }) {
  const dialogo = useRef(null);
  return <div className="st-promo-image">
    <button type="button" className="st-promo-open" aria-label={`Ampliar ${alt}`} onClick={() => dialogo.current.showModal()}>
      <ImageWithFallback src={src} alt={alt} className={`st-promo-contained ${className}`} />
      <span className="st-promo-zoom">Ver imagen completa ↗</span>
    </button>
    <dialog ref={dialogo} className="st-promo-dialog" aria-label={alt} onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
      <div className="st-promo-dialog-head"><p>{alt}</p><button type="button" aria-label="Cerrar imagen ampliada" onClick={() => dialogo.current.close()}>Cerrar ✕</button></div>
      <ImageWithFallback src={src} alt={alt} className="st-promo-expanded" />
    </dialog>
  </div>;
}
