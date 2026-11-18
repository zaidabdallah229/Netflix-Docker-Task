import React, { useEffect, useState } from 'react';
import { catalog, watchlist } from './api.js';
import { Card, Styles } from './ui.jsx';

export default function MyList({ onOpen }) {
  const [movies, setMovies] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    watchlist.list()
      .then((l) => catalog.byIds(l.map((x) => x.movieId)))
      .then(setMovies)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="br">
      <Styles />
      <h1 className="br-title">My List</h1>
      {error && <div className="br-err">{error}</div>}
      {movies?.length === 0 && <p className="br-empty">Your list is empty. Add titles with “+ My List”.</p>}
      <div className="br-grid">{movies?.map((m) => <Card key={m.id} movie={m} onOpen={onOpen} />)}</div>
    </div>
  );
}
