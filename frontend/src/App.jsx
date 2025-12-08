import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import "./index.css";

import Navbar from "./components/Navbar.jsx";
import AppNavbar from "./components/AppNavbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./components/pages/Home.jsx";
import Services from "./components/pages/Services.jsx";
import Login from "./components/pages/Login.jsx";
import SignUp from "./components/pages/SignUp.jsx";
import ForgotPassword from "./components/pages/ForgotPassword.jsx";

import HomePage from "./components/pages/HomePage.jsx";
import Profile from "./components/pages/Profile.jsx";
import ProfileEdit from "./components/pages/ProfileEdit.jsx";
import AccountSettings from "./components/pages/AccountSettings.jsx";
import Feedback from "./components/pages/Feedback.jsx";
import MyProfile from "./components/pages/MyProfile.jsx";
import RentalRequests from "./components/pages/RentalRequests";
import SwapRequests from "./components/pages/SwapRequests";
import ReviewsPage from "./components/pages/ReviewsPage.jsx";

import Cart from "./components/Cart.jsx";
import Checkout from "./components/Checkout.jsx";
import Receipt from "./components/pages/Receipt.jsx";
import Chat from "./components/pages/Chat.jsx";

import { CartProvider } from "./context/CartContext.jsx";
import { RentalRequestProvider } from "./components/pages/RentalRequestContext.jsx";
import { SwapRequestProvider } from "./components/pages/SwapRequestContext";

function AppContent() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

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
    "/reviews",
  ];

  const isInsideApp = insideAppRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  return (
    <>
      {isInsideApp ? <AppNavbar /> : <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/services" element={<Services />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/inside-app" element={<HomePage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/account-settings" element={<AccountSettings />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/rentalrequests" element={<RentalRequests />} />
          <Route path="/swaprequests" element={<SwapRequests />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/reviews/:sellerId" element={<ReviewsPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout/:productId" element={<Checkout />} />
          <Route path="/receipt/:transactionId" element={<Receipt />} />
          <Route path="/chat" element={<Chat />} />
        </Route>
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