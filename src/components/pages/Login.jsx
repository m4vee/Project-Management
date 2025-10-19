import './Login.css';
import { useNavigate } from "react-router-dom";


const Login = () => {
  const navigate = useNavigate(); // ✅ Must be inside the component

  const handleLogin = (e) => {
    e.preventDefault();
    navigate("/inside-app"); // ✅ Redirects to your inside app homepage
  };

  return (
    <div className="login-page">
      <div className="wrapper">
        <div className="form-box-login">
          <form onSubmit={handleLogin}>
            <h1>Login</h1>

            <div className="input-box">
              <input type="text" placeholder="Email" required />
              <i className="fa-solid fa-user"></i>
            </div>

            <div className="input-box">
              <input type="password" placeholder="Password" required />
              <i className="fa-solid fa-lock"></i>
            </div>

            <div className="remember-forgot">
              <label><input type="checkbox" /> Remember Me</label>
              <a href="#">Forgot Password?</a>
            </div>

            <button type="submit" className="login-btn">Login</button>
            

            <div className="register-link">
              <p>Don't have an account? <a href="/sign-up">Register</a></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
