import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import UploadOCR  from './UploadOCR';
import Home from './Home';
import Document from './Document';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/upload" element={<UploadOCR />} />
          <Route path="/home" element={<Home />} />
          <Route path="/document/:id" element={<Document />} />
          <Route path="*" element={<Login />} /> {/* default to login */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;