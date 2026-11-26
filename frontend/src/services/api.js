const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `API request failed (${response.status})`);
  }
  return data;
}

export const drApi = {
  getHealth: () => request('/health'),
  getStatus: () => request('/status'),
  getMetrics: (limit = 30) => request(`/metrics?limit=${limit}`),
  getEvents: ({ type = 'ALL', severity = 'ALL', limit = 60 } = {}) =>
    request(`/events?type=${encodeURIComponent(type)}&severity=${encodeURIComponent(severity)}&limit=${limit}`),
  getReplication: () => request('/replication'),
  getActiveCloud: () => request('/active-cloud'),
  simulateFailover: (payload) =>
    request('/failover/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  recoverPrimary: (payload = {}) =>
    request('/recovery', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  runManualHealthCheck: () =>
    request('/monitoring/check', {
      method: 'POST',
    }),
  toggleAutoFailover: (enabled) =>
    request('/monitoring/auto-failover', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),
  triggerReplicationSync: () =>
    request('/replication/sync', {
      method: 'POST',
    }),
  createSampleRecord: (payload) =>
    request('/replication/records', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
