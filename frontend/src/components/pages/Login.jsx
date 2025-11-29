import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../services/api"; // Import the login function
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(""); // Clear error when user types
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userData = await loginUser(formData.email, formData.password);

      // Store user data in localStorage (optional)
      localStorage.setItem("user", JSON.stringify(userData));

      // Redirect on success
      navigate("/inside-app");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="wrapper">
        <div className="form-box-login">
          <form onSubmit={handleLogin}>
            <h1>Login</h1>

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
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}

            <div className="input-box">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
              <i className="fa-solid fa-user"></i>
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

            <div className="remember-forgot">
              <label>
                <input type="checkbox" /> Remember Me
              </label>
              <a href="#">Forgot Password?</a>
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="register-link">
              <p>
                Don't have an account? <a href="/sign-up">Register</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
