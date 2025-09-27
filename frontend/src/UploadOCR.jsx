import { useState } from 'react';
import './UploadOCR.css';
import { useNavigate } from "react-router-dom";
import "./Document.css"; // ใช้ style summary เดียวกับ Document

export default function UploadOCR() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a PDF file');
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error("User not logged in");
      }

      const response = await fetch(`http://localhost:8000/upload?user_id=${userId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('OCR process failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-card">
        {/* ส่วนหัวเหมือน Document */}
        <header className="home-header" style={{ position: "relative", marginBottom: 16 }}>
          <img src="/logo.png" alt="logo" className="home-logo" />
          <span className="home-title">note2brain</span>
          <button
            className="back-btn"
            onClick={() => navigate("/home")}
          >
            &#8592; Home
          </button>
        </header>
        <hr className="home-divider" />

        <h1 className="upload-title">
          PDF OCR Extractor
        </h1>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="file-upload-area">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="file-input"
            />
          </div>

          <button
            type="submit"
            disabled={!file || loading}
            className="submit-button"
          >
            {loading ? 'Processing...' : 'Extract Text'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {result && (
          <div className="result-section">
            <h2 className="result-title">
              Extracted Text:
            </h2>
            <div className="result-content">
              <pre className="result-text">
                {result.ocr_text}
              </pre>
            </div>
            
            {/* Summary section ใช้ style เดียวกับ Document */}
            <div className="summary-section">
              <h2 className="summary-title">Summary:</h2>
              <div className="summary-content">
                <p className="summary-text">
                  {result.summary}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}