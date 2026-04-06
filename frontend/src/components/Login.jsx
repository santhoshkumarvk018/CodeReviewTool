import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Code2, ArrowRight } from "lucide-react";
import { loginUser } from "../api";
import "./Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const data = await loginUser(email, password);
      // Store token safely
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.user.name);
      navigate("/dashboard");
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg("Failed to connect to the server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container login-bg">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <Code2 size={40} className="auth-icon" />
          <h2>Welcome Back</h2>
          <p>Sign in to continue to AI Code Reviewer</p>
        </div>

        {errorMsg && (
          <div
            className="error-msg fade-in"
            style={{ color: "#ef4444", marginBottom: "15px" }}
          >
            {errorMsg}
          </div>
        )}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="input-group slide-up-1">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="developer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group slide-up-2">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-btn slide-up-3"
            disabled={isLoading}
          >
            {isLoading ? (
              "Authenticating..."
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer slide-up-4">
          <p>
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
