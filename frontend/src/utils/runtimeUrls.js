const getConfiguredBaseUrl = () =>
  import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "") || "";

const getDevBackendUrl = () => {
  if (typeof window === "undefined") return "http://localhost:5000";
  return `http://${window.location.hostname}:5000`;
};

export const getApiBaseUrl = () => {
  const configured = getConfiguredBaseUrl();
  if (configured) return configured;

  if (typeof window === "undefined") return "http://localhost:5000";

  return import.meta.env.DEV ? getDevBackendUrl() : "";
};

export const getSocketBaseUrl = () => {
  const configured = getConfiguredBaseUrl();
  if (configured) return configured;

  if (typeof window === "undefined") return "http://localhost:5000";

  return import.meta.env.DEV ? getDevBackendUrl() : window.location.origin;
};

export const getAssetBaseUrl = () => {
  const configured = getConfiguredBaseUrl();
  if (configured) return configured;

  if (typeof window === "undefined") return "http://localhost:5000";

  return import.meta.env.DEV ? getDevBackendUrl() : window.location.origin;
};
