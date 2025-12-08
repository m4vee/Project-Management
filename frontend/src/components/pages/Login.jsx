import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { initiateLogin, verifyLoginOtp } from "../../services/api"; 
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();

  // STATES
  const [step, setStep] = useState(1); // 1: Credentials, 2: OTP
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    otp: "" 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); 
  };

  // STEP 1: VALIDATE PASSWORD & SEND OTP
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await initiateLogin(formData.email, formData.password);
      setStep(2); 
    } catch (err) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: VERIFY OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userData = await verifyLoginOtp(formData.email, formData.otp);
      
      // Save Token & User Info to LocalStorage
      localStorage.setItem("token", userData.token); 
      localStorage.setItem("username", userData.username);
      
      // ✅ FIX: Save user_id so posting works!
      if (userData.user_id) {
          localStorage.setItem("user_id", userData.user_id);
      }
      
      localStorage.setItem("isLoggedIn", "true");
      window.dispatchEvent(new Event("storage"));
      
      navigate("/inside-app"); 
    } catch (err) {
      setError(err.message || "Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="form-box-login">
          
          {/* --- STEP 1 FORM --- */}
          {step === 1 && (
            <form onSubmit={handleCredentialsSubmit} className="fade-in">
              <h1>Login</h1>

              {error && <div className="message error">{error}</div>}

              <div className="input-box">
                <input
                  type="email"
                  name="email"
                  placeholder="TUP Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
                <i className="fa-solid fa-envelope"></i>
              </div>

              <div className="input-box">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
                <i className="fa-solid fa-lock"></i>
              </div>

              <div className="options-row">
                 <label className="remember-me">
                   <input type="checkbox" /> Remember Me
                 </label>
                 <span className="forgot-password">Forgot Password?</span>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Login"}
              </button>

              <div className="signup-link">
                <p>
                  Don't have an account? <span onClick={() => navigate("/signup")}>Sign Up</span>
                </p>
              </div>
            </form>
          )}

          {/* --- STEP 2 FORM: OTP --- */}
          {step === 2 && (
            <form onSubmit={handleOtpSubmit} className="fade-in">
              <h1>Verification</h1>
              <p className="otp-instruction">
                Enter the code sent to <br/> <b>{formData.email}</b>
              </p>

              {error && <div className="message error">{error}</div>}

              <div className="input-box">
                <input
                  type="text"
                  name="otp"
                  placeholder="• • • • • •"
                  value={formData.otp}
                  onChange={handleInputChange}
                  maxLength="6"
                  disabled={loading}
                  required
                  className="otp-input"
                />
                <i className="fa-solid fa-key"></i>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Verify Login"}
              </button>

              <div className="signup-link">
                <p>
                  Wrong email? <span onClick={() => setStep(1)}>Go Back</span>
                </p>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;