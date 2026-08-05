import axios from "axios";

const getDefaultBaseUrl = () => {
  if (typeof window === "undefined") return "http://localhost:5000";

  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:5000";
  }

  return "https://favorcito-full.onrender.com";
};

const rawBaseUrl = import.meta.env.VITE_API_URL || getDefaultBaseUrl();
const BASE_URL = rawBaseUrl.replace(/\/$/, "");

const api = axios.create({
  baseURL: BASE_URL ? `${BASE_URL}/api` : "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
