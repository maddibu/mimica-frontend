// src/api.js
const BASE_URL = import.meta.env.VITE_API_URL;
console.log("BASE_URL:", BASE_URL);
console.log("api.js version 2");

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || data.message || "Error en la petición");
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────
export const login = (email, contrasena) =>
  apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, contrasena }),
  });

export const register = async (nombre, email, contrasena) => {
  await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ nombre, email, contrasena }),
  });
  // login automático después del registro
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, contrasena }),
  });
};

// ── Documentos ────────────────────────────────────────
export const listarDocumentos = () => apiFetch("/api/documentos");

export const subirDocumento = (nombre, tipo, ruta_archivo) =>
  apiFetch("/api/documentos", {
    method: "POST",
    body: JSON.stringify({ nombre, tipo, ruta_archivo }),
  });

export const eliminarDocumento = (id) =>
  apiFetch(`/api/documentos/${id}`, { method: "DELETE" });

// ── Mapeos ────────────────────────────────────────────
export const obtenerMapeos = (perfil_id) =>
  apiFetch(`/api/mapeos?perfil_id=${perfil_id}`);

// ── Perfiles ──────────────────────────────────────────
export const obtenerPerfiles = () => apiFetch("/api/perfiles");
