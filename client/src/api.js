import axios from "axios";
import { clearSession } from "./utils/auth";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, "")}/api`
    : "http://localhost:5000/api",
  timeout: 30000,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// A 401 on any call except login/register means the token is expired, revoked (password
// changed elsewhere) or the account is gone. Clear it and go to /login instead of
// leaving the user on a half-broken page.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    if (
      error.response?.status === 401 &&
      !url.startsWith("/auth/") &&
      localStorage.getItem("token")
    ) {
      clearSession();
      if (window.location.pathname !== "/login")
        window.location.replace("/login");
    }
    return Promise.reject(error);
  },
);

export default API;
