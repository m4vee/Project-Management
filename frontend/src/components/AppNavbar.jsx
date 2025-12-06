import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx"; // ✅ for cart context
import Notification from "./Notification";
import "./AppNavbar.css";

export default function AppNavbar() {
  const navigate = useNavigate();
  const { cartItems } = useCart(); // ✅ real-time cart updates from context

  return (
    <nav className="app-navbar">
      {/* ===== Left Section ===== */}
      <div className="app-navbar-left">
        <div
          className="app-logo"
          onClick={() => navigate("/inside-app")}
          style={{ cursor: "pointer" }}
        >
          <h2>
            TUPulse <i className="fab fa-typo3"></i>
          </h2>
        </div>

        {/*<div className="search-bar">
          <input type="text" placeholder="Search" />
          <i className="fa-solid fa-magnifying-glass"></i>
        </div>*/}
      </div>

      {/* ===== Right Section ===== */}
      <div className="app-navbar-right">
        {/* 💬 Chat Icon */}
        {/*<i
          className="fa-solid fa-comment"
          onClick={() => navigate("/chat")}
          title="Chat"
          style={{ cursor: "pointer" }}
        ></i>*/}

        {/* 🛒 Cart Icon */}
        <div
          className="cart-icon-wrapper"
          style={{ position: "relative", cursor: "pointer" }}
          onClick={() => navigate("/cart")}
          title="Cart"
        >
          <i className="fa-solid fa-cart-shopping"></i>
          {cartItems.length > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-6px",
                right: "-8px",
                background: "red",
                color: "white",
                borderRadius: "50%",
                padding: "2px 6px",
                fontSize: "12px",
              }}
            >
              {cartItems.length}
            </span>
          )}
        </div>

        {/* 👤 Profile */}
        <div className="profile-icon">
          <Link to="/profile">
            <img src="/images/no_profile.jpg" alt="User" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
