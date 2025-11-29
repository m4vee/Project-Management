import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOTP, verifyOTP, registerUser } from "../../services/api";
import "../../index.css";
import "./SignUp.css";

export default function SignUp() {
  const [step, setStep] = useState(1); // 1: send OTP, 2: verify OTP, 3: create account
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    otp: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(""); // Clear error when user types
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    console.log("=== SEND CODE CLICKED ===");
    console.log("Step:", step);
    console.log("Email:", formData.email);

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Calling sendOTP...");
      await sendOTP(formData.email);
      console.log("OTP sent successfully!");
      setSuccess("OTP sent! Check your email.");
      setStep(2);
    } catch (err) {
      console.error("Error sending OTP:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await verifyOTP(formData.email, formData.otp);
      setSuccess("Email verified! Now create your password.");
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const userData = {
        name: formData.username,
        email: formData.email,
        password: formData.password,
      };

      await registerUser(userData);
      setSuccess("Account created successfully!");

      // Redirect after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await sendOTP(formData.email);
      setSuccess("OTP resent! Check your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-wrapper">
        <form
          onSubmit={
            step === 1
              ? handleSendCode
              : step === 2
              ? handleVerifyOTP
              : handleCreateAccount
          }
        >
          <h1>Sign Up</h1>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: "10px",
                marginBottom: "15px",
                background: "#ffebee",
                color: "#c62828",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div
              style={{
                padding: "10px",
                marginBottom: "15px",
                background: "#e7f5e7",
                color: "#2e7d32",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              {success}
            </div>
          )}

          {/* Step 1 & 3: Username Input */}
          {(step === 1 || step === 3) && (
            <div className="input-box">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={loading || step === 3}
                required
              />
              <i className="fa-solid fa-user"></i>
            </div>
          )}

          {/* Step 1: Email Input */}
          {step === 1 && (
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
          )}

          {/* Step 2: Show email (read-only) */}
          {step === 2 && (
            <div className="input-box">
              <input
                type="email"
                value={formData.email}
                disabled
                style={{ background: "#f5f5f5" }}
              />
              <i className="fa-solid fa-envelope"></i>
            </div>
          )}

          {/* Step 2: OTP Input */}
          {step === 2 && (
            <div className="input-box fade-in">
              <input
                type="text"
                name="otp"
                placeholder="Enter 6-digit Code"
                value={formData.otp}
                onChange={(e) => {
                  // Only allow numbers and max 6 digits
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setFormData({ ...formData, otp: value });
                  setError("");
                }}
                disabled={loading}
                maxLength="6"
                required
                style={{
                  letterSpacing: "8px",
                  textAlign: "center",
                  fontSize: "20px",
                }}
              />
              <i className="fa-solid fa-lock"></i>
            </div>
          )}

          {/* Step 3: Password Input */}
          {step === 3 && (
            <div className="input-box fade-in">
              <input
                type="password"
                name="password"
                placeholder="Create Password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                minLength="6"
                required
              />
              <i className="fa-solid fa-lock"></i>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="signup-btn"
            disabled={loading}
            onClick={() => console.log("BUTTON CLICKED!")}
            style={{
              opacity: loading ? 0.6 : 1,
              position: "relative",
              zIndex: 9999,
              pointerEvents: "auto",
            }}
          >
            {loading
              ? "Processing..."
              : step === 1
              ? "Send Code"
              : step === 2
              ? "Verify Code"
              : "Create Account"}
          </button>

          {/* Resend OTP Button (Step 2 only) */}
          {step === 2 && (
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "10px",
                background: "transparent",
                color: "#007bff",
                border: "1px solid #007bff",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
              }}
            >
              Resend Code
            </button>
          )}

          {/* Change Email Button (Step 2 only) */}
          {step === 2 && (
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setFormData({ ...formData, otp: "" });
                setError("");
                setSuccess("");
              }}
              style={{
                marginTop: "10px",
                background: "none",
                border: "none",
                color: "#666",
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "14px",
              }}
            >
              Change email
            </button>
          )}

          <div className="login-link">
            <p>
              Already have an account?{" "}
              <a href="/login" className="login-text">
                Log In
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
