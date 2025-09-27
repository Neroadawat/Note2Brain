import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Document.css";

export default function Document() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  if (loading) return <div className="home-root"><div>Loading...</div></div>;
  if (!doc) return <div className="home-root"><div>File not found.</div></div>;

  return (
    <div className="home-root">
      <header className="home-header" style={{ position: "relative" }}>
        <img src="/logo.png" alt="logo" className="home-logo" />
        <span className="home-title">note2brain</span>
        <button
          className="back-btn"
          onClick={() => navigate("/home")}
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            background: "#eee",
            border: "none",
            borderRadius: 8,
            padding: "0.5rem 1.2rem",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
          }}
        >
          &#8592; Home
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
        <div style={{ display: "flex", gap: 32, justifyContent: "center" }}>
          <button className="home-upload-btn" onClick={() => navigate(`/flashcard/${doc.id}`)}>
            Flash card
          </button>
          <button className="home-upload-btn" onClick={() => navigate(`/quiz/${doc.id}`)}>
            Quiz
          </button>
        </div>
      </main>
    </div>
  );
}