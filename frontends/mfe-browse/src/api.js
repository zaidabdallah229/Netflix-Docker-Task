// Each MFE owns its own tiny API client: no shared code = independent deploys.
export const token = () => localStorage.getItem('nf_token');

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `${path} failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export const catalog = {
  browse: () => api('/api/catalog/movies/browse'),
  search: (q) => api(`/api/catalog/movies?q=${encodeURIComponent(q)}`),
  get: (id) => api(`/api/catalog/movies/${id}`),
  byIds: (ids) => (ids.length ? api(`/api/catalog/movies?ids=${ids.join(',')}`) : Promise.resolve([])),
};

export const watchlist = {
  list: () => api('/api/watchlist/'),
  add: (id) => api(`/api/watchlist/${id}`, { method: 'POST' }),
  remove: (id) => api(`/api/watchlist/${id}`, { method: 'DELETE' }),
  progress: () => api('/api/watchlist/progress'),
  saveProgress: (id, positionSeconds, durationSeconds) =>
    api(`/api/watchlist/progress/${id}`, { method: 'PUT', body: JSON.stringify({ positionSeconds, durationSeconds }) }),
};
