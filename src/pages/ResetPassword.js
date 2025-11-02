import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import "./resetpassword.css";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });
  const { token } = useParams();
  const navigate = useNavigate();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/auth/reset-password/${token}`, { password });
      showToast("✅ Password reset successful!", "success");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      showToast(err.response?.data?.message || "❌ Error resetting password", "error");
    }
  };

  return (
    <>
      <Navbar />
      <div className="login-container">
        <div className="login-content auth-form">
          <h1>Reset Password</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Reset Password</button>
          </form>
        </div>
      </div>
      {toast.message && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
};

export default ResetPassword;
