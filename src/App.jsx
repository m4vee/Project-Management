import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import "./index.css";

// Components
import Navbar from "./components/Navbar.jsx";
import AppNavbar from "./components/AppNavbar.jsx";

// Pages
import Home from "./components/pages/Home.jsx";
import Services from "./components/pages/Services.jsx";
import Login from "./components/pages/Login.jsx";
import SignUp from "./components/pages/SignUp.jsx";
<<<<<<< HEAD
import HomePage from "./components/pages/HomePage.jsx"; // Inside app page
import AppNavbar from "./components/AppNavbar.jsx"; // AppNavbar for logged-in state
import Profile from "./components/pages/Profile.jsx"; // Profile Component
import ProfileEdit from "./components/pages/ProfileEdit.jsx"; // Profile Edit Component
import AccountSettings from "./components/pages/AccountSettings.jsx"; // Account Settings Page
import Feedback from "./components/pages/Feedback.jsx"; // Feedback Page
import MyProfile from "./components/pages/MyProfile.jsx"; // MyProfile Component (newly added)
=======
import HomePage from "./components/pages/HomePage.jsx";
import Profile from "./components/pages/Profile.jsx";
import ProfileEdit from "./components/pages/ProfileEdit.jsx";

// Inside-app sections
import Cart from "./components/Cart.jsx";
import Checkout from "./components/Checkout.jsx";
import Receipt from "./components/pages/Receipt.jsx";
import Chat from "./components/pages/Chat.jsx"; // ✅ updated import path to match your Chat.jsx file

// Cart Context
import { CartProvider } from "./context/CartContext.jsx";
>>>>>>> brian

function AppContent() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login state from localStorage
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

<<<<<<< HEAD
  const hideNavbarRoutes = ["/profile", "/inside-app", "/app-navbar", "/account-settings", "/feedback", "/my-profile"];
=======
  // ✅ Updated routes inside app layout
  const insideAppRoutes = [
    "/profile",
    "/profile/edit",
    "/inside-app",
    "/app-navbar",
    "/cart",
    "/checkout",
    "/receipt",
    "/chat"
  ];

  const isInsideApp = insideAppRoutes.includes(location.pathname);
>>>>>>> brian

  return (
    <>
      {/* ✅ Correct Navbar logic remains unchanged */}
      {isLoggedIn && isInsideApp ? (
        <AppNavbar />
      ) : (
        !isInsideApp && <Navbar />
      )}

      {/* ✅ All Routes kept intact */}
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/services" element={<Services />} />
        <Route path="/login" element={<Login />} />

        {/* Inside App Pages */}
        <Route path="/inside-app" element={<HomePage />} />
<<<<<<< HEAD
        <Route path="/profile" element={<Profile />} /> {/* Profile Page */}
        <Route path="/my-profile" element={<MyProfile />} /> {/* My Profile Page */}
        <Route path="/profile/edit" element={<ProfileEdit />} /> {/* Profile Edit Page */}
        <Route path="/account-settings" element={<AccountSettings />} /> {/* Account Settings Page */}
        <Route path="/feedback" element={<Feedback />} /> {/* Feedback Page */}
=======
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />

        {/* E-Commerce Routes */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/receipt" element={<Receipt />} />

        {/* ✅ Chat Route — now fully integrated */}
        <Route path="/chat" element={<Chat />} />
>>>>>>> brian
      </Routes>
    </>
  );
}
  
export default function App() {
  return (
    <Router>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </Router>
  );
}
