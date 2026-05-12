const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function resolveWebSocketBase() {
  const explicitWsBase = (import.meta.env.VITE_WS_URL || '').replace(/\/$/, '');
  if (explicitWsBase) {
    return explicitWsBase;
  }

  if (!API_BASE) {
    return '';
  }

  try {
    const url = new URL(API_BASE);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = url.pathname.replace(/\/api\/?$/, '');
    return url.toString().replace(/\/$/, '');
  } catch {
    return API_BASE.replace(/^http/, 'ws').replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
}

const WS_BASE = resolveWebSocketBase();

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

function getCsrfToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : '';
}

export async function apiRequest(path, options = {}) {
  const { body, headers = {}, method = 'GET', ...rest } = options;
  const requestUrl = `${API_BASE}${path}`;

  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const finalHeaders = {
    ...(isMutating ? { 'X-CSRFToken': getCsrfToken() } : {}),
    ...headers,
  };

  // Browser automatically sets Content-Type to multipart/form-data for FormData.
  if (!isFormData && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(requestUrl, {
      ...rest,
      method,
      credentials: 'include',
      headers: finalHeaders,
      body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new Error(`Unable to connect to API at ${requestUrl}`);
  }

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

// ===== WebSocket Real-Time Sync =====
class RealtimeManager {
  constructor() {
    this.ws = null;
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.isManualClose = false;
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.isManualClose = false;

    try {
      const wsUrl = `${WS_BASE}/ws/sync/`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✓ Real-time sync connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, action, id, payload } = data;

          if (type && this.listeners[type]) {
            this.listeners[type].forEach((callback) => {
              callback({ action, id, payload });
            });
          }
        } catch (e) {
          console.error('✗ WebSocket message parse error:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('✗ WebSocket error:', error);
      };

      this.ws.onclose = () => {
        if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`⟳ Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          setTimeout(() => this.connect(), this.reconnectDelay);
        }
      };
    } catch (e) {
      console.error('✗ WebSocket connection error:', e);
    }
  }

  on(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);

    return () => {
      this.listeners[type] = this.listeners[type].filter((cb) => cb !== callback);
    };
  }

  disconnect() {
    this.isManualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const realtimeManager = new RealtimeManager();

export { API_BASE, WS_BASE };
