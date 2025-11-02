import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom"; // ✨ [แก้ไข] ลบ useLocation ที่ไม่ใช้ออก
import "./Document.css"; // ตรวจสอบว่าจำเป็นต้องใช้ CSS นี้หรือไม่
import "./Quiz.css";

export default function Quiz() {
  // ✨ [แก้ไข] รับ quizId จาก URL Parameter แทน id เดิม
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [quizData, setQuizData] = useState(null); // เปลี่ยนชื่อ state เพื่อความชัดเจน
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // state เก็บคำตอบ { questionId: 'A' }
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // ✨ [เพิ่ม] Console Log เพื่อเช็ค userId ตอนเริ่มโหลดหน้า Quiz
    console.log("UserID ON Quiz mount:", localStorage.getItem("userId"));
    const userId = localStorage.getItem("userId");
    if (!userId) {
      // ✨ [เพิ่ม] Console Error ก่อน Redirect
      console.error("User not logged in, redirecting...");
      navigate("/login");
      return;
    }

    const fetchQuizData = async () => {
      const userId = localStorage.getItem("userId");
      const isRetry = location.state?.isRetry || false; // ตรวจสอบว่าเป็นการ Retry หรือไม่
      const mockData = {
        documentName: "Fallback Document",
        questions: [
          { id: "mock1", question: "Mock Question 1?", optionA: "A1", optionB: "B1", optionC: "C1", optionD: "D1", correctAnswer: "A" },
          { id: "mock2", question: "Mock Question 2?", optionA: "A2", optionB: "B2", optionC: "C2", optionD: "D2", correctAnswer: "B" }
        ]
       };
      const endpoint = isRetry
        ? `http://localhost:8000/quiz/${quizId}/retry?user_id=${userId}`
        : `http://localhost:8000/quiz/${quizId}?user_id=${userId}`;

      try {
        const res = await fetch(endpoint);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ detail: "Quiz not found or access denied." }));
          throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
        }
        const result = await res.json();

        if (result.success && result.data && result.data.questions && result.data.questions.length > 0) {
          setQuizData({
            documentName: result.data.document?.filename || "Quiz",
            questions: result.data.questions
          });
        } else {
          console.warn("Received empty or invalid quiz data from API, using mock data.", result);
          setQuizData(mockData);
        }
      } catch (err) {
        console.error("Error fetching quiz data, using mock data:", err);
        setQuizData(mockData);
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      fetchQuizData();
    } else {
      setLoading(false);
      console.error("No Quiz ID provided in URL");
      setQuizData(null);
    }
  }, [quizId, navigate, location.state]);

  // ✨ เก็บคำตอบโดยใช้ question.id เป็น key
  const handleAnswerChange = (answerKey, questionId) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerKey }));
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
     if (quizData?.questions && currentQuestion < quizData.questions.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  // ✨ ฟังก์ชัน handleSubmit ให้เรียก API /submit-quiz
  const handleSubmit = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId || !quizId || !quizData) return;

    const answeredCountSubmit = Object.keys(selectedAnswers).length;
    if (answeredCountSubmit !== quizData.questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/submit-quiz?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: quizId,
          answers: selectedAnswers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to submit quiz." }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const submissionResult = await response.json();
      console.log("Submission Result:", submissionResult);

      if (submissionResult.success) {
        navigate(`/quiz/${quizId}/result`, {
          state: {
            score: submissionResult.score,
            totalQuestions: submissionResult.total,
            answeredCount: answeredCountSubmit,
            documentName: quizData.documentName,
            results: submissionResult.results,
          },
        });
      } else {
        throw new Error(submissionResult.detail || "Submission failed according to backend.");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert(`Error submitting quiz: ${error.message}`);
      setLoading(false);
    }
  };

  if (loading) return <div className="home-root"><div>Loading Quiz...</div></div>;
  if (!quizData || !quizData.questions || quizData.questions.length === 0) return <div className="home-root"><div>Could not load quiz data. Please try generating it again or check the URL.</div></div>;

  const totalQuestions = quizData.questions.length;
  const currentQ = quizData.questions[currentQuestion];
  const isLastQuestion = currentQuestion === totalQuestions - 1;
  const allAnswered = Object.keys(selectedAnswers).length === totalQuestions;

  return (
    <div className="home-root">
      <main className="quiz-main">
        <div className="quiz-section page-transition">
          <div className={`quiz-question-card ${isTransitioning ? 'transitioning' : ''}`}>

            <div className="quiz-card-header">
              <button className="quiz-back-btn" onClick={() => navigate('/home')}>
                ‹ Back to Home
              </button>
            </div>

            <div className="quiz-question-box">
              <div className="quiz-question">{currentQ.question}</div>

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
                    disabled={(isLastQuestion && !allAnswered) || isTransitioning}
                  >
                    <span className="nav-arrow">›</span>
                  </button>
                )}
              </div>
            </div>

            <div className="quiz-options">
              {['A', 'B', 'C', 'D'].map((optionKey) => (
                <label
                  key={optionKey}
                  className={`quiz-option-label ${selectedAnswers[currentQ.id] === optionKey ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={`q_${currentQ.id}`}
                    value={optionKey}
                    checked={selectedAnswers[currentQ.id] === optionKey}
                    onChange={() => handleAnswerChange(optionKey, currentQ.id)}
                  />
                  <span className="option-number">{optionKey}</span>
                  <span className="option-text">{currentQ[`option${optionKey}`]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}