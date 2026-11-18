// Standalone entry: lets this team run and test the MFE without the shell.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import AuthPage from './AuthPage.jsx';

function Standalone() {
  const [mode, setMode] = useState('login');
  return <AuthPage mode={mode} onSwitch={setMode} onSuccess={(u) => alert(`Signed in as ${u.username}`)} />;
}

createRoot(document.getElementById('root')).render(<Standalone />);
