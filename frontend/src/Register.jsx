import React, { useState } from "react";
import "./Register.css";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (registerPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      const res = await fetch("http://127.0.0.1:8080/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          confirm_password: confirmPassword,
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
    }
  };

  return (
    <div className="container">
      <div id="registerForm" className="form active">
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
              onChange={(e) => setRegisterEmail(e.target.value)}
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
              onChange={(e) => setRegisterPassword(e.target.value)}
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
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn">Continue</button>
        </form>
        <div className="already-account">
          Already have an account?{" "}
          <a href="#" onClick={e => {e.preventDefault(); navigate("/login");}}>Login</a>
        </div>
      </div>
    </div>
  );
}