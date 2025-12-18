import React, { useEffect } from "react"; 
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
import UserProfile from "./components/pages/UserProfile.jsx";
import ProfileEdit from "./components/pages/ProfileEdit.jsx";
import AccountSettings from "./components/pages/AccountSettings.jsx";
import Feedback from "./components/pages/Feedback.jsx";
import MyProfile from "./components/pages/MyProfile.jsx";
import RentalRequests from "./components/pages/RentalRequests.jsx";
import SwapRequests from "./components/pages/SwapRequests.jsx";
import Chat from "./components/pages/Chat.jsx";
import Receipt from "./components/pages/Receipt.jsx";
import UserRatingsPage from "./components/pages/UserRatingsPage.jsx"; 

import TransactionStatus from "./components/TransactionStatus.jsx"; 
import Cart from "./components/Cart.jsx";
import Checkout from "./components/Checkout.jsx";
import NotificationsView from "./components/NotificationsView.jsx";

import { CartProvider } from "./context/CartContext.jsx"; 
import { RentalRequestProvider } from "./components/pages/RentalRequestContext.jsx";
import { SwapRequestProvider } from "./components/pages/SwapRequestContext.jsx";

function AppContent() {
    const location = useLocation();

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
        "/notifications",
        "/transactions",
        "/my-posts",
    ];

    const isInsideApp = insideAppRoutes.some((route) =>
        location.pathname.startsWith(route)
    ) || location.pathname.startsWith("/profile/")
      || location.pathname.startsWith("/user-ratings/");

    const noNavbarRoutes = ["/login", "/sign-up", "/signup", "/forgot-password"];
    const showNavbar = !noNavbarRoutes.includes(location.pathname);

    // add/remove a body class so global components (like HeroSection) can hide on auth pages
    useEffect(() => {
        if (noNavbarRoutes.includes(location.pathname)) {
            document.body.classList.add('auth-page');
        } else {
            document.body.classList.remove('auth-page');
        }
    }, [location.pathname]);

    return (
        <>
            {showNavbar && (isInsideApp ? <AppNavbar /> : <Navbar />)}

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
                    <Route path="/profile/:userId" element={<UserProfile />} />
                    <Route path="/my-profile" element={<MyProfile />} />
                    <Route path="/my-posts" element={<Profile />} />
                    <Route path="/profile/edit" element={<ProfileEdit />} />
                    
                    <Route path="/account-settings" element={<AccountSettings />} />
                    
                    <Route path="/feedback" element={<Feedback />} />
                    <Route path="/rentalrequests" element={<RentalRequests />} />
                    <Route path="/swaprequests" element={<SwapRequests />} />
                    
                    <Route path="/user-ratings/:userId" element={<UserRatingsPage />} />

                    <Route path="/notifications" element={<NotificationsView />} />

                    <Route path="/cart" element={<Cart />} />
                    
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/checkout/:productId" element={<Checkout />} />
                    
                    <Route path="/receipt/:transactionId" element={<Receipt />} />
                    <Route path="/transactions" element={<TransactionStatus />} />

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