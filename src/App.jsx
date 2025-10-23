import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "./index.css";
import Navbar from "./components/Navbar.jsx";
import Home from "./components/pages/Home.jsx";
import Services from "./components/pages/Services.jsx";
import Login from "./components/pages/Login.jsx";
import SignUp from "./components/pages/SignUp.jsx";
import HomePage from "./components/pages/HomePage.jsx"; // Inside app page
import AppNavbar from "./components/AppNavbar.jsx"; // AppNavbar for logged-in state
import Profile from "./components/pages/Profile.jsx"; // Profile Component
import ProfileEdit from "./components/pages/ProfileEdit.jsx"; // Profile Edit Component
import AccountSettings from "./components/pages/AccountSettings.jsx"; // Account Settings Page
import Feedback from "./components/pages/Feedback.jsx"; // Feedback Page
import MyProfile from "./components/pages/MyProfile.jsx"; // MyProfile Component (newly added)

function AppContent() {
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  const hideNavbarRoutes = ["/profile", "/inside-app", "/app-navbar", "/account-settings", "/feedback", "/my-profile"];

  return (
    <>
      {/* Conditionally render Navbar or AppNavbar based on login status */}
      {isLoggedIn && !hideNavbarRoutes.includes(location.pathname) ? (
        <AppNavbar />
      ) : (
        !hideNavbarRoutes.includes(location.pathname) && <Navbar />
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/services" element={<Services />} />
        <Route path="/login" element={<Login />} />
        <Route path="/inside-app" element={<HomePage />} />
        <Route path="/profile" element={<Profile />} /> {/* Profile Page */}
        <Route path="/my-profile" element={<MyProfile />} /> {/* My Profile Page */}
        <Route path="/profile/edit" element={<ProfileEdit />} /> {/* Profile Edit Page */}
        <Route path="/account-settings" element={<AccountSettings />} /> {/* Account Settings Page */}
        <Route path="/feedback" element={<Feedback />} /> {/* Feedback Page */}
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
