import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Document.css";
import "./Quiz.css";

export default function Quiz() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      // Mock data สำหรับทดสอบ
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
        
        // เช็คว่ามีข้อมูลหรือไม่
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

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleNext = () => {
    if (quiz?.questions && currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  if (loading) return <div className="home-root"><div>Loading...</div></div>;
  if (!quiz) return <div className="home-root"><div>No quiz found for this document.</div></div>;

  const totalQuestions = quiz.questions?.length || 0;
  const currentQ = quiz.questions?.[currentQuestion];

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
            <div className="quiz-question-card">
              <div className="quiz-question-box">
                <div className="quiz-navigation">
                  <button 
                    className="quiz-nav-btn" 
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                  >
                    ←
                  </button>
                  <span>{currentQuestion + 1} / {totalQuestions}</span>
                  <button 
                    className="quiz-nav-btn" 
                    onClick={handleNext}
                    disabled={currentQuestion === totalQuestions - 1}
                  >
                    →
                  </button>
                </div>
                <div className="quiz-question">{currentQ.question}</div>
              </div>
              <div className="quiz-options">
                <label>
                  <input type="radio" name={`q${currentQuestion}`} value="A" />
                  1) {currentQ.optionA}
                </label>
                <label>
                  <input type="radio" name={`q${currentQuestion}`} value="B" />
                  2) {currentQ.optionB}
                </label>
                <label>
                  <input type="radio" name={`q${currentQuestion}`} value="C" />
                  3) {currentQ.optionC}
                </label>
                <label>
                  <input type="radio" name={`q${currentQuestion}`} value="D" />
                  4) {currentQ.optionD}
                </label>
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