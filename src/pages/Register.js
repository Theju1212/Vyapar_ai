// src/pages/Register.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import GoogleButton from "../components/GoogleButton";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import "./Register.css";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    storeName: "",
  });

  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // backend returns: { token, user, store }
      const res = await API.post("/auth/register", form);

      login(res.data.token, res.data.user);

      showToast("✅ Registration successful!", "success");

      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      const msg = err.response?.data?.message || "❌ Something went wrong";
      showToast(msg, "error");
      setError(msg);
    }
  };

  return (
    <>
      <Navbar />

      <div className="login-container">
        <div className="login-content auth-form">
          <h1>Create Account</h1>

          {error && <p className="error-text">{error}</p>}

          <form onSubmit={handleSubmit}>
            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              name="phone"
              type="tel"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              required
            />
            <input
              name="storeName"
              placeholder="Store Name"
              value={form.storeName}
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
            <button type="submit">Register</button>
          </form>

          <GoogleButton className="google-btn" />

          <button
            onClick={() => navigate("/login")}
            className="forgot-password"
          >
            Already have an account? Login
          </button>
        </div>
      </div>

      {toast.message && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
};

export default Register;
