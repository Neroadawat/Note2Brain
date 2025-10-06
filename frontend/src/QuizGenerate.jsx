import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // เพิ่ม import
import "./QuizGenerate.css";


export default function QuizGenrate({ document, onClose, onCreated }) {
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // เพิ่ม useNavigate

  const handleSubmit = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("กรุณาเข้าสู่ระบบก่อน");
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`http://localhost:8000/generate-quiz?user_id=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: document.id,
          difficulty,
          question_count: Number(questionCount),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "สร้างควิซไม่สำเร็จ");

      alert("✅ สร้างควิซสำเร็จ!");
      onClose(); 
      onCreated(data.quiz_id); 
      
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quiz-modal-overlay">
      <div className="quiz-modal-content">
        <h2>สร้าง Quiz จากเอกสารนี้</h2>
        <p className="doc-name">{document.filename}</p>

        <div className="quiz-form-group">
          <label>ระดับความยาก:</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">ง่าย (Easy)</option>
            <option value="medium">ปานกลาง (Medium)</option>
            <option value="hard">ยาก (Hard)</option>
          </select>
        </div>

        <div className="quiz-form-group">
          <label>จำนวนคำถาม:</label>
          <input
            type="number"
            min="1"
            max="20"
            value={questionCount}
            onChange={(e) => setQuestionCount(e.target.value)}
          />
        </div>

        <div className="quiz-modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            className="create-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "กำลังสร้าง..." : "สร้าง Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}