import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import "./forgotpassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });
  const navigate = useNavigate();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/forgot-password", { email });
      showToast(`✅ Reset link sent to ${email}`, "success");
    } catch (err) {
      showToast(err.response?.data?.message || "❌ Something went wrong", "error");
    }
  };

  return (
    <>
      <Navbar />
      <div className="login-container">
        <div className="login-content auth-form">
          <h1>Forgot Password</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Send Reset Link</button>
          </form>
          <button
            onClick={() => navigate("/login")}
            className="forgot-password"
          >
            Back to Login
          </button>
        </div>
      </div>
      {toast.message && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
};

export default ForgotPassword;
