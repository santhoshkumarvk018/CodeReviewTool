import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, ArrowRight } from "lucide-react";
import { registerUser } from "../api";
import "./Auth.css";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      await registerUser(name, email, password);
      // Automatically redirect to login page after successful registration
      navigate("/login");
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
    <div className="auth-container signup-bg">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <UserPlus size={40} className="auth-icon" />
          <h2>Create Account</h2>
          <p>Join the AI-powered developer platform</p>
        </div>

        {errorMsg && (
          <div
            className="error-msg fade-in"
            style={{ color: "#ef4444", marginBottom: "15px" }}
          >
            {errorMsg}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSignup}>
          <div className="input-group slide-up-1">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Alice Developer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group slide-up-2">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="alice@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group slide-up-3">
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
            className="auth-btn slide-up-4"
            disabled={isLoading}
          >
            {isLoading ? (
              "Creating account..."
            ) : (
              <>
                Sign Up <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer slide-up-5">
          <p>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
