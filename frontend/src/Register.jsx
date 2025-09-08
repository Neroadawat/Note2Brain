import React, { useState, useEffect } from "react";
import "./Register.css";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    number: false,
    uppercase: false,
  });
  const [passwordMatch, setPasswordMatch] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setPasswordValidation({
      length: password.length >= 8,
      number: /[0-9]/.test(password),
      uppercase: /[A-Z]/.test(password),
    });
  }, [password]);

  useEffect(() => {
    if (confirmPassword) {
      setPasswordMatch(password === confirmPassword);
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!Object.values(passwordValidation).every(Boolean) || !passwordMatch) {
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8080/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: password,
          confirm_password: confirmPassword
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        alert("Registration successful!");
        navigate("/login");
      } else {
        alert(data.detail || "Registration failed");
      }
    } catch (err) {
      alert("Network error");
      console.error(err);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-content">
          <h1>Getting Started</h1>
          <p className="subtitle">Seems you are new here.Let's set up your profile.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {!passwordMatch && confirmPassword && (
                <div className="error-message">Passwords do not match</div>
              )}
            </div>

            <div className="password-rules">
              <div className={`rule ${passwordValidation.length ? 'valid' : 'invalid'}`}>
                <span className="rule-icon">
                  {passwordValidation.length ? '✓' : '✕'}
                </span>
                Password must be at least 8 characters long.
              </div>
              <div className={`rule ${passwordValidation.number ? 'valid' : 'invalid'}`}>
                <span className="rule-icon">
                  {passwordValidation.number ? '✓' : '✕'}
                </span>
                Password must contain at least one digit (0-9).
              </div>
              <div className={`rule ${passwordValidation.uppercase ? 'valid' : 'invalid'}`}>
                <span className="rule-icon">
                  {passwordValidation.uppercase ? '✓' : '✕'}
                </span>
                Password must contain at least one uppercase letter.
              </div>
            </div>

            <button 
              type="submit" 
              className="continue-btn"
              disabled={!Object.values(passwordValidation).every(Boolean) || !passwordMatch}
            >
              continue
            </button>
          </form>

          <div className="login-link">
            Already have an account? <a href="#" onClick={(e) => {e.preventDefault(); navigate('/login')}}>Login</a>
          </div>
        </div>

        <div className="register-image">
          <img src="/logo.png" alt="Notebook" />
        </div>
      </div>
    </div>
  );
}