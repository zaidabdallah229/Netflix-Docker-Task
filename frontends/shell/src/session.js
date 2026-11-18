import { useEffect, useState } from 'react';

function read() {
  const token = localStorage.getItem('nf_token');
  if (!token) return null;
  try {
    const claims = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (claims.exp * 1000 < Date.now()) return null;
    return { id: claims.sub, username: claims.username, role: claims.role };
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('nf_token');
  localStorage.removeItem('nf_user');
  window.dispatchEvent(new CustomEvent('nf:auth'));
}

/** Session is shared by all MFEs through localStorage + the "nf:auth" browser event. */
export function useSession() {
  const [user, setUser] = useState(read);
  useEffect(() => {
    const update = () => setUser(read());
    window.addEventListener('nf:auth', update);
    window.addEventListener('storage', update); // other tabs
    return () => {
      window.removeEventListener('nf:auth', update);
      window.removeEventListener('storage', update);
    };
  }, []);
  return user;
}
