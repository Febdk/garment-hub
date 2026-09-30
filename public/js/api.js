// ── API Client dengan JWT Authorization Header ─────────────────────
// Ganti URL di bawah ini dengan Domain Railway Backend kamu
const API_BASE_URL = "https://garment-hub-production-c0a6.up.railway.app";

function getAuthHeaders() {
  const token = localStorage.getItem("gcwh_token");
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Wrapper fetch yang otomatis handle 401/403 (token expired/invalid)
async function authFetch(url, options = {}) {
  if (!options.headers) {
    options.headers = getAuthHeaders();
  }
  const res = await fetch(`${API_BASE_URL}${url}`, options);

  // Jika token expired/invalid, redirect ke login
  if (res.status === 401 || res.status === 403) {
    const data = await res.json().catch(() => ({}));
    // Jangan redirect jika ini adalah login request itu sendiri
    if (!url.includes("/api/login")) {
      localStorage.removeItem("gcwh_token");
      localStorage.removeItem("gcwh_user");
      window.dispatchEvent(
        new CustomEvent("gcwh-session-expired", { detail: data.error }),
      );
    }
  }

  return res;
}

export const getBuyers = () => fetch(`${API_BASE_URL}/api/buyers`);

export const getPOs = () => authFetch("/api/data");

export const getStats = () => authFetch("/api/stats");

export const createPO = (payload) =>
  authFetch("/api/po", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

export const updatePO = (id, payload) =>
  authFetch(`/api/po/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

export const updatePOStatus = (id, payload) =>
  authFetch(`/api/po/${id}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

export const updateColorPlacement = (payload) =>
  authFetch("/api/color-placement", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

export const updateBuyerLogo = (payload) =>
  authFetch("/api/buyers/logo", {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

export const removePO = (id) =>
  authFetch(`/api/po/${id}`, { method: "DELETE", headers: getAuthHeaders() });

export const loginUser = (payload) =>
  fetch(`${API_BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const getUsers = () =>
  authFetch("/api/users", { headers: getAuthHeaders() });

export const createUser = (payload) =>
  authFetch("/api/users", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

export const updateUser = (id, payload) =>
  authFetch(`/api/users/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

export const removeUser = (id) =>
  authFetch(`/api/users/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

export const verifyToken = () =>
  authFetch("/api/verify-token", { headers: getAuthHeaders() });

export const getLogs = () =>
  authFetch("/api/audit-logs", { headers: getAuthHeaders() });
