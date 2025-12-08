import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import "./AppNavbar.css";

export default function AppNavbar() {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("isLoggedIn");
    window.dispatchEvent(new Event("storage"));
    navigate("/login");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav className="app-navbar">
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
      </div>

      <div className="app-navbar-right">
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
                background: "#00c3ff",
                color: "white",
                borderRadius: "50%",
                padding: "2px 6px",
                fontSize: "12px",
                fontWeight: "bold"
              }}
            >
              {cartItems.length}
            </span>
          )}
        </div>

        <div className="profile-menu-container" style={{ position: "relative" }}>
          <div className="profile-icon" onClick={toggleDropdown}>
            <img src="/images/no_profile.jpg" alt="User" />
          </div>

          {isDropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={() => { navigate("/profile"); setIsDropdownOpen(false); }}>
                <i className="fa-solid fa-user"></i> My Profile
              </div>
              <div className="dropdown-item" onClick={() => { navigate("/account-settings"); setIsDropdownOpen(false); }}>
                <i className="fa-solid fa-gear"></i> Settings
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item logout" onClick={handleLogout}>
                <i className="fa-solid fa-right-from-bracket"></i> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}