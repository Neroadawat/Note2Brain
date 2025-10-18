import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import UploadOCR  from './UploadOCR';
import Home from './Home';
import Document from './Document';
import Quiz from './Quiz';
import QuizResult from './QuizResult';
import QuizHistory from './QuizHistory';
import Flashcard from './flashcard.jsx';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/upload" element={<UploadOCR />} />
          <Route path="/home" element={<Home />} />
          <Route path="/document/:id" element={<Document />} />
          <Route path="/document/:id/quiz" element={<Quiz />} />
          <Route path="/quiz/:id/result" element={<QuizResult />} />
          <Route path="/quiz-history" element={<QuizHistory />} />
          <Route path="/document/:id/flashcard" element={<Flashcard />} />
          <Route path="/flashcard" element={<Flashcard />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;