import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText, Layers, Lightbulb } from 'lucide-react';
import "./Document.css";
import QuizGenerate from "./QuizGenerate.jsx";

export default function Document() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // ✨ 1. เปลี่ยนชื่อ state เพื่อความชัดเจน
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await fetch(`http://localhost:8000/document/${id}`);
        const data = await res.json();
        setDoc(data);
      } catch (err) {
        setDoc(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  // ✨ 2. เพิ่มฟังก์ชันสำหรับจัดการการสร้าง Quiz
  const handleCreateQuiz = ({ difficulty, numQuestions }) => {
    // ปิด Modal
    setIsModalOpen(false);
    // นำทางไปยังหน้า Quiz พร้อมส่งค่าที่เลือกไปด้วย
    navigate(`/document/${id}/quiz?difficulty=${difficulty}&questions=${numQuestions}`);
  };

  if (loading) return <div className="home-root"><div>Loading...</div></div>;
  if (!doc) return <div className="home-root"><div>File not found.</div></div>;

  return (
    <div className="home-root">
      <header className="home-header" style={{ position: "relative" }}>
        <img src="/logo.png" alt="logo" className="home-logo" />
        <button
          className="back-btn"
          onClick={() => navigate("/home")}
        >
          Home
        </button>
      </header>
      <hr className="home-divider" />
      <main className="home-main">
        <div className="home-section-title">{doc.filename}</div>
        <div className="summary-section">
          <h2 className="summary-title">Summary:</h2>
          <div className="summary-content">
            <p className="summary-text">
              {doc.summary || "No summary."}
            </p>
          </div>
        </div>
        <div className="button-container">
          <button className="simple-button" onClick={() => navigate(`/document/${id}/context`)}>
            <FileText size={16} />
            Full Context
          </button>
          <button className="simple-button" onClick={() => navigate(`/document/${id}/flashcard`)}>
            <Layers size={16} />
            Flash Card
          </button>
          <button className="simple-button" onClick={() => setIsModalOpen(true)}>
            <Lightbulb size={16} />
            Quiz
          </button>
          
          {/* ✨ 3. แก้ไขการเรียกใช้ Component และ Props ให้ถูกต้อง */}
          <QuizGenerate
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onCreateQuiz={handleCreateQuiz}
            documentName={doc.filename}
          />

        </div>
      </main>
    </div>
  );
}