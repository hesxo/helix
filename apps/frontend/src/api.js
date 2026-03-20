const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';

function safeJson(res) {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  return res.json();
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await safeJson(res);
  if (!res.ok) {
    const message = (json && (json.error || json.message)) || res.statusText;
    const err = new Error(message || `Request failed: ${res.status}`);
    err.status = res.status;
    err.payload = json;
    throw err;
  }

  return json ?? (await res.text());
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export const api = {
  getGatewayRoot: () => apiRequest('/'),
  getGatewayHealth: () => apiRequest('/health'),
  getGatewayReady: () => apiRequest('/ready'),

  createUser: (payload) => apiRequest('/api/users', { method: 'POST', body: payload }),
  getUserById: (id) => apiRequest(`/api/users/${encodeURIComponent(id)}`),

  createOrder: (payload) => apiRequest('/api/orders', { method: 'POST', body: payload }),
  getOrderById: (id) => apiRequest(`/api/orders/${encodeURIComponent(id)}`),
  getOrdersByUserId: (userId) => apiRequest(`/api/orders/user/${encodeURIComponent(userId)}`),
};

