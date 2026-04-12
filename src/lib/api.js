const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

function toErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (payload.detail) return payload.detail;
  const firstKey = Object.keys(payload)[0];
  if (!firstKey) return fallback;
  const firstValue = payload[firstKey];
  if (Array.isArray(firstValue) && firstValue.length > 0) return String(firstValue[0]);
  if (typeof firstValue === 'string') return firstValue;
  return fallback;
}

export async function apiRequest(path, options = {}) {
  const { token, body, headers = {}, ...rest } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(toErrorMessage(payload, `Request failed: ${response.status}`));
  }

  return payload;
}

export { API_BASE };
