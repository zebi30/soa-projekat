// Thin fetch wrapper around the API gateway. The base URL can be overridden at
// build time via VITE_API_BASE, or at runtime via the "API base" field (stored
// in localStorage) — mirroring the original test frontend.
const DEFAULT_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

const BASE_KEY = "soa_base";
const TOKEN_KEY = "soa_token";
const USER_KEY = "soa_user";

export function getBase() {
  return localStorage.getItem(BASE_KEY) || DEFAULT_BASE;
}

export function setBase(value) {
  if (value) localStorage.setItem(BASE_KEY, value);
  else localStorage.removeItem(BASE_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function api(method, path, body) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;

  const options = { method, headers };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(getBase() + path, options);
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { ok: response.ok, status: response.status, data };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      data: { message: "Network / gateway unavailable: " + e.message },
    };
  }
}
