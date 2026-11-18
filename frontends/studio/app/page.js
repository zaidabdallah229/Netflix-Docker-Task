'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import AdminOnly from './AdminOnly';
import MovieForm from './MovieForm';

function Titles() {
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = () => api('/api/catalog/movies').then(setMovies).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function create(data) {
    try {
      await api('/api/catalog/movies', { method: 'POST', body: JSON.stringify(data) });
      setShowForm(false);
      load();
    } catch (e) { setError(e.message); }
  }

  async function remove(m) {
    if (!confirm(`Delete "${m.title}"? Its files in MinIO and all My List entries will be removed too.`)) return;
    try {
      await api(`/api/catalog/movies/${m.id}`, { method: 'DELETE' });
      load();
    } catch (e) { setError(e.message); }
  }

  return (
    <>
      <div className="head">
        <h1>Titles <span className="muted">({movies.length})</span></h1>
        <button className="btn" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ New title'}</button>
      </div>
      {error && <div className="err">{error}</div>}
      {showForm && <div className="card"><MovieForm submitLabel="Create title" onSubmit={create} /></div>}
      <div className="table">
        <div className="tr th"><span>Title</span><span>Genres</span><span>Year</span><span>Media</span><span /></div>
        {movies.map((m) => (
          <div className="tr" key={m.id}>
            <span><Link href={`/movies/${m.id}`}>{m.title}</Link>{m.featured && <em className="pill">featured</em>}</span>
            <span className="muted">{m.genres.join(', ')}</span>
            <span className="muted">{m.year}</span>
            <span className="media">
              <i className={m.posterUrl ? 'on' : ''}>poster</i>
              <i className={m.backdropUrl ? 'on' : ''}>backdrop</i>
              <i className={m.videoUrl ? 'on' : ''}>video</i>
            </span>
            <span className="actions">
              <Link className="btn ghost" href={`/movies/${m.id}`}>Edit</Link>
              <button className="btn danger" onClick={() => remove(m)}>Delete</button>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

export default function Page() {
  return <AdminOnly><Titles /></AdminOnly>;
}
