'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, upload } from '../../../lib/api';
import AdminOnly from '../../AdminOnly';
import MovieForm from '../../MovieForm';

const KINDS = [
  { kind: 'poster', label: 'Poster (card image)', accept: 'image/*', field: 'posterUrl' },
  { kind: 'backdrop', label: 'Backdrop (hero image)', accept: 'image/*', field: 'backdropUrl' },
  { kind: 'video', label: 'Video (mp4 / webm)', accept: 'video/*', field: 'videoUrl' },
];

function Uploader({ movie, kind, label, accept, field, onDone }) {
  const [pct, setPct] = useState(null);
  const [msg, setMsg] = useState('');

  async function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg('');
    setPct(0);
    try {
      await upload(movie.id, kind, file, setPct);
      setMsg('Uploaded. The catalog is updated through RabbitMQ (media.uploaded event)…');
      onDone();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setPct(null);
      e.target.value = '';
    }
  }

  const url = movie[field];
  return (
    <div className="up">
      <div className="up-head"><strong>{label}</strong>{url && <a href={url} target="_blank">open</a>}</div>
      {url && kind !== 'video' && <img src={url} alt="" />}
      {url && kind === 'video' && <video src={url} controls preload="metadata" />}
      {!url && <div className="up-empty">Nothing uploaded yet</div>}
      <input type="file" accept={accept} onChange={pick} disabled={pct !== null} />
      {pct !== null && <div className="bar"><div style={{ width: `${pct}%` }} /></div>}
      {msg && <p className="muted small">{msg}</p>}
    </div>
  );
}

function Edit({ id }) {
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = () => api(`/api/catalog/movies/${id}`).then(setMovie).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [id]);

  // The event is processed asynchronously, so poll a few times after an upload.
  function refreshSoon() {
    [800, 2000, 4000].forEach((ms) => setTimeout(load, ms));
  }

  async function save(data) {
    try {
      setMovie(await api(`/api/catalog/movies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError(e.message); }
  }

  if (!movie) return error ? <div className="err">{error}</div> : <p className="muted">Loading…</p>;
  return (
    <>
      <div className="head">
        <h1>{movie.title}</h1>
        <Link className="btn ghost" href="/">← All titles</Link>
      </div>
      {error && <div className="err">{error}</div>}
      <div className="card">
        <h2>Details {saved && <span className="ok">saved</span>}</h2>
        <MovieForm key={movie.updatedAt} initial={movie} submitLabel="Save changes" onSubmit={save} />
      </div>
      <div className="card">
        <h2>Media <span className="muted small">stored in MinIO by media-service</span></h2>
        <div className="ups">
          {KINDS.map((k) => <Uploader key={k.kind} movie={movie} {...k} onDone={refreshSoon} />)}
        </div>
      </div>
    </>
  );
}

export default function Page({ params }) {
  return <AdminOnly><Edit id={params.id} /></AdminOnly>;
}
