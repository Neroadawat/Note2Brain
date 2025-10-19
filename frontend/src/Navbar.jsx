import React from 'react';
// ✨ [เพิ่ม] import useLocation
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  // ✨ [เพิ่ม] เรียกใช้ useLocation เพื่อดู URL ปัจจุบัน
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/login");
  };

  // ✨ [เพิ่ม] เช็คว่าเมนูหลัก (ไม่ใช่โลโก้) กำลังถูกเลือกอยู่หรือไม่
  const isNavItemActive = ['/home', '/quiz-history', '/upload'].includes(location.pathname);

  return (
    <header className="navbar-header">
      <nav className="navbar-container">
        <Link to="/home" className="navbar-brand">
          {/* ✨ [แก้ไข] เพิ่มเงื่อนไขในการใส่ Class */}
          <span className={isNavItemActive ? 'logo-static' : 'logo-animated'}>
            note2brain
          </span>
        </Link>

        <div className="navbar-right-menu">
          <NavLink to="/home" className="navbar-item">
            Home
          </NavLink>
          <NavLink to="/quiz-history" className="navbar-item">
            History
          </NavLink>
          <NavLink to="/upload" className="navbar-item">
            Upload
          </NavLink>
          
          <button className="navbar-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
}