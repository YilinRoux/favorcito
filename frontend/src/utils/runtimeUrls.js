const isLocalhost = (hostname) => hostname === "localhost" || hostname === "127.0.0.1";

export const getApiBaseUrl = () => {
  if (typeof window === "undefined") return "http://localhost:5000";

  return isLocalhost(window.location.hostname) ? "http://localhost:5000" : "";
};

export const getSocketBaseUrl = () => {
  if (typeof window === "undefined") return "http://localhost:5000";

  return isLocalhost(window.location.hostname)
    ? "http://localhost:5000"
    : window.location.origin;
};

export const getAssetBaseUrl = () => {
  if (typeof window === "undefined") return "http://localhost:5000";

  return isLocalhost(window.location.hostname)
    ? "http://localhost:5000"
    : window.location.origin;
};
