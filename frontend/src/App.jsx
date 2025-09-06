import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import UploadOCR  from './UploadOCR';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/upload" element={<UploadOCR />} />
          <Route path="*" element={<Login />} /> {/* default to login */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;