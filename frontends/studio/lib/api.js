'use client';

export const token = () => (typeof window === 'undefined' ? null : localStorage.getItem('nf_token'));

export function currentUser() {
  const t = token();
  if (!t) return null;
  try {
    const c = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return c.exp * 1000 > Date.now() ? { username: c.username, role: c.role } : null;
  } catch {
    return null;
  }
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}), Authorization: `Bearer ${token()}` };
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `${res.status} ${res.statusText}`);
  }
  return res.status === 204 ? null : res.json();
}

/** XHR instead of fetch so we can show upload progress for big videos. */
export function upload(movieId, kind, file, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('movieId', movieId);
    form.append('kind', kind);
    form.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/media/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${token()}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch {}
      xhr.status < 300 ? resolve(data) : reject(new Error(data.message || `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(form);
  });
}
