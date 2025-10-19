import React, { useState } from 'react';
import './QuizGenerate.css';

export default function QuizGenerate({ isOpen, onClose, onCreateQuiz, documentName }) {
  const [difficulty, setDifficulty] = useState('Easy');
  // ✨ ตั้งค่าเริ่มต้นให้เป็น 1 หรือค่าอื่นที่เหมาะสม
  const [numQuestions, setNumQuestions] = useState(10); 

  if (!isOpen) {
    return null;
  }

  const handleCreateClick = () => {
    // ตรวจสอบอีกครั้งว่าค่าไม่ต่ำกว่า 1 ก่อนส่ง
    const finalNumQuestions = Math.max(1, Number(numQuestions));
    onCreateQuiz({ difficulty, numQuestions: finalNumQuestions });
    onClose();
  };

  const handleNumChange = (e) => {
    // ป้องกันการใส่ค่าว่างหรือค่าที่ไม่ใช่ตัวเลข
    const value = e.target.value;
    setNumQuestions(value === '' ? '' : Number(value));
  };


  return (
    <div className="quiz-modal-overlay" onClick={onClose}>
      <div className="quiz-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Setup Quiz</h2>
        <p className="doc-name">Document: {documentName}</p>
        
        <div className="quiz-form-group">
          <label htmlFor="difficulty">Difficulty Level</label>
          <select 
            id="difficulty" 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div className="quiz-form-group">
          <label htmlFor="numQuestions">Number of Questions</label>
          {/* ✨ [แก้ไข] เปลี่ยน min เป็น 1 และลบ max ออก */}
          <input 
            type="number" 
            id="numQuestions" 
            value={numQuestions}
            onChange={handleNumChange}
            min="1" // ห้ามน้อยกว่า 1
            // ไม่มี max attribute อีกต่อไป
          />
        </div>

        <div className="quiz-modal-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          {/* ป้องกันการกดสร้างถ้ายังไม่ได้ใส่จำนวนข้อ */}
          <button 
            className="create-btn" 
            onClick={handleCreateClick}
            disabled={!numQuestions || Number(numQuestions) < 1}
          >
            Create Quiz
          </button>
        </div>
      </div>
    </div>
  );
}