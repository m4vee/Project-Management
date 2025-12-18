import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserProfile, updateUserSettings } from "../../services/api";
import "./AccountSettings.css";

const BACKEND_URL = "http://127.0.0.1:5000";

export default function AccountSettings() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");
  const userEmail = localStorage.getItem("email"); // Need email for OTP flow

  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // --- OTP STATE ---
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState("");

  // --- GENERAL FORM STATE ---
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    course: "",
    year_level: ""
  });

  // --- PASSWORD FORM STATE ---
  const [passData, setPassData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      const data = await fetchUserProfile(userId, userId);
      setFormData({
        username: data.username || "",
        bio: data.bio || "",
        course: data.course || "",
        year_level: data.year_level || ""
      });
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  // --- HANDLER: GENERAL PROFILE UPDATE ---
  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await updateUserSettings({ ...formData, user_id: userId });
      setMessage({ type: "success", text: "Profile updated successfully!" });
      localStorage.setItem("username", formData.username);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: STEP 1 - REQUEST OTP ---
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (passData.new_password !== passData.confirm_password) {
        setMessage({ type: "error", text: "New passwords do not match." });
        return;
    }

    if (passData.new_password.length < 8) {
        setMessage({ type: "error", text: "Password must be at least 8 characters." });
        return;
    }

    setLoading(true);
    try {
        const response = await fetch(`${BACKEND_URL}/api/settings/request-password-change`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                userId, 
                email: userEmail, 
                currentPassword: passData.current_password 
            }),
        });

        const data = await response.json();

        if (response.ok) {
            setIsOtpStep(true); // Switch UI to OTP mode
            setMessage({ type: "success", text: "Security code sent to your email." });
        } else {
            setMessage({ type: "error", text: data.message || "Failed to verify password." });
        }
    } catch (error) {
        setMessage({ type: "error", text: "Server error. Please try again." });
    } finally {
        setLoading(false);
    }
  };

  // --- HANDLER: STEP 2 - VERIFY OTP & CHANGE PASSWORD ---
  const handleVerifyAndSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
        const response = await fetch(`${BACKEND_URL}/api/settings/confirm-password-change`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                userId, 
                otp, 
                newPassword: passData.new_password 
            }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Password changed successfully! Please login again.");
            localStorage.clear();
            navigate("/login");
        } else {
            setMessage({ type: "error", text: data.message || "Invalid OTP code." });
        }
    } catch (error) {
        setMessage({ type: "error", text: "Server verification failed." });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        
        <div className="settings-header">
            <button className="back-icon-btn" onClick={() => navigate(-1)}>
                <i className="fa-solid fa-arrow-left"></i>
            </button>
            <h2>Account Settings</h2>
        </div>

        <div className="settings-layout">
          {/* SIDEBAR TABS */}
          <div className="settings-sidebar">
            <button 
              className={`sidebar-btn ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => { setActiveTab('general'); setMessage({ type: "", text: "" }); setIsOtpStep(false); }}
            >
              <i className="fa-regular fa-user"></i> General
            </button>
            <button 
              className={`sidebar-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => { setActiveTab('security'); setMessage({ type: "", text: "" }); }}
            >
              <i className="fa-solid fa-shield-halved"></i> Security
            </button>
          </div>

          {/* CONTENT AREA */}
          <div className="settings-content">
            
            {message.text && (
                <div className={`alert-box ${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* --- GENERAL TAB --- */}
            {activeTab === 'general' && (
              <form onSubmit={handleGeneralSubmit} className="settings-form fade-in">
                <h3>Profile Information</h3>
                
                <div className="form-group">
                  <label>Full Name / Username</label>
                  <input 
                    type="text" 
                    value={formData.username} 
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea 
                    value={formData.bio} 
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Tell us something about yourself..."
                    maxLength={150}
                  />
                </div>

                <div className="form-row">
                    <div className="form-group half">
                        <label>Course</label>
                        <select 
                            value={formData.course} 
                            onChange={(e) => setFormData({...formData, course: e.target.value})}
                        >
                            <option value="">Select Course</option>
                            <option value="BSCS">BS Computer Science</option>
                            <option value="BSIT">BS Info Tech</option>
                            <option value="BSIS">BS Info Systems</option>
                            <option value="BSCE">BS Civil Engineering</option>
                            <option value="BSEE">BS Electrical Engineering</option>
                            <option value="BSME">BS Mechanical Engineering</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="form-group half">
                        <label>Year Level</label>
                        <select 
                            value={formData.year_level} 
                            onChange={(e) => setFormData({...formData, year_level: e.target.value})}
                        >
                            <option value="">Select Year</option>
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                            <option value="Irregular">Irregular</option>
                        </select>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
              </form>
            )}

            {/* --- SECURITY TAB (WITH OTP LOGIC) --- */}
            {activeTab === 'security' && (
              <div className="settings-form fade-in">
                <h3>Change Password</h3>

                {!isOtpStep ? (
                    // STEP 1: PASSWORD FORM
                    <form onSubmit={handleSendOtp}>
                        <div className="form-group">
                            <label>Current Password</label>
                            <input 
                                type="password" 
                                value={passData.current_password} 
                                onChange={(e) => setPassData({...passData, current_password: e.target.value})}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>New Password</label>
                            <input 
                                type="password" 
                                value={passData.new_password} 
                                onChange={(e) => setPassData({...passData, new_password: e.target.value})}
                                required
                                placeholder="Min. 8 characters"
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input 
                                type="password" 
                                value={passData.confirm_password} 
                                onChange={(e) => setPassData({...passData, confirm_password: e.target.value})}
                                required
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="save-btn" disabled={loading}>
                                {loading ? "Processing..." : "Update Password"}
                            </button>
                        </div>
                    </form>
                ) : (
                    // STEP 2: OTP VERIFICATION FORM
                    <form onSubmit={handleVerifyAndSave} className="otp-animation-container">
                        <div className="form-group">
                            <label style={{color: "#8B0000", fontWeight: "bold"}}>Enter 6-Digit Security Code</label>
                            <p style={{fontSize: "0.9rem", color: "#666", marginBottom: "10px"}}>
                                We sent a code to your registered email address.
                            </p>
                            <input 
                                type="text" 
                                maxLength="6"
                                value={otp} 
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                placeholder="Example: 123456"
                                style={{textAlign: "center", letterSpacing: "5px", fontSize: "1.2rem"}}
                            />
                        </div>

                        <div className="form-actions" style={{display: "flex", gap: "10px"}}>
                            <button type="submit" className="save-btn" disabled={loading}>
                                {loading ? "Verifying..." : "Confirm Change"}
                            </button>
                            <button 
                                type="button" 
                                className="cancel-btn" // Ensure you have style for this or use inline
                                style={{background: "#ccc", color: "#333", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer"}}
                                onClick={() => { setIsOtpStep(false); setMessage({type:"", text:""}); }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}