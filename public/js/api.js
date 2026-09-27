export const getBuyers = () => fetch("/api/buyers");

export const getPOs = () => fetch("/api/data");

export const getStats = () => fetch("/api/stats");

export const createPO = (payload) =>
  fetch("/api/po", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const updatePO = (id, payload) =>
  fetch(`/api/po/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const updatePOStatus = (id, payload) =>
  fetch(`/api/po/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const updateColorPlacement = (payload) =>
  fetch("/api/color-placement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const updateBuyerLogo = (payload) =>
  fetch("/api/buyers/logo", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const removePO = (id) => fetch(`/api/po/${id}`, { method: "DELETE" });

export const loginUser = (payload) =>
  fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const getUsers = () => fetch("/api/users");

export const createUser = (payload) =>
  fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const updateUser = (id, payload) =>
  fetch(`/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const removeUser = (id) =>
  fetch(`/api/users/${id}`, { method: "DELETE" });
