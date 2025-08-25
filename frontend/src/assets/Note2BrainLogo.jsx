import React from 'react';

const Note2BrainLogo = () => (
  <div className="logo">
    <div className="logo-icon">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="15" width="60" height="70" rx="8" ry="8" fill="#104880" stroke="#104880" strokeWidth="2"/>
        <circle cx="30" cy="25" r="2" fill="white"/>
        <circle cx="30" cy="35" r="2" fill="white"/>
        <circle cx="30" cy="45" r="2" fill="white"/>
        <circle cx="30" cy="55" r="2" fill="white"/>
        <circle cx="30" cy="65" r="2" fill="white"/>
        <circle cx="30" cy="75" r="2" fill="white"/>
        <path d="M25 20 Q28 22 25 28 Q28 32 25 38 Q28 42 25 48 Q28 52 25 58 Q28 62 25 68 Q28 72 25 78"
          stroke="white" strokeWidth="1.5" fill="none"/>
        <g transform="translate(42, 30)">
          <path d="M5 15 Q5 8 12 8 Q18 8 20 12 Q25 8 32 12 Q35 15 35 20 Q35 25 32 28 Q30 32 25 32 Q20 35 15 32 Q10 35 8 30 Q5 25 5 20 Z"
            fill="#2563eb" stroke="#2563eb" strokeWidth="1"/>
          <path d="M12 12 Q15 15 18 12 Q22 15 25 12 Q28 15 30 18"
            stroke="white" strokeWidth="1.5" fill="none"/>
          <path d="M8 20 Q12 18 15 20 Q20 18 25 20 Q30 22 32 25"
            stroke="white" strokeWidth="1.5" fill="none"/>
        </g>
      </svg>
    </div>
    <div className="logo-text">note2brain</div>
  </div>
);

export default Note2BrainLogo;