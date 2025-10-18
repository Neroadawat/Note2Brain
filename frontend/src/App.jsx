import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

// Import Components
import Login from './Login';
import Register from './Register';
import UploadOCR from './UploadOCR';
import Home from './Home';
import Document from './Document';
import Quiz from './Quiz';
import QuizResult from './QuizResult';
import QuizHistory from './QuizHistory';
import Flashcard from './flashcard.jsx';
import FullContext from './FullContext'; // ✨ 1. Import Component ใหม่เข้ามา

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Default & Auth Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Main App Routes */}
          <Route path="/upload" element={<UploadOCR />} />
          <Route path="/home" element={<Home />} />
          
          {/* Document Specific Routes */}
          <Route path="/document/:id" element={<Document />} />
          <Route path="/document/:id/quiz" element={<Quiz />} />
          <Route path="/document/:id/flashcard" element={<Flashcard />} />
          
          {/* ✨ 2. เพิ่ม Route สำหรับ FullContext */}
          <Route path="/document/:id/context" element={<FullContext />} />

          {/* Quiz Flow Routes */}
          <Route path="/quiz/:id/result" element={<QuizResult />} />
          <Route path="/quiz-history" element={<QuizHistory />} />
          
          {/* Generic Flashcard Route (Optional) */}
          <Route path="/flashcard" element={<Flashcard />} />
          
          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;