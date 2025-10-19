import React, { useEffect, useState } from "react";
import "./Home.css"; // ✨ 1. นำ import .css กลับมา
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocuments = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        navigate("/login");
        return;
      }
      try {
        const res = await fetch(`http://localhost:8000/documents?user_id=${userId}`);
        const data = await res.json();
        setDocuments(data);
      } catch (err) {
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [navigate]);

  return (
    <>
      {/* ✨ 2. ลบ <style> tag ออก */}
      <div className="home-root page-transition">
        <header className="home-header">
          <img src="/logo.png" alt="logo" className="home-logo" />
        </header>
        
        <main className="home-main">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="home-doc-list">
              {documents.length === 0 ? (
                <div className="home-empty">No uploaded files.</div>
              ) : (
                documents.map((doc) => (
                  <div
                    className="home-doc-card"
                    key={doc.id}
                    onClick={() => navigate(`/document/${doc.id}`)}
                  >
                    <div className="home-doc-icon">
                      <img src="/logo.png" alt="file" className="home-doc-img" />
                    </div>
                    <div className="home-doc-name">{doc.filename}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      <div className="home-upload-btn-wrap">
        <button className="home-upload-btn" onClick={() => navigate("/upload")}>
          <span className="home-upload-plus">+</span>
          <span className="home-upload-text">Upload files</span>
        </button>
      </div>
    </>
  );
}

