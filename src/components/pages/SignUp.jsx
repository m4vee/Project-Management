import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../index.css';
import './SignUp.css';

export default function SignUp() {
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate(); // ✅ hook for navigation

  const handleSendCode = (e) => {
    e.preventDefault();
    setOtpSent(true);
  };

  const handleCreateAccount = (e) => {
    e.preventDefault();
    // Here you can also add your API call or form validation logic
    alert('Account created successfully!');
    navigate('/inside-app'); // ✅ redirect to your app page
  };

  return (
    <div className="signup-page">
      <div className="signup-wrapper">
        <form onSubmit={otpSent ? handleCreateAccount : handleSendCode}>
          <h1>Sign Up</h1>

          <div className="input-box">
            <input type="text" placeholder="Username" required />
            <i className="fa-solid fa-user"></i>
          </div>

          <div className="input-box">
            <input type="email" placeholder="TUP Email" required />
            <i className="fa-solid fa-envelope"></i>
          </div>

          {otpSent && (
            <div className="input-box fade-in">
              <input type="text" placeholder="Enter Code" required />
              <i className="fa-solid fa-lock"></i>
            </div>
          )}

          <button type="submit" className="signup-btn">
            {otpSent ? 'Create Account' : 'Send Code'}
          </button>

          <div className="login-link">
            <p>
              Already have an account?{' '}
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
