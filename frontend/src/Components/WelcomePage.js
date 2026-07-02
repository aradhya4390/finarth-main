// WelcomePage.js
import React, { useState } from 'react';
import './WelcomePage.css';

const WelcomePage = ({ onEnterApp }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleEnterApp = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onEnterApp();
    }, 800);
  };

  return (
    <div className={`welcome-container ${isAnimating ? 'fade-out' : ''}`}>
      <div className="welcome-content">
        <div className="logo-section">
          <div className="logo">
            <div className="logo-icon"></div>
          </div>
          <h1 className="app-title">Finarth</h1>
          <p className="app-subtitle">Your Complete Personal Finance Management Solution</p>
        </div>
        
      

        <button className="btn btn-primary enter-btn" onClick={handleEnterApp}>
          <span>Enter Application</span>
          <div className="btn-arrow">→</div>
        </button>

        <div className="welcome-footer">
          <p>Take control of your finances today</p>
        </div>
      </div>
      
      <div className="background-elements">
        <div className="floating-element element-1">💸</div>
        <div className="floating-element element-2">📱</div>
        <div className="floating-element element-3">💎</div>
        <div className="floating-element element-4">🏦</div>
      </div>
    </div>
  );
};

export default WelcomePage;