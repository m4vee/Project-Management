import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendOTP, verifyOTP, registerUser } from "../../services/api"; 
import "./SignUp.css";

export default function SignUp() {
  const [step, setStep] = useState(1); 
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    otp: "",
    password: "",
    confirmPassword: "" 
  });

  const [timer, setTimer] = useState(0); 
  const [canResend, setCanResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 
  const [agreed, setAgreed] = useState(false); 
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const getPasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score++; 
    if (pass.length > 12) score++; 
    if (/[A-Z]/.test(pass)) score++; 
    if (/[0-9]/.test(pass)) score++; 
    if (/[^A-Za-z0-9]/.test(pass)) score++; 
    return score > 4 ? 4 : score; 
  };
  
  const strengthScore = getPasswordStrength(formData.password);
  const strengthColors = ["#e0e0e0", "#ff4d4d", "#ffad33", "#00e676", "#006400"]; 
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); 
    setSuccess("");
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    const email = formData.email.trim();
    const username = formData.username.trim(); 
    
    if (!username) return setError("Username is required");
    if (!email.endsWith("@tup.edu.ph")) return setError("Please use a valid TUP Email (@tup.edu.ph)");

    setLoading(true);
    try {
      await sendOTP(email, username); 
      
      setSuccess("Verification code sent to your email.");
      setStep(2);
      setTimer(60); 
      setCanResend(false);
    } catch (err) {
      setError(err.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await sendOTP(formData.email.trim(), formData.username.trim());
      setSuccess("New code sent!");
      setTimer(60);
      setCanResend(false);
    } catch (err) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOTP(formData.email.trim(), formData.otp.trim());
      setSuccess("Email verified! Please create your password.");
      setStep(3);
    } catch (err) {
      setError(err.message || "Invalid or expired Code.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password.length < 8) {
      return setError("Password must be at least 8 characters long.");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match!");
    }

    if (!agreed) {
      return setError("You must agree to the Terms & Services to proceed.");
    }

    setLoading(true);
    try {
      await registerUser({
        name: formData.username,
        email: formData.email.trim(),
        password: formData.password,
      });
      
      setSuccess("Account created successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-wrapper">
        <form onSubmit={step === 1 ? handleSendCode : step === 2 ? handleVerifyOTP : handleRegister}>
          
          <h1>{step === 3 ? "Set Password" : "Sign Up"}</h1>

          {error && <div className="message error">{error}</div>}
          {success && <div className="message success">{success}</div>}

          {step === 1 && (
            <div className="fade-in">
              <div className="input-box">
                <input
                  type="text"
                  name="username"
                  placeholder="Full Name / Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  autoComplete="name"
                />
                <i className="fa-solid fa-user"></i>
              </div>

              <div className="input-box">
                <input
                  type="email"
                  name="email"
                  placeholder="TUP Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  autoComplete="email"
                />
                <i className="fa-solid fa-envelope"></i>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in">
              <p style={{fontSize: '0.9rem', marginBottom: '20px', color: '#fff'}}>
                Enter the 6-digit code sent to <br/> 
                <strong style={{color: '#00c3ff'}}>{formData.email}</strong>
              </p>
              
              <div className="input-box">
                <input
                  type="text"
                  name="otp"
                  placeholder="Enter Code"
                  maxLength="6"
                  value={formData.otp}
                  onChange={handleInputChange}
                  required
                  autoComplete="one-time-code"
                  style={{ textAlign: "center", letterSpacing: "8px", fontSize: "1.2rem", fontWeight: "bold" }}
                />
                <i className="fa-solid fa-key"></i>
              </div>

              <div style={{ marginTop: "15px", marginBottom: "20px", fontSize: "0.85rem" }}>
                {timer > 0 ? (
                  <span style={{ color: "#ccc" }}>Resend code in {timer}s</span>
                ) : (
                  <span 
                    onClick={handleResendCode} 
                    style={{ color: "#00c3ff", cursor: loading ? "default" : "pointer", textDecoration: "underline", fontWeight: "bold" }}
                  >
                    Resend Code
                  </span>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="fade-in">
              
              <div className="input-box">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <i 
                  className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: "pointer", pointerEvents: "auto" }}
                ></i>
              </div>

              {formData.password && (
                <div style={{ width: "100%", marginBottom: "15px", marginTop: "-10px", textAlign: "left" }}>
                  <div style={{ height: "4px", width: "100%", background: "rgba(255,255,255,0.2)", borderRadius: "2px" }}>
                    <div style={{ 
                      height: "100%", 
                      width: `${(strengthScore / 4) * 100}%`, 
                      background: strengthColors[strengthScore], 
                      borderRadius: "2px",
                      transition: "width 0.3s ease, background 0.3s ease"
                    }}></div>
                  </div>
                  <p style={{ color: strengthColors[strengthScore], fontSize: "0.75rem", marginTop: "5px", fontWeight: "bold" }}>
                    Strength: {strengthLabels[strengthScore]}
                  </p>
                </div>
              )}

              <div className="input-box">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                <i 
                  className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ cursor: "pointer", pointerEvents: "auto" }}
                ></i>
              </div>

              <div style={{ display: "flex", alignItems: "center", fontSize: "0.8rem", marginBottom: "20px", marginTop: "10px", textAlign: "left" }}>
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={agreed} 
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ width: "16px", height: "16px", marginRight: "10px", accentColor: "#00c3ff" }}
                />
                <label htmlFor="terms" style={{ color: "#eee", cursor: "pointer" }}>
                  I agree to the <span style={{ color: "#00c3ff", fontWeight: "bold" }}>Terms & Services</span>
                </label>
              </div>

            </div>
          )}

          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : step === 1 ? "Send Code" : step === 2 ? "Verify Code" : "Create Account"}
          </button>

          <div className="login-link">
            <p>
              Already have an account? <span onClick={() => navigate("/login")}>Log In</span>
            </p>
          </div>

        </form>
      </div>
    </div>
  );
}