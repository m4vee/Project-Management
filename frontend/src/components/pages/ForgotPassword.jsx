import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendForgotPasswordOTP, resetPasswordConfirm } from "../../services/api";
import "./Login.css"; // Reuse Login CSS para identical ang design!

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Handle Step 1: Send Code
  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await sendForgotPasswordOTP(email);
      setSuccess("Reset code sent to your email.");
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Verify & Reset (Pinagsama ko na sa backend logic)
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) return setError("Password too short (min 8 chars).");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await resetPasswordConfirm(email, otp, newPassword);
      setSuccess("Password reset successfully! Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="form-box-login">
          
          <h1 style={{fontSize: '2rem'}}>Reset Password</h1>

          {error && <div className="message error">{error}</div>}
          {success && <div className="message success">{success}</div>}

          {/* STEP 1: ENTER EMAIL */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="fade-in">
              <p style={{color: '#ddd', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem'}}>
                Enter your registered TUP Email to receive a reset code.
              </p>
              <div className="input-box">
                <input
                  type="email"
                  placeholder="TUP Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <i className="fa-solid fa-envelope"></i>
              </div>
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Send Code"}
              </button>
            </form>
          )}

          {/* STEP 2 & 3: OTP + NEW PASSWORD */}
          {step >= 2 && (
            <form onSubmit={handleResetSubmit} className="fade-in">
              
              {/* OTP Field */}
              <div className="input-box">
                <input
                  type="text"
                  placeholder="Enter 6-Digit Code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength="6"
                  required
                  style={{textAlign: 'center', letterSpacing: '3px', fontWeight: 'bold'}}
                />
                <i className="fa-solid fa-key"></i>
              </div>

              {/* New Password */}
              <div className="input-box">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <i 
                  className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{cursor: 'pointer', pointerEvents: 'auto'}}
                ></i>
              </div>

              {/* Confirm Password */}
              <div className="input-box">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <i className="fa-solid fa-check-double"></i>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Reset Password"}
              </button>
            </form>
          )}

          <div className="signup-link">
            <p>Remembered it? <span onClick={() => navigate("/login")}>Log In</span></p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;