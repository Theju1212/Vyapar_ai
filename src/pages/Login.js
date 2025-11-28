// src/pages/Login.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import "./login.css";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // Toast
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", form);

      // backend returns: { token, user }
      login(res.data.token, res.data.user);

      showToast("✅ Login successful!", "success");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "❌ Invalid credentials";
      showToast(msg, "error");
      setError(msg);
    }
  };

  return (
    <>
      <Navbar />

      <div className="login-container">
        <div className="lottie-section">
          <img
            src={`${process.env.PUBLIC_URL}/assets/lottie/shopping-cart-load-2.gif`}
            alt="Loading Animation"
            style={{
              width: 300,
              height: 300,
              marginLeft: "-60px",
              objectFit: "contain",
            }}
          />
        </div>

        <div className="login-content auth-form">
          <h1>Welcome Back 👋</h1>
          <p className="sub-text">Login to continue managing your store</p>

          {error && <p className="error-text">{error}</p>}

          <form onSubmit={handleSubmit}>
            <input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button type="submit" className="login-btn">
              Login
            </button>
          </form>

          <button
            onClick={() => navigate("/forgot-password")}
            className="forgot-password"
          >
            Forgot Password?
          </button>

          <p className="register-text">
            Don’t have an account?{" "}
            <span onClick={() => navigate("/register")}>Register here</span>
          </p>
        </div>
      </div>

      {toast.message && (
        <div className={`toast ${toast.type}`}>{toast.message}</div>
      )}
    </>
  );
};

export default Login;
