import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./Document.css";
import "./QuizResult.css";

export default function QuizResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const { score, totalQuestions, answeredCount, documentName } = location.state || {
    score: 0,
    totalQuestions: 0,
    answeredCount: 0,
    documentName: "Unknown Document"
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getScoreEmoji = (score) => {
    if (score >= 80) return "🎉";
    if (score >= 60) return "👍";
    return "💪";
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return "Excellent!";
    if (score >= 60) return "Good Job!";
    return "Keep Learning!";
  };

  return (
    <div className="home-root">
      <header className="home-header">
        <img src="/logo.png" alt="logo" className="home-logo" />
        <span className="home-title">note2brain</span>
      </header>
      <hr className="home-divider" />
      <main className="home-main">
        <div className="result-container">
          <div className="result-card">
            <div className="result-emoji">{getScoreEmoji(score)}</div>
            <h1 className="result-title">{getScoreMessage(score)}</h1>
            <p className="result-document">{documentName}</p>
            
            <div className="score-circle" style={{ borderColor: getScoreColor(score) }}>
              <div className="score-value" style={{ color: getScoreColor(score) }}>
                {score}%
              </div>
              <div className="score-label">Score</div>
            </div>

            <div className="result-stats">
              <div className="stat-item">
                <div className="stat-value">{answeredCount}</div>
                <div className="stat-label">Answered</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-value">{totalQuestions}</div>
                <div className="stat-label">Total Questions</div>
              </div>
            </div>

            <div className="result-actions">
              <button 
                className="result-btn result-btn-secondary"
                onClick={() => navigate(`/document/${id}`)}
              >
                Back to Document
              </button>
              <button 
                className="result-btn result-btn-primary"
                onClick={() => navigate(`/quiz-history`)}
              >
                View History
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}