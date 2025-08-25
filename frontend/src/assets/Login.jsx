import React, { useState } from 'react';
import Note2BrainLogo from './Note2BrainLogo';
import './Login.css';

function Login() {
  const [showRegister, setShowRegister] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Handlers
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    alert('Login successful!');
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (registerPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    alert('Registration successful!');
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert('Forgot Password functionality would be implemented here');
  };

  return (
    <div className="container">
      <Note2BrainLogo />
      {/* Login Form */}
      {!showRegister && (
        <div className="form active">
          <h2>Login</h2>
          <p className="subtitle">Please enter your account details</p>
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="loginEmail">Email</label>
              <input
                type="email"
                id="loginEmail"
                name="email"
                required
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="loginPassword">Password</label>
              <input
                type="password"
                id="loginPassword"
                name="password"
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
              />
            </div>
            <div className="forgot-password">
              <a href="#" onClick={handleForgotPassword}>Forgot Password?</a>
            </div>
            <button type="submit" className="btn">Sign In</button>
          </form>
          <div className="switch-form">
            Don't have an account?{' '}
            <a href="#" onClick={() => setShowRegister(true)}>Sign Up</a>
          </div>
        </div>
      )}
      {/* Register Form */}
      {showRegister && (
        <div className="form active">
          <h2>Getting Started</h2>
          <p className="subtitle">Seems you are new here.Let's get set up your profile.</p>
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label htmlFor="registerEmail">Email Address</label>
              <input
                type="email"
                id="registerEmail"
                name="email"
                required
                value={registerEmail}
                onChange={e => setRegisterEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="registerPassword">Password</label>
              <input
                type="password"
                id="registerPassword"
                name="password"
                required
                value={registerPassword}
                onChange={e => setRegisterPassword(e.target.value)}
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
            <button type="submit" className="btn">Continue</button>
          </form>
          <div className="already-account">
            Already have an account?{' '}
            <a href="#" onClick={() => setShowRegister(false)}>Login</a>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;