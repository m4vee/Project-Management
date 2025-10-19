import React from "react";
import "./AppNavbar.css";

export default function AppNavbar() {
  return (
    <nav className="app-navbar">
      <div className="app-navbar-left">
        <div className="app-logo">
          <img src="/images/logo.jpg" alt="TUPulse" />
          <h2>TUPulse <i className='fab fa-typo3'></i></h2>
        </div>
        
        <div className="search-bar">
          <input type="text" placeholder="Search" />
          <i className="fa-solid fa-magnifying-glass"></i>
        </div>
      </div>

      <div className="app-navbar-right">
        <i className="fa-solid fa-bell"></i>
        <i className="fa-solid fa-comment"></i>
        <i className="fa-solid fa-cart-shopping"></i>
        <div className="profile-icon">
          <img src="/images/mikha.webp" alt="User" />
        </div>
      </div>
    </nav>
  );
}
