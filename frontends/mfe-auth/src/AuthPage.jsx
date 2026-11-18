import React, { useState } from 'react';

const css = `
.au-page{min-height:calc(100vh - 68px);display:flex;align-items:center;justify-content:center;padding:24px 16px;
  background:radial-gradient(ellipse at top,#3a0b0e 0%,#0b0b0b 60%,#000 100%);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.au-card{width:100%;max-width:400px;background:rgba(0,0,0,.78);border-radius:8px;padding:48px 40px;color:#fff;box-sizing:border-box}
.au-card h1{margin:0 0 28px;font-size:32px}
.au-field{width:100%;box-sizing:border-box;margin-bottom:14px;padding:16px;border-radius:4px;border:1px solid #555;background:#161616;color:#fff;font-size:16px}
.au-field:focus{outline:2px solid #fff;outline-offset:-1px}
.au-btn{width:100%;padding:14px;border:0;border-radius:4px;background:#e50914;color:#fff;font-size:16px;font-weight:700;cursor:pointer;margin-top:10px}
.au-btn:disabled{opacity:.6;cursor:wait}
.au-err{background:#e87c03;color:#fff;border-radius:4px;padding:10px 14px;margin-bottom:14px;font-size:14px}
.au-switch{margin-top:28px;color:#8c8c8c;font-size:15px}
.au-switch button{background:none;border:0;color:#fff;font-size:15px;cursor:pointer;padding:0}
.au-switch button:hover{text-decoration:underline}
.au-hint{margin-top:16px;color:#737373;font-size:13px}
@media (max-width:480px){.au-card{padding:32px 20px}}
`;

/** Saves the session where every MFE can read it, then notifies them. */
function saveSession(data) {
  localStorage.setItem('nf_token', data.token);
  localStorage.setItem('nf_user', JSON.stringify({ id: data.id, username: data.username, role: data.role }));
  window.dispatchEvent(new CustomEvent('nf:auth'));
}

export default function AuthPage({ mode = 'login', onSuccess, onSwitch }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isLogin = mode === 'login';

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${isLogin ? 'login' : 'signup'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
      saveSession(data);
      onSuccess?.(data);
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Auth service is unreachable' : err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="au-page">
      <style>{css}</style>
      <form className="au-card" onSubmit={submit}>
        <h1>{isLogin ? 'Sign In' : 'Sign Up'}</h1>
        {error && <div className="au-err">{error}</div>}
        <input className="au-field" placeholder="Username" autoComplete="username" value={username}
               onChange={(e) => setUsername(e.target.value)} required minLength={3} />
        <input className="au-field" placeholder="Password" type="password" value={password}
               autoComplete={isLogin ? 'current-password' : 'new-password'}
               onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <button className="au-btn" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Sign In' : 'Create account'}</button>
        <div className="au-switch">
          {isLogin ? 'New here? ' : 'Already have an account? '}
          <button type="button" onClick={() => onSwitch?.(isLogin ? 'signup' : 'login')}>
            {isLogin ? 'Sign up now.' : 'Sign in.'}
          </button>
        </div>
        {isLogin && <div className="au-hint">Admin demo account: admin / admin123</div>}
      </form>
    </div>
  );
}
