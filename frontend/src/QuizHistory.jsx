import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Trash2, 
  RotateCw, 
  View 
} from 'lucide-react';

import './QuizHistory.css'; 

export default function QuizHistory() {
  const navigate = useNavigate();
  const [quizHistory, setQuizHistory] = useState([]);

  useEffect(() => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem('quizHistory') || '[]');
      setQuizHistory(savedHistory);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      setQuizHistory([]);
    }
  }, []);

  const handleClearHistory = () => {
    localStorage.removeItem('quizHistory');
    setQuizHistory([]);
  };

  // ✨ 1. เพิ่มฟังก์ชันสำหรับจัดการปุ่มต่างๆ
  const handleDeleteItem = (itemId) => {
    // กรองเอาเฉพาะรายการที่ไม่ตรงกับ id ที่ต้องการลบ
    const updatedHistory = quizHistory.filter(item => item.id !== itemId);
    // อัปเดต State เพื่อให้หน้าจอเปลี่ยนแปลง
    setQuizHistory(updatedHistory);
    // บันทึกข้อมูลที่อัปเดตแล้วลง localStorage
    localStorage.setItem('quizHistory', JSON.stringify(updatedHistory));
  };

  const handleRetryQuiz = (documentId) => {
    // นำทางไปยังหน้าทำควิซของเอกสารนั้นๆ
    navigate(`/document/${documentId}/quiz`);
  };

  const handleViewResult = (quizItem) => {
    // เตรียมข้อมูลที่จะส่งไปให้หน้าแสดงผล
    const resultData = {
      score: quizItem.score,
      totalQuestions: quizItem.totalQuestions,
      documentName: quizItem.documentName,
      answeredCount: quizItem.totalQuestions // สมมติว่าตอบครบทุกข้อ
    };
    // นำทางไปยังหน้าผลลัพธ์ พร้อมส่งข้อมูลไปด้วย
    navigate(`/quiz/${quizItem.documentId}/result`, { state: resultData });
  };

  const getGrade = (score) => {
    if (score >= 90) return { text: 'A+', color: '#059669' };
    if (score >= 80) return { text: 'A', color: '#059669' };
    if (score >= 70) return { text: 'B+', color: '#0284c7' };
    if (score >= 60) return { text: 'B', color: '#0284c7' };
    if (score >= 50) return { text: 'C', color: '#d97706' };
    return { text: 'F', color: '#dc2626' };
  };

  if (quizHistory.length === 0) {
    return (
      <div className="history-container">
        <div className="empty-state">
          <History size={64} className="empty-icon" />
          <h2 className="empty-title">No Quiz History</h2>
          <p className="empty-description">
            It looks like you haven't taken any quizzes yet. Start learning and test your knowledge!
          </p>
          <button className="empty-btn" onClick={() => navigate('/')}>
            Explore Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <header className="history-header">
        <h1 className="history-title">Quiz History</h1>
        <button className="clear-history-btn" onClick={handleClearHistory}>
          <Trash2 size={16} />
          Clear All History
        </button>
      </header>

      <main className="history-list">
        {quizHistory.map((item, index) => {
          const grade = getGrade(item.score);
          const correctAnswers = Math.round((item.score / 100) * item.totalQuestions);
          const incorrectAnswers = item.totalQuestions - correctAnswers;
          
          return (
            <div 
              key={item.id} 
              className="history-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="history-card-header">
                <div className="history-info">
                  <h3 className="history-doc-name">{item.documentName}</h3>
                  <p className="history-date">{new Date(item.date).toLocaleString()}</p>
                </div>
                <div className="history-score-badge">{item.score}%</div>
              </div>
              <div className="history-card-body">
                <div className="history-stat-row">
                  <div className="history-stat">
                    <CheckCircle2 size={20} color="#10b981" />
                    <span className="stat-text">Correct: {correctAnswers}</span>
                  </div>
                  <div className="history-stat">
                    <XCircle size={20} color="#ef4444" />
                    <span className="stat-text">Incorrect: {incorrectAnswers}</span>
                  </div>
                  <div className="history-stat">
                    <FileText size={20} color="#8892b0" />
                    <span className="stat-text">Total: {item.totalQuestions}</span>
                  </div>
                  <div className="history-grade" style={{ color: grade.color }}>
                    Grade: {grade.text}
                  </div>
                </div>
                <div className="history-progress-bar">
                  <div
                    className="history-progress-fill"
                    style={{ width: `${item.score}%` }}
                  ></div>
                </div>
              </div>
              <footer className="history-card-footer">
                {/* ✨ 2. เพิ่ม onClick ให้กับปุ่มทั้งหมด */}
                <button className="history-action-btn view-btn" onClick={() => handleViewResult(item)}>
                  <View size={16} /> View
                </button>
                <button className="history-action-btn retry-btn" onClick={() => handleRetryQuiz(item.documentId)}>
                  <RotateCw size={16} /> Retry
                </button>
                <button className="history-action-btn delete-btn" onClick={() => handleDeleteItem(item.id)}>
                  <Trash2 size={16} /> Delete
                </button>
              </footer>
            </div>
          );
        })}
      </main>
    </div>
  );
}