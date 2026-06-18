import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

export default api;

export function extractError(err, fallback = "Something went wrong") {
  if (!err) return fallback;
  const data = err?.response?.data;
  if (!data) return err.message || fallback;
  if (typeof data === "string") return data;
  if (data.detail && typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.errors) && data.errors.length) {
    return data.errors.map((e) => `${e.field ? e.field + ": " : ""}${e.message}`).join(", ");
  }
  if (data.detail && Array.isArray(data.detail)) {
    return data.detail.map((e) => e.msg || JSON.stringify(e)).join(", ");
  }
  return fallback;
}
