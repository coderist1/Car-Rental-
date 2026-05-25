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

const NO_AUTH = (import.meta.env.VITE_NO_AUTH || '').toLowerCase() === 'true';

// Simple localStorage-backed mock for anonymous/no-auth mode
function loadMockStore() {
  try {
    const raw = localStorage.getItem('mockApiData');
    if (raw) return JSON.parse(raw);
  } catch {}
  const initial = {
    nextId: { users: 1000, cars: 2000, bookings: 3000, damageReports: 4000, logReports: 5000 },
    users: [],
    cars: [],
    bookings: [],
    damageReports: [],
    logReports: [],
    currentUser: null,
  };
  localStorage.setItem('mockApiData', JSON.stringify(initial));
  return initial;
}

function saveMockStore(store) {
  try {
    localStorage.setItem('mockApiData', JSON.stringify(store));
  } catch {}
}

function genId(store, key) {
  store.nextId[key] = (store.nextId[key] || 1) + 1;
  return store.nextId[key];
}


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

  console.log('API Request:', requestUrl, options);

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

  // Mock/no-auth mode: handle common endpoints locally to avoid backend 401/404
  if (NO_AUTH) {
    try {
      const store = loadMockStore();
      const cleaned = path.replace(/^\/api\//, '').replace(/\/$/, '');
      const parts = cleaned.split('/').filter(Boolean);
      const resource = parts[0] || '';
      const resourceId = parts[1] ? Number(parts[1]) : null;

      function ensureUser() {
        if (!store.currentUser) {
          const demo = { id: genId(store, 'users'), email: 'local@local', username: 'local', role: 'owner', firstName: 'Local', lastName: 'User' };
          store.users.push(demo);
          store.currentUser = demo;
        }
        return store.currentUser;
      }

      // Authentication endpoints
      if (resource === 'login') {
        const user = { id: genId(store, 'users'), email: (body?.username || body?.email) || 'local@local', username: body?.username || 'local', role: 'owner' };
        store.users.push(user);
        store.currentUser = user;
        saveMockStore(store);
        return { user };
      }

      if (resource === 'register') {
        const user = { id: genId(store, 'users'), email: (body?.email) || 'local@local', username: (body?.username) || (body?.email) || 'local', role: body?.role || 'renter', firstName: body?.firstName || '', lastName: body?.lastName || '' };
        store.users.push(user);
        store.currentUser = user;
        saveMockStore(store);
        return { user };
      }

      if (resource === 'me') {
        if (method.toUpperCase() === 'PATCH') {
          const user = ensureUser();
          const updated = { ...user, ...(body || {}) };
          store.users = store.users.map((u) => (u.id === user.id ? updated : u));
          store.currentUser = updated;
          saveMockStore(store);
          return updated;
        }
        return store.currentUser || null;
      }

      // Map resource aliases
      const aliasMap = { 'damage-reports': 'damageReports', 'damage_reports': 'damageReports', logreports: 'logReports', cars: 'cars', bookings: 'bookings' };
      const key = aliasMap[resource] || resource;

      // Generic collection handlers
      if (['cars', 'bookings', 'damageReports', 'logReports'].includes(key)) {
        if (method.toUpperCase() === 'GET') {
          return store[key] || [];
        }

        if (method.toUpperCase() === 'POST') {
          const item = { id: genId(store, key === 'cars' ? 'cars' : key === 'bookings' ? 'bookings' : key === 'damageReports' ? 'damageReports' : 'logReports'), ...(body || {}) };
          // attach owner if adding a car
          if (key === 'cars') {
            const u = ensureUser();
            item.owner = u.id;
          }
          store[key].push(item);
          saveMockStore(store);
          return item;
        }

        if (resourceId && method.toUpperCase() === 'PATCH') {
          store[key] = store[key].map((it) => (it.id === resourceId ? { ...it, ...(body || {}) } : it));
          const found = store[key].find((it) => it.id === resourceId);
          saveMockStore(store);
          return found;
        }

        if (resourceId && method.toUpperCase() === 'DELETE') {
          store[key] = store[key].filter((it) => it.id !== resourceId);
          saveMockStore(store);
          return { success: true };
        }
      }

      // Fallback: return empty list for unknown GETs, null for others
      if (method.toUpperCase() === 'GET') return null;
      return { success: true };
    } catch (e) {
      console.error('Mock API error', e);
      return null;
    }
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
    console.error('API Error:', requestUrl, response.status, payload);
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
