import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BookOpen, LayoutGrid, CheckCircle2, XCircle, FileText } from 'lucide-react';
import './QuizResult.css'; // ต้องมีไฟล์ CSS สำหรับหน้านี้

export default function QuizResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  // ดึงข้อมูลคะแนนที่ส่งมาจากหน้า Quiz
  const { score, totalQuestions, answeredCount, documentName } = location.state || {
    score: 0,
    totalQuestions: 0,
    answeredCount: 0,
    documentName: "Unknown Document"
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return "Excellent Performance";
    if (score >= 60) return "Good Progress";
    return "Keep Learning";
  };

  const getScoreDescription = (score) => {
    if (score >= 80) return "Outstanding! You have a strong grasp of this material.";
    if (score >= 60) return "Great work. You're building a solid foundation.";
    return "Every attempt is a step forward. Keep practicing!";
  };

  const correctAnswers = Math.round((score / 100) * totalQuestions);
  const incorrectAnswers = totalQuestions - correctAnswers;
  
  return (
    <div className="result-page-container">
      <div className="result-card-tech">
        <div className="result-badge-tech">Quiz Completed</div>
        <h1 className="result-title-tech">{getScoreMessage(score)}</h1>
        <p className="result-description-tech">{getScoreDescription(score)}</p>
        
        <div className="result-document-tech">
          <FileText size={16} /> 
          <span>{documentName}</span>
        </div>
        
        <div className="score-display-tech">
          <div className="score-value-tech">
            {score}%
          </div>
          <div className="score-label-tech">Final Score</div>
        </div>

        <div className="stats-grid-tech">
          <div className="stat-item-tech">
            <CheckCircle2 size={20} color="#10b981" />
            <span className="stat-value-tech">{correctAnswers}</span>
            <span className="stat-label-tech">Correct</span>
          </div>
          <div className="stat-item-tech">
            <XCircle size={20} color="#ef4444" />
            <span className="stat-value-tech">{incorrectAnswers}</span>
            <span className="stat-label-tech">Incorrect</span>
          </div>
          <div className="stat-item-tech">
            <FileText size={20} color="var(--text-light)" />
            <span className="stat-value-tech">{totalQuestions}</span>
            <span className="stat-label-tech">Total</span>
          </div>
        </div>

        <div className="result-actions-tech">
          <button 
            className="result-btn-tech result-btn-secondary-tech"
            onClick={() => navigate(`/document/${id}`)}
          >
            <BookOpen size={16} />
            Back to Document
          </button>
          <button 
            className="result-btn-tech result-btn-primary-tech"
            onClick={() => navigate(`/quiz-history`)}
          >
            <LayoutGrid size={16} />
            View History
          </button>
        </div>
      </div>
    </div>
  );
}