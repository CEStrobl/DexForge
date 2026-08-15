const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_BASE_URL = BASE_URL;

let authToken = null;

// Called by AuthContext whenever the Supabase session changes, so every request below
// picks up the current access token without each call site having to know about auth.
export function setAuthToken(token) {
  authToken = token;
}

async function request(path, options) {
  const headers = { ...options?.headers };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const detail = await res
      .clone()
      .json()
      .then((body) => body?.detail)
      .catch(() => null);
    throw new Error(detail || `API request failed: ${res.status} ${path}`);
  }
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  put: (path, body) =>
    request(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
