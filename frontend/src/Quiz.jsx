import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Document.css"; // ใช้ style ปุ่มเดิม

export default function Quiz() {
  const { id } = useParams(); // id คือ document id
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`http://localhost:8000/document/${id}/quiz`);
        const data = await res.json();
        setQuiz(data);
      } catch (err) {
        setQuiz(null);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  if (loading) return <div className="home-root"><div>Loading...</div></div>;
  if (!quiz) return <div className="home-root"><div>No quiz found for this document.</div></div>;

  return (
    <div className="home-root">
      <header className="home-header" style={{ position: "relative" }}>
        <img src="/logo.png" alt="logo" className="home-logo" />
        <span className="home-title">note2brain</span>
        <button className="back-btn" onClick={() => navigate(`/document/${id}`)}>
          &#8592; Back
        </button>
      </header>
      <hr className="home-divider" />
      <main className="home-main">
        <div className="home-section-title">Quiz for: {quiz.documentName || "Document"}</div>
        <div className="quiz-section">
          {quiz.questions && quiz.questions.length > 0 ? (
            quiz.questions.map((q, idx) => (
              <div key={q.id || idx} className="quiz-question-card">
                <div className="quiz-question">{idx + 1}. {q.question}</div>
                <div className="quiz-options">
                  <label><input type="radio" name={`q${idx}`} /> {q.optionA}</label>
                  <label><input type="radio" name={`q${idx}`} /> {q.optionB}</label>
                  <label><input type="radio" name={`q${idx}`} /> {q.optionC}</label>
                  <label><input type="radio" name={`q${idx}`} /> {q.optionD}</label>
                </div>
              </div>
            ))
          ) : (
            <div>No questions available.</div>
          )}
        </div>
      </main>
    </div>
  );
}