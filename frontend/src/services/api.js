import axios from "axios";
import { getApiBaseUrl } from "../utils/runtimeUrls";

const BASE_URL = getApiBaseUrl().replace(/\/$/, "");

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
