import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './flashcard.css';

export default function Flashcard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [direction, setDirection] = useState(''); // 'next' or 'prev'
  const [isTransitioning, setIsTransitioning] = useState(false);

  const generateFlashcards = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    if (id) {
      generateFlashcards();
    }
  }, [id, generateFlashcards]);

  const flipCard = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const nextCard = useCallback(() => {
    if (currentCard < flashcards.length - 1 && !isTransitioning) {
      setDirection('next');
      setIsTransitioning(true);
      setIsFlipped(false);
      
      setTimeout(() => {
        setCurrentCard(prev => prev + 1);
        setTimeout(() => {
          setIsTransitioning(false);
          setDirection('');
        }, 50);
      }, 300);
    }
  }, [currentCard, flashcards.length, isTransitioning]);

  const prevCard = useCallback(() => {
    if (currentCard > 0 && !isTransitioning) {
      setDirection('prev');
      setIsTransitioning(true);
      setIsFlipped(false);
      
      setTimeout(() => {
        setCurrentCard(prev => prev - 1);
        setTimeout(() => {
          setIsTransitioning(false);
          setDirection('');
        }, 50);
      }, 300);
    }
  }, [currentCard, isTransitioning]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (flashcards.length === 0 || isTransitioning) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevCard();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextCard();
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          flipCard();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flashcards.length, flipCard, nextCard, prevCard, isTransitioning]);

  if (loading) {
    return (
      <div className="flashcard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>กำลังสร้าง flashcard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flashcard-container">
        <div className="error-box">
          <h2>เกิดข้อผิดพลาด</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={generateFlashcards} className="btn-generate">
              ลองใหม่
            </button>
            {id && (
              <button onClick={() => navigate(`/document/${id}`)} className="btn-secondary">
                กลับไปหน้าเอกสาร
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="flashcard-container">
        <div className="empty-state">
          <h1>Flashcard</h1>
          <p>ยังไม่มี flashcard สำหรับเอกสารนี้</p>
          <button onClick={generateFlashcards} className="btn-generate">
            สร้าง Flashcard
          </button>
          {id && (
            <button onClick={() => navigate(`/document/${id}`)} className="btn-secondary">
              กลับไปหน้าเอกสาร
            </button>
          )}
        </div>
      </div>
    );
  }

  const card = flashcards[currentCard];
  const progress = ((currentCard + 1) / flashcards.length) * 100;

  return (
    <div className="flashcard-container">
      <div className="flashcard-header">
        <button onClick={() => navigate(`/document/${id}`)} className="btn-back">
          กลับ
        </button>
        <h1>Flashcard</h1>
        <div className="spacer"></div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
      
      <div className="card-counter">
        การ์ดที่ {currentCard + 1} จาก {flashcards.length}
      </div>

      <div className="card-wrapper">
        <div 
          className={`card ${isFlipped ? 'flipped' : ''} ${direction ? `slide-${direction}` : ''} ${isTransitioning ? 'transitioning' : ''}`} 
          onClick={flipCard}
        >
          <div className="card-inner">
            <div className="card-front">
              <div className="card-label">คำถาม</div>
              <div className="card-content">
                <p>{card.question}</p>
              </div>
              <div className="card-hint">คลิกเพื่อดูคำตอบ</div>
            </div>
            <div className="card-back">
              <div className="card-label">คำตอบ</div>
              <div className="card-content">
                <p>{card.answer}</p>
              </div>
              <div className="card-hint">คลิกเพื่อดูคำถาม</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-controls">
        <button 
          onClick={prevCard} 
          disabled={currentCard === 0 || isTransitioning}
          className="btn-nav"
          aria-label="การ์ดก่อนหน้า"
        >
          <span className="btn-text">ก่อนหน้า</span>
        </button>
        
        <button onClick={flipCard} className="btn-flip" disabled={isTransitioning}>
          {isFlipped ? 'ดูคำถาม' : 'ดูคำตอบ'}
        </button>
        
        <button 
          onClick={nextCard} 
          disabled={currentCard === flashcards.length - 1 || isTransitioning}
          className="btn-nav"
          aria-label="การ์ดถัดไป"
        >
          <span className="btn-text">ถัดไป</span>
        </button>
      </div>

      <div className="keyboard-hint">
        เคล็ดลับ: ใช้ลูกศร ← → เพื่อเปลี่ยนการ์ด และ Space/Enter เพื่อพลิกการ์ด
      </div>

      <div className="action-controls">
        <button onClick={generateFlashcards} className="btn-regenerate" disabled={isTransitioning}>
          สร้างใหม่
        </button>
      </div>
    </div>
  );
}