import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import './FullContext.css';

export default function FullContext() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="context-container"><div>Loading...</div></div>;
  }

  if (!doc) {
    return <div className="context-container"><div>Document not found.</div></div>;
  }

  return (
    <div className="context-container">
      <header className="context-header">
        <h1 className="context-title">{doc.filename}</h1>
        <button className="context-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Back
        </button>
      </header>

      <main className="context-main">
        <div className="context-content-box">
          <pre className="context-text">
            {/* ✨ แก้ไขบรรทัดนี้ให้ใช้ doc.fullText */}
            {doc.fullText || "Full text is not available."}
          </pre>
        </div>
      </main>
    </div>
  );
}