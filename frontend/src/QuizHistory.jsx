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

  const getScoreDescription = (score) => {
    if (score >= 80) return "Outstanding performance! You've mastered this material.";
    if (score >= 60) return "Great work! You're making solid progress.";
    return "Keep practicing! Every attempt makes you stronger.";
  };

  const correctAnswers = Math.round((score / 100) * answeredCount);
  const incorrectAnswers = answeredCount - correctAnswers;

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
            <div className="result-badge">Quiz Completed</div>
            
            <div className="result-emoji">{getScoreEmoji(score)}</div>
            <h1 className="result-title">{getScoreMessage(score)}</h1>
            <p className="result-description">{getScoreDescription(score)}</p>
            <p className="result-document">📄 {documentName}</p>
            
            <div className="score-circle" style={{ borderColor: getScoreColor(score) }}>
              <div className="score-value" style={{ color: getScoreColor(score) }}>
                {score}%
              </div>
              <div className="score-label">Final Score</div>
            </div>

            <div className="result-stats">
              <div className="stat-item">
                <div className="stat-icon">✅</div>
                <div className="stat-value" style={{ color: "#10b981" }}>{correctAnswers}</div>
                <div className="stat-label">Correct</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-icon">❌</div>
                <div className="stat-value" style={{ color: "#ef4444" }}>{incorrectAnswers}</div>
                <div className="stat-label">Incorrect</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-icon">📝</div>
                <div className="stat-value">{totalQuestions}</div>
                <div className="stat-label">Total</div>
              </div>
            </div>

            <div className="progress-section">
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill"
                  style={{ 
                    width: `${score}%`,
                    background: `linear-gradient(90deg, ${getScoreColor(score)}, ${getScoreColor(score)}dd)`
                  }}
                ></div>
              </div>
              <div className="progress-labels">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="result-actions">
              <button 
                className="result-btn result-btn-secondary"
                onClick={() => navigate(`/document/${id}`)}
              >
                <span className="btn-icon">📚</span>
                Back to Document
              </button>
              <button 
                className="result-btn result-btn-primary"
                onClick={() => navigate(`/quiz-history`)}
              >
                <span className="btn-icon">📊</span>
                View History
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}