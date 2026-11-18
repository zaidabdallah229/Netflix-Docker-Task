import React, { lazy, useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Remote from './Remote.jsx';
import { logout, useSession } from './session.js';

// Loaded at runtime from the remote containers (Module Federation).
const AuthPage = lazy(() => import('authApp/AuthPage'));
const Home = lazy(() => import('browseApp/Home'));
const TitleDetails = lazy(() => import('browseApp/TitleDetails'));
const Player = lazy(() => import('browseApp/Player'));
const MyList = lazy(() => import('browseApp/MyList'));

function Navbar({ user }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function search(value) {
    setQ(value);
    navigate(value ? `/?q=${encodeURIComponent(value)}` : '/', { replace: true });
  }

  return (
    <nav className={`sh-nav ${scrolled ? 'solid' : ''}`}>
      <Link to="/" className="sh-logo" aria-label="Home">NETFLIX</Link>
      {user && (
        <>
          <div className="sh-links">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/my-list">My List</NavLink>
            {user.role === 'ADMIN' && <a href="/studio">Studio</a>}
          </div>
          <div className="sh-right">
            <input className="sh-search" placeholder="Search titles" value={q} onChange={(e) => search(e.target.value)} aria-label="Search" />
            <span className="sh-user" title={user.role}>{user.username}</span>
            <button className="sh-out" onClick={() => { logout(); navigate('/login'); }}>Sign out</button>
          </div>
        </>
      )}
    </nav>
  );
}

function RequireAuth({ user, children }) {
  const location = useLocation();
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return children;
}

function AuthRoute({ mode, user }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/';
  if (user) {
    // /studio is a different app (Next.js), so leave the SPA with a full page load.
    if (!next.startsWith('/studio')) return <Navigate to={next} replace />;
    window.location.href = next;
    return null;
  }
  return (
    <Remote name="Auth MFE">
      <AuthPage
        mode={mode}
        onSuccess={() => undefined /* session event re-renders us with a user */}
        onSwitch={(m) => navigate(`/${m}${params.toString() ? `?${params}` : ''}`)}
      />
    </Remote>
  );
}

function TitleRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <Remote name="Browse MFE">
      <TitleDetails id={id} onPlay={(m) => navigate(`/watch/${m}`)} onBack={() => navigate(-1)} />
    </Remote>
  );
}

function WatchRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <Remote name="Browse MFE">
      <Player id={id} onBack={() => navigate(`/title/${id}`)} />
    </Remote>
  );
}

function HomeRoute() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  return (
    <Remote name="Browse MFE">
      <Home query={params.get('q') ?? ''} onOpen={(id) => navigate(`/title/${id}`)} onPlay={(id) => navigate(`/watch/${id}`)} />
    </Remote>
  );
}

export default function App() {
  const user = useSession();
  const navigate = useNavigate();
  return (
    <>
      <Navbar user={user} />
      <main className="sh-main">
        <Routes>
          <Route path="/login" element={<AuthRoute mode="login" user={user} />} />
          <Route path="/signup" element={<AuthRoute mode="signup" user={user} />} />
          <Route path="/" element={<RequireAuth user={user}><HomeRoute /></RequireAuth>} />
          <Route path="/title/:id" element={<RequireAuth user={user}><TitleRoute /></RequireAuth>} />
          <Route path="/watch/:id" element={<RequireAuth user={user}><WatchRoute /></RequireAuth>} />
          <Route path="/my-list" element={
            <RequireAuth user={user}><Remote name="Browse MFE"><MyList onOpen={(id) => navigate(`/title/${id}`)} /></Remote></RequireAuth>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
