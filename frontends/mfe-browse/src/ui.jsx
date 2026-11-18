import React from 'react';

export const css = `
.br{color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#141414;min-height:calc(100vh - 68px);padding-bottom:48px}
.br-hero{position:relative;height:min(70vh,620px);display:flex;align-items:flex-end;padding:0 4% 8%;background-size:cover;background-position:center top}
.br-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(77deg,rgba(0,0,0,.85) 0%,rgba(0,0,0,0) 70%),linear-gradient(0deg,#141414 0%,rgba(20,20,20,0) 30%)}
.br-hero-body{position:relative;z-index:1;max-width:560px}
.br-hero h1{font-size:clamp(32px,6vw,64px);margin:0 0 12px;line-height:1.05}
.br-hero p{font-size:clamp(14px,1.6vw,18px);line-height:1.45;color:#e5e5e5;margin:0 0 20px}
.br-btns{display:flex;gap:10px;flex-wrap:wrap}
.br-btn{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:4px;padding:10px 24px;font-size:16px;font-weight:700;cursor:pointer}
.br-btn.play{background:#fff;color:#000}.br-btn.play:hover{background:rgba(255,255,255,.75)}
.br-btn.info{background:rgba(109,109,110,.7);color:#fff}.br-btn.info:hover{background:rgba(109,109,110,.4)}
.br-btn:disabled{opacity:.5;cursor:not-allowed}
.br-row{margin:28px 0 0;padding:0 4%}
.br-row h2{font-size:clamp(16px,1.6vw,22px);margin:0 0 10px;font-weight:600}
.br-track{display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x mandatory;padding:8px 0 16px;scrollbar-width:none}
.br-track::-webkit-scrollbar{display:none}
.br-card{flex:0 0 clamp(140px,16vw,240px);aspect-ratio:16/9;border-radius:4px;overflow:hidden;position:relative;cursor:pointer;
  scroll-snap-align:start;transition:transform .2s ease;background:#222;border:0;padding:0;color:#fff;text-align:left}
.br-card:hover,.br-card:focus-visible{transform:scale(1.07);z-index:2;outline:none;box-shadow:0 8px 24px rgba(0,0,0,.6)}
.br-card img{width:100%;height:100%;object-fit:cover;display:block}
.br-card .br-ph{width:100%;height:100%;display:flex;align-items:flex-end;padding:10px;box-sizing:border-box;font-weight:800;font-size:clamp(13px,1.2vw,17px)}
.br-card .br-bar{position:absolute;left:0;bottom:0;height:4px;background:#e50914}
.br-card .br-bar-bg{position:absolute;left:0;right:0;bottom:0;height:4px;background:rgba(255,255,255,.3)}
.br-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;padding:24px 4%}
.br-grid .br-card{flex:none;width:100%}
.br-title{padding:24px 4% 0;font-size:24px}
.br-empty{padding:24px 4%;color:#999}
.br-err{margin:24px 4%;padding:14px;border-radius:4px;background:#2a1215;color:#ffb4b4}
.br-detail{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:32px;padding:32px 4%}
.br-detail .br-art{aspect-ratio:16/9;border-radius:6px;overflow:hidden;background:#222}
.br-detail .br-art img{width:100%;height:100%;object-fit:cover}
.br-meta{display:flex;gap:12px;flex-wrap:wrap;color:#bcbcbc;margin:8px 0 16px;align-items:center}
.br-meta .br-rating{border:1px solid #888;padding:0 6px;border-radius:2px}
.br-tags{color:#bcbcbc;margin-top:16px}
.br-player{position:fixed;inset:0;background:#000;z-index:50;display:flex;align-items:center;justify-content:center}
.br-player video{width:100%;height:100%;object-fit:contain;background:#000}
.br-back{position:absolute;top:16px;left:16px;z-index:2;background:rgba(0,0,0,.5);border:0;color:#fff;font-size:16px;padding:8px 14px;border-radius:4px;cursor:pointer}
.br-noVideo{color:#ccc;text-align:center;padding:16px}
@media (max-width:760px){.br-detail{grid-template-columns:1fr}.br-hero{height:56vh}}
`;

export function Styles() {
  return <style>{css}</style>;
}

/** Deterministic gradient so titles without a poster still look distinct. */
export function gradient(title = '') {
  let h = 0;
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `linear-gradient(135deg,hsl(${h} 70% 32%) 0%,hsl(${(h + 50) % 360} 60% 14%) 100%)`;
}

export function Art({ movie, wide }) {
  const src = wide ? movie.backdropUrl || movie.posterUrl : movie.posterUrl || movie.backdropUrl;
  if (src) return <img src={src} alt={movie.title} loading="lazy" />;
  return <div className="br-ph" style={{ background: gradient(movie.title) }}>{movie.title}</div>;
}

export function Card({ movie, onOpen, progress }) {
  const pct = progress?.durationSeconds ? Math.min(100, (progress.positionSeconds / progress.durationSeconds) * 100) : null;
  return (
    <button className="br-card" onClick={() => onOpen?.(movie.id)} title={movie.title}>
      <Art movie={movie} />
      {pct !== null && <><div className="br-bar-bg" /><div className="br-bar" style={{ width: `${pct}%` }} /></>}
    </button>
  );
}

export function Row({ title, movies, onOpen, progressById }) {
  if (!movies?.length) return null;
  return (
    <section className="br-row">
      <h2>{title}</h2>
      <div className="br-track">
        {movies.map((m) => <Card key={m.id} movie={m} onOpen={onOpen} progress={progressById?.[m.id]} />)}
      </div>
    </section>
  );
}
