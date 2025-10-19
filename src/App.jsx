import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import "./index.css";
import Navbar from "./components/Navbar.jsx";
import Home from "./components/pages/Home.jsx";
import Services from "./components/pages/Services.jsx";
import Login from "./components/pages/Login.jsx";
import SignUp from "./components/pages/SignUp.jsx";
import HomePage from "./components/pages/HomePage.jsx"; // This is your inside app

function AppContent() {
  const location = useLocation();

  // Hide Navbar inside the logged-in app
  const hideNavbarRoutes = ["/inside-app"];

  return (
    <>
      {!hideNavbarRoutes.includes(location.pathname) && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/services" element={<Services />} />
        <Route path="/login" element={<Login />} />
        <Route path="/inside-app" element={<HomePage />} /> {/* Changed here */}
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
