import { useEffect, useState } from "react";

function ImageWithFallback({ src, alt = "", className = "", ...props }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`${className} image-fallback`.trim()}
        role="img"
        aria-label={alt || "Imagen no disponible"}
        {...props}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9" r="1.5" />
          <path d="m4 17 4.5-4.5 3 3 2-2L20 17" />
        </svg>
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} {...props} />;
}

export default ImageWithFallback;
