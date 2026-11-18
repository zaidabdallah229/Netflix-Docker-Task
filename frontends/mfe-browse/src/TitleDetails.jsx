import React, { useEffect, useState } from 'react';
import { catalog, token, watchlist } from './api.js';
import { Art, Styles } from './ui.jsx';

export default function TitleDetails({ id, onPlay, onBack }) {
  const [movie, setMovie] = useState(null);
  const [inList, setInList] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    catalog.get(id).then(setMovie).catch((e) => setError(e.message));
    if (token()) watchlist.list().then((l) => setInList(l.some((x) => x.movieId === id))).catch(() => undefined);
  }, [id]);

  async function toggle() {
    try {
      await (inList ? watchlist.remove(id) : watchlist.add(id));
      setInList(!inList);
    } catch (e) {
      setError(`My List unavailable: ${e.message}`);
    }
  }

  if (error && !movie) return <div className="br"><Styles /><div className="br-err">{error}</div></div>;
  if (!movie) return <div className="br"><Styles /><p className="br-empty">Loading…</p></div>;

  return (
    <div className="br">
      <Styles />
      {error && <div className="br-err">{error}</div>}
      <div className="br-detail">
        <div className="br-art"><Art movie={movie} wide /></div>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(28px,4vw,44px)' }}>{movie.title}</h1>
          <div className="br-meta">
            {movie.year && <span>{movie.year}</span>}
            <span className="br-rating">{movie.maturityRating}</span>
            {movie.durationMinutes > 0 && <span>{Math.floor(movie.durationMinutes / 60)}h {movie.durationMinutes % 60}m</span>}
          </div>
          <p style={{ lineHeight: 1.5, fontSize: 17 }}>{movie.description}</p>
          <div className="br-btns">
            <button className="br-btn play" onClick={() => onPlay?.(movie.id)} disabled={!movie.videoUrl}>
              ▶ {movie.videoUrl ? 'Play' : 'No video yet'}
            </button>
            <button className="br-btn info" onClick={toggle}>{inList ? '✓ In My List' : '+ My List'}</button>
            {onBack && <button className="br-btn info" onClick={onBack}>Back</button>}
          </div>
          <div className="br-tags">Genres: {movie.genres.join(', ') || '—'}</div>
        </div>
      </div>
    </div>
  );
}
