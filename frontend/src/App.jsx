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

// Pages (Inside App)
import HomePage from "./components/pages/HomePage.jsx";
import Profile from "./components/pages/Profile.jsx";
import ProfileEdit from "./components/pages/ProfileEdit.jsx";
import AccountSettings from "./components/pages/AccountSettings.jsx";
import Feedback from "./components/pages/Feedback.jsx";
import MyProfile from "./components/pages/MyProfile.jsx";
import RentalRequests from "./components/pages/RentalRequests";
import SwapRequests from './components/pages/SwapRequests';
import ReviewsPage from "./components/pages/ReviewsPage.jsx";

// E-Commerce and Chat
import Cart from "./components/Cart.jsx";
import Checkout from "./components/Checkout.jsx";
import Receipt from "./components/pages/Receipt.jsx";
import Chat from "./components/pages/Chat.jsx";

// Context
import { CartProvider } from "./context/CartContext.jsx";
import { RentalRequestProvider } from "./components/pages/RentalRequestContext.jsx";
import { SwapRequestProvider } from './components/pages/SwapRequestContext';


function AppContent() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login state from localStorage
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  const hideNavbarRoutes = ["/profile", "/inside-app", "/app-navbar", "/account-settings", "/feedback", "/my-profile", "/reviews"];

  // ✅ Updated routes inside app layout
  const insideAppRoutes = [
    "/inside-app",
    "/profile",
    "/profile/edit",
    "/my-profile",
    "/account-settings",
    "/feedback",
    "/app-navbar",
    "/cart",
    "/checkout",
    "/receipt",
    "/chat",
    "/rentalrequests",
    "/swaprequests",
    "/reviews"
  ];

  const isInsideApp = insideAppRoutes.some(route =>
      location.pathname.startsWith(route)
    );

  return (
    <>
      {/* ✅ Navbar logic */}
      {isLoggedIn && isInsideApp ? (
        <AppNavbar />
      ) : (
        !isInsideApp && <Navbar />
      )}

      {/* ✅ Routes */}
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/services" element={<Services />} />
        <Route path="/login" element={<Login />} />

        {/* Inside App Pages */}
        <Route path="/inside-app" element={<HomePage />} />
        <Route path="/profile" element={<Profile />} /> {/* Profile Page */}
        <Route path="/my-profile" element={<MyProfile />} /> {/* My Profile Page */}
        <Route path="/profile/edit" element={<ProfileEdit />} /> {/* Profile Edit Page */}
        <Route path="/account-settings" element={<AccountSettings />} /> {/* Account Settings Page */}
        <Route path="/feedback" element={<Feedback />} /> {/* Feedback Page */}
        <Route path="/feedback" element={<Feedback />} /> {/* Feedback Page */}
        <Route path="/rentalrequests" element={<RentalRequests />} /> {/* Rental Requests Page */}
        <Route path="/swaprequests" element={<SwapRequests />} /> {/* Swap Requests Page */}
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/reviews/:sellerId" element={<ReviewsPage />} />
        <Route path="/reviews/:sellerId" element={<ReviewsPage reviews={[]} />} />


        {/* E-Commerce Routes */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/receipt" element={<Receipt />} />

        {/* Chat Route */}
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </>
  );
}
  
export default function App() {
  return (
    <Router>
      <CartProvider>
        <RentalRequestProvider>
          <SwapRequestProvider>
              <AppContent />
            </SwapRequestProvider>
        </RentalRequestProvider>
      </CartProvider>
    </Router>
  );
}
