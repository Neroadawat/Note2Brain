import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet, useLocation } from 'react-router-dom';

// Import Components
import Navbar from './Navbar';
import Login from './Login';
import Register from './Register';
import UploadOCR from './UploadOCR';
import Home from './Home';
import Document from './Document';
import Quiz from './Quiz';
import QuizResult from './QuizResult';
import QuizHistory from './QuizHistory';
import Flashcard from './flashcard';
import FullContext from './FullContext';

import './animations.css';

// Layout for pages with Navbar
const MainLayout = () => {
  const location = useLocation();

  return (
    <>
      <Navbar />
      <main>
        <div className="page-container" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Routes without Navbar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />

          {/* Routes with Navbar under MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/upload" element={<UploadOCR />} />
            <Route path="/home" element={<Home />} />
            <Route path="/document/:id" element={<Document />} />
            {/* ✨ **EDITED**: Changed route for Quiz */}
            <Route path="/quiz/:quizId" element={<Quiz />} />
            <Route path="/document/:id/flashcard" element={<Flashcard />} />
            <Route path="/document/:id/context" element={<FullContext />} />
            {/* ✨ **EDITED**: Changed route for QuizResult */}
            <Route path="/quiz/:quizId/result" element={<QuizResult />} />
            <Route path="/quiz-history" element={<QuizHistory />} />
            {/* If flashcard page uses document ID, keep /document/:id/flashcard or adjust */}
            {/* Assuming a general flashcard page might exist at /flashcard */}
            <Route path="/flashcard" element={<Flashcard />} /> 
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;