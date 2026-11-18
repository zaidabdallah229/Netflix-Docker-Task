import React, { useEffect, useState } from 'react';
import { catalog, token, watchlist } from './api.js';
import { Card, Row, Styles } from './ui.jsx';

export default function Home({ query = '', onOpen, onPlay }) {
  const [data, setData] = useState(null);
  const [continueRow, setContinueRow] = useState({ movies: [], progress: {} });
  const [myList, setMyList] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    catalog.browse().then(setData).catch((e) => setError(`Catalog unavailable: ${e.message}`));
    if (!token()) return;
    // The watchlist service only stores ids; titles come from the catalog service.
    watchlist.progress()
      .then(async (p) => {
        const movies = await catalog.byIds(p.map((x) => x.movieId));
        const progress = Object.fromEntries(p.map((x) => [x.movieId, x]));
        const order = p.map((x) => x.movieId);
        movies.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
        setContinueRow({ movies, progress });
      })
      .catch(() => undefined); // watchlist down -> the page still works
    watchlist.list().then((l) => catalog.byIds(l.map((x) => x.movieId))).then(setMyList).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!query) return setResults(null);
    const t = setTimeout(() => catalog.search(query).then(setResults).catch((e) => setError(e.message)), 250);
    return () => clearTimeout(t);
  }, [query]);

  if (results) {
    return (
      <div className="br">
        <Styles />
        <h1 className="br-title">Results for “{query}”</h1>
        {results.length === 0 && <p className="br-empty">No titles match your search.</p>}
        <div className="br-grid">{results.map((m) => <Card key={m.id} movie={m} onOpen={onOpen} />)}</div>
      </div>
    );
  }

  const hero = data?.featured;
  const heroImg = hero && (hero.backdropUrl || hero.posterUrl);
  return (
    <div className="br">
      <Styles />
      {error && <div className="br-err">{error}</div>}
      {hero && (
        <header className="br-hero" style={{ backgroundImage: heroImg ? `url(${heroImg})` : 'linear-gradient(135deg,#5b0a10,#141414)' }}>
          <div className="br-hero-body">
            <h1>{hero.title}</h1>
            <p>{hero.description}</p>
            <div className="br-btns">
              <button className="br-btn play" onClick={() => onPlay?.(hero.id)} disabled={!hero.videoUrl}>▶ Play</button>
              <button className="br-btn info" onClick={() => onOpen?.(hero.id)}>ⓘ More Info</button>
            </div>
          </div>
        </header>
      )}
      <Row title="Continue Watching" movies={continueRow.movies} progressById={continueRow.progress} onOpen={onOpen} />
      <Row title="My List" movies={myList} onOpen={onOpen} />
      {data?.rows.map((r) => <Row key={r.title} title={r.title} movies={r.movies} onOpen={onOpen} />)}
    </div>
  );
}
