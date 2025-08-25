import React, { useState } from 'react';
import Login from './assets/Login';
import Register from './assets/Register';

function App() {
  const [showRegister, setShowRegister] = useState(false);

  return showRegister ? (
    <Register onLogin={() => setShowRegister(false)} />
  ) : (
    <Login onRegister={() => setShowRegister(true)} />
  );
}

export default App;