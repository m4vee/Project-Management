import React, { useState } from "react";
import "./AppNavbar.css";
import Notification from "./Notification"; // ✅ correct place for the import
import { Link } from "react-router-dom";

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
       <Notification />
        <i className="fa-solid fa-comment"></i>
        <i className="fa-solid fa-cart-shopping"></i>
        <div className="profile-icon">
          <Link to="/profile">
  <img src="/images/mikha.webp" alt="User" />
</Link>

        </div>
      </div>
    </nav>
  );
}
