import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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

  const { quizId } = useParams();

  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [animatedIncorrect, setAnimatedIncorrect] = useState(0);
  const [animatedCorrect, setAnimatedCorrect] = useState(0);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

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

  useEffect(() => {
    const animateNumber = (
      setValue,
      endValue,
      duration = 1000,
      delay = 0,
      easing = t => t
    ) => {
      const startTime = Date.now() + delay;
      const endTime = startTime + duration;

      const runAnimation = () => {
        const now = Date.now();
        const remaining = Math.max(endTime - now, 0);
        const progress = 1 - (remaining / duration);

        if (progress < 1) {
          const easedProgress = easing(progress);
          setValue(Math.round(easedProgress * endValue));
          requestAnimationFrame(runAnimation);
        } else {
          setValue(endValue);
        }
      };

      setTimeout(() => requestAnimationFrame(runAnimation), delay);
    };

    // Easing function for smooth animation
    const easeOutQuad = t => t * (2 - t);

    // Animate total first
    animateNumber(setAnimatedTotal, totalQuestions, 800, 200, easeOutQuad);

    // Then animate incorrect
    animateNumber(setAnimatedIncorrect, incorrectAnswers, 800, 1000, easeOutQuad);

    // Then animate correct
    animateNumber(setAnimatedCorrect, correctAnswers, 800, 1800, easeOutQuad);

    // Finally animate percentage
    animateNumber(setAnimatedPercentage, percentage, 1000, 2600, easeOutQuad);

  }, [totalQuestions, incorrectAnswers, correctAnswers, percentage]);

  // เพิ่มฟังก์ชันสร้าง confetti
  const createConfetti = () => {
    if (percentage === 100) {
      const colors = ['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff', '#4b0082'];
      const shapes = ['circle', 'square', 'triangle'];
      
      for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        
        // Random position and style
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        // Random shape
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        if (shape === 'circle') {
          confetti.style.borderRadius = '50%';
        } else if (shape === 'triangle') {
          confetti.style.width = '0';
          confetti.style.height = '0';
          confetti.style.borderLeft = '5px solid transparent';
          confetti.style.borderRight = '5px solid transparent';
          confetti.style.borderBottom = '10px solid ' + colors[Math.floor(Math.random() * colors.length)];
          confetti.style.backgroundColor = 'transparent';
        }
        
        // Random animation duration and delay
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 2;
        confetti.style.animation = `confetti-fall ${duration}s linear ${delay}s`;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), (duration + delay) * 1000);
      }
    }
  };

  useEffect(() => {
    // เพิ่ม effect สำหรับคะแนนเต็ม
    if (percentage === 100) {
      const timer = setTimeout(() => {
        createConfetti();
      }, 3000); // รอให้ตัวเลขนับเสร็จก่อน

      return () => clearTimeout(timer);
    }
  }, [percentage]);

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
          <div className={percentage === 100 ? "perfect-score-container" : ""}>
            <div className={`score-value-tech ${percentage === 100 ? 'perfect-score' : ''}`}>
              {animatedPercentage}%
            </div>
          </div>
          <div className="score-label-tech">Final Score</div>
        </div>

        <div className="stats-grid-tech">
          <div className="stat-item-tech">
            <CheckCircle2 size={20} color="#10b981" />
            <span className="stat-value-tech correct">{animatedCorrect}</span>
            <span className="stat-label-tech correct">Correct</span>
          </div>
          <div className="stat-item-tech">
            <XCircle size={20} color="#ef4444" />
            <span className="stat-value-tech incorrect">{animatedIncorrect}</span>
            <span className="stat-label-tech incorrect">Incorrect</span>
          </div>
          <div className="stat-item-tech">
            <FileText size={20} color="var(--text-light)" />
            <span className="stat-value-tech total">{animatedTotal}</span>
            <span className="stat-label-tech total">Total</span>
          </div>
        </div>

        <div className="result-actions-tech">
          <button 
            className="result-btn-tech result-btn-secondary-tech"
            onClick={() => navigate(`/document/${documentId}`)}
            disabled={!documentId}
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
          <button
            className="result-btn-tech result-btn-outline-tech"
            onClick={() => navigate(`/quiz/${quizId}/answer`)}
            disabled={!quizId}
          >
            <CheckCircle2 size={16} />
            Review Answers
          </button>
        </div>
      </div>
    </div>
  );
}