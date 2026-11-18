'use client';
import { useEffect, useState } from 'react';
import { currentUser } from '../lib/api';

export default function AdminOnly({ children }) {
  const [user, setUser] = useState(undefined);
  useEffect(() => setUser(currentUser()), []);
  if (user === undefined) return null;
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="card">
        <h2>Admins only</h2>
        <p>Sign in with an admin account to manage the catalog.</p>
        <a className="btn" href="/login?next=/studio">Sign in</a>
      </div>
    );
  }
  return children;
}
