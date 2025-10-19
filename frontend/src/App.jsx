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

// Layout สำหรับหน้าที่มี Navbar
const MainLayout = () => {
  const location = useLocation();

  return (
    <>
      <Navbar />
      <main>
        {/* ✨ [แก้ไข] เพิ่ม div ครอบ Outlet เพื่อทำ Animation */}
        <div className="page-container" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </>
  );
};

// ... (ส่วนที่เหลือของ App.jsx เหมือนเดิม)
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Routes ที่ไม่มี Navbar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />

          {/* Routes ที่มี Navbar อยู่ภายใต้ MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/upload" element={<UploadOCR />} />
            <Route path="/home" element={<Home />} />
            <Route path="/document/:id" element={<Document />} />
            <Route path="/document/:id/quiz" element={<Quiz />} />
            <Route path="/document/:id/flashcard" element={<Flashcard />} />
            <Route path="/document/:id/context" element={<FullContext />} />
            <Route path="/quiz/:id/result" element={<QuizResult />} />
            <Route path="/quiz-history" element={<QuizHistory />} />
            <Route path="/flashcard" element={<Flashcard />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;