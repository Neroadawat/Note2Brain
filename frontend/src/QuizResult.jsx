import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutGrid, CheckCircle2, XCircle, FileText } from 'lucide-react';
import './QuizResult.css';

export default function QuizResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const { score, totalQuestions, answeredCount, documentName, documentId } = location.state || {
    score: 0,
    totalQuestions: 0,
    answeredCount: 0,
    documentName: "Unknown Document",
    documentId: null,
  };

  const getScoreMessage = (percentage) => {
    if (percentage >= 80) return "Excellent Performance";
    if (percentage >= 60) return "Good Progress";
    return "Keep Learning";
  };

  const getScoreDescription = (percentage) => {
    if (percentage >= 80) return "Outstanding! You have a strong grasp of this material.";
    if (percentage >= 60) return "Great work. You're building a solid foundation.";
    return "Every attempt is a step forward. Keep practicing!";
  };

  const percentage = Math.round((score / totalQuestions) * 100); // คำนวณเปอร์เซ็นต์
  const correctAnswers = score; // จำนวนคำตอบที่ถูกต้อง
  const incorrectAnswers = totalQuestions - score; // จำนวนคำตอบที่ผิด

  return (
    <div className="result-page-container">
      <div className="result-card-tech">
        <div className="result-badge-tech">Quiz Completed</div>
        <h1 className="result-title-tech">{getScoreMessage(percentage)}</h1>
        <p className="result-description-tech">{getScoreDescription(percentage)}</p>
        
        <div className="result-document-tech">
          <FileText size={16} /> 
          <span>{documentName}</span>
        </div>
        
        <div className="score-display-tech">
          <div className="score-value-tech">
            {percentage}%
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
            onClick={() => navigate(`/document/${documentId}`)}
            disabled={!documentId} // ปิดการใช้งานปุ่มหากไม่มี documentId
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