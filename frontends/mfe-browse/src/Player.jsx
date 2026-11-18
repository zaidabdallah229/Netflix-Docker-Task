import React, { useEffect, useRef, useState } from 'react';
import { catalog, token, watchlist } from './api.js';
import { Styles } from './ui.jsx';

export default function Player({ id, onBack }) {
  const video = useRef(null);
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState('');
  const lastSaved = useRef(0);

  useEffect(() => {
    catalog.get(id).then(setMovie).catch((e) => setError(e.message));
  }, [id]);

  // Resume where the user stopped (stored by watchlist-service).
  useEffect(() => {
    if (!movie?.videoUrl || !token()) return;
    watchlist.progress().then((list) => {
      const p = list.find((x) => x.movieId === id);
      if (p && video.current && p.positionSeconds < (p.durationSeconds || Infinity) - 10) {
        video.current.currentTime = p.positionSeconds;
      }
    }).catch(() => undefined);
  }, [movie, id]);

  function save(force) {
    const v = video.current;
    if (!v || !token() || !v.duration) return;
    if (!force && Math.abs(v.currentTime - lastSaved.current) < 10) return;
    lastSaved.current = v.currentTime;
    watchlist.saveProgress(id, v.currentTime, v.duration).catch(() => undefined);
  }

  useEffect(() => () => save(true), []); // save when leaving the player

  return (
    <div className="br-player">
      <Styles />
      <button className="br-back" onClick={() => { save(true); onBack?.(); }}>← Back</button>
      {error && <div className="br-noVideo">{error}</div>}
      {movie && !movie.videoUrl && <div className="br-noVideo">“{movie.title}” has no video yet. Upload one in Studio.</div>}
      {movie?.videoUrl && (
        <video ref={video} src={movie.videoUrl} controls autoPlay
               onTimeUpdate={() => save(false)} onPause={() => save(true)} onEnded={() => save(true)} />
      )}
    </div>
  );
}
