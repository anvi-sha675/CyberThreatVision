import axios from "axios";
import { useAuthStore } from "../store/index.js";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ML_URL = import.meta.env.VITE_ML_URL || "http://localhost:5001";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

// ML service client
const mlApi = axios.create({
  baseURL: ML_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

export const authAPI = {
  login: (d) => api.post("/auth/login", d),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
  getTimeline: () => api.get("/dashboard/timeline"),
  getTopThreats: () => api.get("/dashboard/top-threats"),
};

export const scanAPI = {
  url: (url) => api.post("/scan/url", { url }),
  ip: (ip) => api.post("/scan/ip", { ip }),
  hash: (hash) => api.post("/scan/hash", { hash }),
  bulk: (targets) => api.post("/scan/bulk", { targets }),
  history: (p = {}) => api.get("/scan/history", { params: p }),
};

export const datasetAPI = {
  getIPs: (p = {}) => api.get("/datasets/ips", { params: p }),
  getPhishing: (p = {}) => api.get("/datasets/phishing", { params: p }),
  getMalware: (p = {}) => api.get("/datasets/malware", { params: p }),
  getGeo: () => api.get("/datasets/geo"),
  getStats: () => api.get("/datasets/stats"),
};

export const alertAPI = {
  list: (p = {}) => api.get("/alerts", { params: p }),
  stats: () => api.get("/alerts/stats"),
  create: (d) => api.post("/alerts", d),
  update: (id, d) => api.patch(`/alerts/${id}/status`, d),
};

export const threatAPI = {
  list: (p = {}) => api.get("/threats", { params: p }),
  feed: () => api.get("/threats/live"),
};

export const logsAPI = {
  activity: (p = {}) => api.get("/logs/activity", { params: p }),
  scans: (p = {}) => api.get("/logs/scans", { params: p }),
};

export const adminAPI = {
  health: () => api.get("/admin/health"),
  users: () => api.get("/admin/users"),
  tables: () => api.get("/admin/tables"),
};

export const networkAPI = {
  stats: () => api.get("/network/stats"),
};

// ML direct calls (optional — falls back if unavailable)
export const mlDirectAPI = {
  health: () => mlApi.get("/health"),
  analyzeURL: (url) => mlApi.post("/analyze/url", { url }),
  analyzeIP: (ip) => mlApi.post("/analyze/ip", { ip }),
  analyzeHash: (hash) => mlApi.post("/analyze/hash", { hash }),
  getStats: () => mlApi.get("/stats/summary"),
};

export default api;
