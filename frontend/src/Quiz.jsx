import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Document.css";
import "./Quiz.css";

export default function Quiz() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      const mockData = {
        documentName: "Sample Document",
        questions: [
          {
            id: 1,
            question: "What is React?",
            optionA: "A JavaScript library for building user interfaces",
            optionB: "A programming language",
            optionC: "A database management system",
            optionD: "An operating system"
          },
          {
            id: 2,
            question: "What does JSX stand for?",
            optionA: "JavaScript XML",
            optionB: "Java Syntax Extension",
            optionC: "JavaScript Extension",
            optionD: "Java XML"
          }
        ]
      };

      try {
        const res = await fetch(`http://localhost:8000/document/${id}/quiz`);
        const data = await res.json();
        console.log("Quiz data from API:", data);
        console.log("Questions length:", data?.questions?.length);
        
        if (data && data.questions && data.questions.length > 0) {
          console.log("Using real data from API");
          setQuiz(data);
        } else {
          console.log("API returned empty questions, using mock data");
          setQuiz(mockData);
        }
      } catch (err) {
        console.error("Error fetching quiz:", err);
        console.log("Error occurred, using mock data");
        setQuiz(mockData);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  const handleAnswerChange = (answer) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: answer
    });
  };

  const handlePrevious = () => {
    if (currentQuestion > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleNext = () => {
    if (quiz?.questions && currentQuestion < quiz.questions.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleSubmit = () => {
    // คำนวณคะแนน
    const answeredCount = Object.keys(selectedAnswers).length;
    const score = Math.floor((answeredCount / totalQuestions) * 100);
    
    // บันทึก history ลง localStorage
    const quizHistory = {
      id: Date.now(),
      documentId: id,
      documentName: quiz.documentName,
      score: score,
      totalQuestions: totalQuestions,
      answeredQuestions: answeredCount,
      date: new Date().toISOString(),
      answers: selectedAnswers
    };
    
    // เก็บใน localStorage
    try {
      const existingHistory = JSON.parse(localStorage.getItem('quizHistory') || '[]');
      existingHistory.unshift(quizHistory); // เพิ่มรายการใหม่ไว้ด้านบน
      localStorage.setItem('quizHistory', JSON.stringify(existingHistory));
      console.log('Quiz history saved:', quizHistory);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
    
    // ไปหน้าแสดงผล
    navigate(`/quiz/${id}/result`, { 
      state: { 
        score, 
        totalQuestions, 
        answeredCount,
        documentName: quiz.documentName 
      } 
    });
  };

  if (loading) return <div className="home-root"><div>Loading...</div></div>;
  if (!quiz) return <div className="home-root"><div>No quiz found for this document.</div></div>;

  const totalQuestions = quiz.questions?.length || 0;
  const currentQ = quiz.questions?.[currentQuestion];
  const isLastQuestion = currentQuestion === totalQuestions - 1;
  const allAnswered = Object.keys(selectedAnswers).length === totalQuestions;

  return (
    <div className="home-root">
      <header className="home-header" style={{ position: "relative" }}>
        <img src="/logo.png" alt="logo" className="home-logo" />
        <span className="home-title">note2brain</span>
        <button className="back-btn" onClick={() => navigate(`/document/${id}`)}>
          Back
        </button>
      </header>
      <hr className="home-divider" />
      <main className="home-main">
        <div className="quiz-section">
          {currentQ ? (
            <div className={`quiz-question-card ${isTransitioning ? 'transitioning' : ''}`}>
              <div className="quiz-question-box">
                <div className="quiz-navigation">
                  <button 
                    className="quiz-nav-btn quiz-nav-prev" 
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0 || isTransitioning}
                  >
                    <span className="nav-arrow">‹</span>
                  </button>
                  <span className="quiz-counter">
                    <span className="current-number">{currentQuestion + 1}</span>
                    <span className="divider">/</span>
                    <span className="total-number">{totalQuestions}</span>
                  </span>
                  {isLastQuestion && allAnswered ? (
                    <button 
                      className="quiz-submit-btn" 
                      onClick={handleSubmit}
                      disabled={isTransitioning}
                    >
                      Submit
                    </button>
                  ) : (
                    <button 
                      className="quiz-nav-btn quiz-nav-next" 
                      onClick={handleNext}
                      disabled={currentQuestion === totalQuestions - 1 || isTransitioning}
                    >
                      <span className="nav-arrow">›</span>
                    </button>
                  )}
                </div>
                <div className="quiz-question">{currentQ.question}</div>
              </div>
              <div className="quiz-options">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <label 
                    key={option}
                    className={`quiz-option-label ${selectedAnswers[currentQuestion] === option ? 'selected' : ''}`}
                  >
                    <input 
                      type="radio" 
                      name={`q${currentQuestion}`} 
                      value={option}
                      checked={selectedAnswers[currentQuestion] === option}
                      onChange={() => handleAnswerChange(option)}
                    />
                    <span className="option-content">
                      <span className="option-number">{option}</span>
                      <span className="option-text">{currentQ[`option${option}`]}</span>
                    </span>
                    <span className="option-check"></span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div>No questions available.</div>
          )}
        </div>
      </main>
    </div>
  );
}