import React, { useState } from 'react';
import Note2BrainLogo from './Note2BrainLogo';
import './Register.css';

function Register({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      alert('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    if (password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    alert('Registration successful!');
    if (onLogin) onLogin();
  };

  return (
    <div className="container">
      <Note2BrainLogo />
      <h2>Getting Started</h2>
      <p className="subtitle">Seems you are new here.Let's set up your profile.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn">continue</button>
        <div className="already-account">
          Already have an account?{' '}
          <a href="#" onClick={e => { e.preventDefault(); if (onLogin) onLogin(); }}>Login</a>
        </div>
      </form>
    </div>
  );
}

export default Register;