// Standalone entry for developing this MFE on its own.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Home from './Home.jsx';
import TitleDetails from './TitleDetails.jsx';
import Player from './Player.jsx';

function Standalone() {
  const [view, setView] = useState({ name: 'home' });
  if (view.name === 'title') return <TitleDetails id={view.id} onBack={() => setView({ name: 'home' })} onPlay={(id) => setView({ name: 'play', id })} />;
  if (view.name === 'play') return <Player id={view.id} onBack={() => setView({ name: 'home' })} />;
  return <Home onOpen={(id) => setView({ name: 'title', id })} onPlay={(id) => setView({ name: 'play', id })} />;
}

createRoot(document.getElementById('root')).render(<Standalone />);
