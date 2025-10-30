import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText, Layers, Lightbulb } from 'lucide-react';
import "./Document.css"; // ตรวจสอบว่า import CSS ถูกต้อง
import QuizGenerate from "./QuizGenerate.jsx"; // ตรวจสอบว่า path นี้ถูกต้อง
import FlashcardGenerate from "./FlashcardGenerate.jsx";

export default function Document() {
  const { id: documentId } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [isGeneratingFlashcard, setIsGeneratingFlashcard] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      // ไม่ต้องส่ง user_id เพราะ Backend Endpoint นี้ไม่ได้รับ
      try {
        // ลบ ?user_id=${userId} ออกจาก URL
        const res = await fetch(`http://localhost:8000/document/${documentId}`);

        if (!res.ok) {
           // ถ้า Backend ตอบ Error (เช่น 404 Not Found)
           const errorData = await res.json().catch(() => ({ detail: "Document not found." }));
           // ไม่ต้องเช็ค access denied เพราะ Backend ไม่ได้เช็ค owner
           throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
        }

        // ✨ รับข้อมูล document object ตรงๆ และเช็คว่ามี id หรือไม่
        const documentData = await res.json();
        if (documentData && documentData.id) {
            setDoc(documentData);
        } else {
             // โยน Error ถ้าข้อมูลที่ได้กลับมาไม่ใช่ document object ที่ถูกต้อง
             throw new Error("Received invalid document data structure from backend.");
        }

      } catch (err) {
        console.error("Error fetching document:", err);
        setDoc(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  // ลบ navigate ออกจาก Dependency Array
  }, [documentId]);

  // ฟังก์ชัน handleCreateQuiz (เหมือนเดิม - ยังเรียก API ที่ถูกต้อง)
  const handleCreateQuiz = async ({ difficulty, numQuestions }) => {
    const userId = localStorage.getItem("userId");
    if (!userId || !documentId) { alert("Error: Missing user or document information."); return; }
    setIsGeneratingQuiz(true);
    setIsModalOpen(false);
    try {
      const response = await fetch(`http://localhost:8000/generate-quiz?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({
          document_id: documentId,
          difficulty: difficulty.toLowerCase(),
          question_count: parseInt(numQuestions, 10),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to generate quiz." }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && result.quiz_id) {
        // ✨ [เพิ่ม] Console Log เพื่อเช็ค userId ก่อน Navigate
        console.log("UserID BEFORE navigate:", localStorage.getItem("userId"));
        navigate(`/quiz/${result.quiz_id}`);
      } else {
        throw new Error(result.detail || 'Quiz ID not received from backend');
       }
    } catch (error) {
        console.error("Error generating quiz:", error);
        alert(`Error generating quiz: ${error.message}\nPlease try again.`);
     }
    finally { setIsGeneratingQuiz(false); }
  };

  // ฟังก์ชัน handleCreateFlashcard
  const handleCreateFlashcard = async ({ numQuestions }) => {
    setIsGeneratingFlashcard(true);
    setIsFlashcardModalOpen(false);
    
    try {
      // Navigate ไปหน้า flashcard พร้อม parameters
      navigate(`/document/${documentId}/flashcard?questions=${numQuestions}`);
    } catch (error) {
      console.error("Error setting up flashcard:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsGeneratingFlashcard(false);
    }
  };

  if (loading) return <div className="home-root"><div>Loading Document...</div></div>;
  if (isGeneratingQuiz) return <div className="home-root"><div>Generating Quiz... Please wait, this might take a moment. 🧠✨</div></div>;
  if (isGeneratingFlashcard) return <div className="home-root"><div>Generating Flashcard... Please wait, this might take a moment. 🧠✨</div></div>;
  // ✨ ปรับข้อความ Error ให้สอดคล้อง
  if (!doc) return <div className="home-root"><div>Document not found. Please go back and try another document.</div></div>;


  return (
    <div className="home-root page-transition">
      <header className="home-header" style={{ position: "relative" }}>
        {/* คุณอาจจะอยากใช้ logo icon ที่ src/logo-icon.png แทน */}
        <img src="/logo.png" alt="logo" className="home-logo" />
        <button className="back-btn" onClick={() => navigate("/home")}>Home</button>
      </header>
      <hr className="home-divider" />
      <main className="home-main">
        <div className="home-section-title">{doc.filename}</div>
        <div className="summary-section">
          <h2 className="summary-title">Summary:</h2>
          <div className="summary-content">
            <p className="summary-text">{doc.summary || "No summary available."}</p>
          </div>
        </div>
        <div className="button-container">
          <button className="simple-button" onClick={() => navigate(`/document/${documentId}/context`)}>
            <FileText size={16} /> Full Context
          </button>
          <button className="simple-button" onClick={() => setIsFlashcardModalOpen(true)}>
            <Layers size={16} /> Flash Card
          </button>
          <button className="simple-button" onClick={() => setIsModalOpen(true)}>
            <Lightbulb size={16} /> Quiz
          </button>
        </div>
      </main>
      <QuizGenerate
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateQuiz={handleCreateQuiz}
        documentName={doc.filename}
      />
      <FlashcardGenerate
        isOpen={isFlashcardModalOpen}
        onClose={() => setIsFlashcardModalOpen(false)}
        onCreateFlashcard={handleCreateFlashcard}
        documentName={doc.filename}
      />
    </div>
  );
}