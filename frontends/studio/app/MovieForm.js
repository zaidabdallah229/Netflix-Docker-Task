'use client';
import { useState } from 'react';

const RATINGS = ['G', 'PG', 'PG-13', 'R', 'TV-MA'];

export default function MovieForm({ initial = {}, submitLabel, onSubmit }) {
  const [form, setForm] = useState({
    title: initial.title ?? '',
    description: initial.description ?? '',
    genres: (initial.genres ?? []).join(', '),
    year: initial.year ?? new Date().getFullYear(),
    maturityRating: initial.maturityRating ?? 'PG-13',
    durationMinutes: initial.durationMinutes ?? 90,
    featured: initial.featured ?? false,
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit({ ...form, year: Number(form.year), durationMinutes: Number(form.durationMinutes) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>Title<input value={form.title} onChange={set('title')} required /></label>
      <label className="full">Description<textarea rows={3} value={form.description} onChange={set('description')} /></label>
      <label>Genres (comma separated)<input value={form.genres} onChange={set('genres')} placeholder="Drama, Sci-Fi" /></label>
      <label>Year<input type="number" value={form.year} onChange={set('year')} /></label>
      <label>Rating
        <select value={form.maturityRating} onChange={set('maturityRating')}>
          {RATINGS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>
      <label>Duration (min)<input type="number" value={form.durationMinutes} onChange={set('durationMinutes')} /></label>
      <label className="check"><input type="checkbox" checked={form.featured} onChange={set('featured')} /> Featured on home page</label>
      <div className="full"><button className="btn" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button></div>
    </form>
  );
}
