import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './flashcard.css';

export default function Flashcard() {
  const { id } = useParams(); // รับ document id จาก URL
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateFlashcards = async () => {
    if (!id) {
      setError('ไม่พบ document ID');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/flashcards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFlashcards(data.flashcards);
      setCurrentCard(0);
      setIsFlipped(false);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      setError('ไม่สามารถสร้าง flashcard ได้');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate เมื่อมี document id
  useEffect(() => {
    if (id) {
      generateFlashcards();
    }
  }, [id]);

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsFlipped(false);
    }
  };

  if (loading) {
    return (
      <div className="flashcard-container">
        <div className="loading">กำลังสร้าง flashcard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flashcard-container">
        <div className="error">{error}</div>
        <button onClick={generateFlashcards} className="btn-generate">
          ลองใหม่
        </button>
        {id && (
          <button onClick={() => navigate(`/document/${id}`)} className="btn-generate">
            กลับไปหน้าเอกสาร
          </button>
        )}
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="flashcard-container">
        <h1>Flashcard</h1>
        <button onClick={generateFlashcards} className="btn-generate">
          สร้าง Flashcard
        </button>
        {id && (
          <button onClick={() => navigate(`/document/${id}`)} className="btn-generate">
            กลับไปหน้าเอกสาร
          </button>
        )}
      </div>
    );
  }

  const card = flashcards[currentCard];

  return (
    <div className="flashcard-container">
      <h1>Flashcard</h1>
      
      <div className="card-counter">
        {currentCard + 1} / {flashcards.length}
      </div>

      <div className={`card ${isFlipped ? 'flipped' : ''}`} onClick={flipCard}>
        <div className="card-inner">
          <div className="card-front">
            <div className="card-content">
              <h3>คำถาม</h3>
              <p>{card.question}</p>
            </div>
          </div>
          <div className="card-back">
            <div className="card-content">
              <h3>คำตอบ</h3>
              <p>{card.answer}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card-controls">
        <button 
          onClick={prevCard} 
          disabled={currentCard === 0}
          className="btn-nav"
        >
          ← ก่อนหน้า
        </button>
        
        <button onClick={flipCard} className="btn-flip">
          {isFlipped ? 'ดูคำถาม' : 'ดูคำตอบ'}
        </button>
        
        <button 
          onClick={nextCard} 
          disabled={currentCard === flashcards.length - 1}
          className="btn-nav"
        >
          ถัดไป →
        </button>
      </div>

      <div className="card-controls">
        <button onClick={generateFlashcards} className="btn-generate">
          สร้างใหม่
        </button>
        {id && (
          <button onClick={() => navigate(`/document/${id}`)} className="btn-generate">
            กลับไปหน้าเอกสาร
          </button>
        )}
      </div>
    </div>
  );
}