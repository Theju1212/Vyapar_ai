import React, { useContext, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";

// 🔹 Page imports
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Items from "./pages/Items";
import NewItem from "./pages/NewItem";
import ItemDetail from "./pages/ItemDetail";
import Sales from "./pages/Sales";
import Settings from "./pages/Settings";
import AIFuture from "./pages/AIFuture";
import Festivals from "./pages/Festivals";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// 🔹 Component imports
import Navbar from "./components/Navbar";
import Chatbot from "./components/Chatbot";
import { Toaster } from "react-hot-toast";
import CustomToaster from "./components/CustomToaster";

// 🔒 Private Route Wrapper
function Private({ children }) {
  const { token } = useContext(AuthContext);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { token } = useContext(AuthContext);
  const location = useLocation();

  // 🔹 Hide navbar on auth-related routes
  const hideNavbar = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ].some((path) => location.pathname.startsWith(path));

  // 🌍 Load Google Translate Script once
  useEffect(() => {
    if (!window.google || !window.google.translate) {
      const script = document.createElement("script");
      script.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="app-root">
      {/* ✅ Global Navbar (hidden on auth pages) */}
      {!hideNavbar && <Navbar />}

      {/* ✅ Page content */}
      <main
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "20px 0",
        }}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Private Routes */}
          <Route path="/dashboard" element={<Private><Dashboard /></Private>} />
          <Route path="/items" element={<Private><Items /></Private>} />
          <Route path="/items/:id" element={<Private><ItemDetail /></Private>} />
          <Route path="/items/new" element={<Private><NewItem /></Private>} />
          <Route path="/sales" element={<Private><Sales /></Private>} />
          <Route path="/settings" element={<Private><Settings /></Private>} />
          <Route path="/ai-future" element={<Private><AIFuture /></Private>} />
          <Route path="/festivals" element={<Private><Festivals /></Private>} />

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>

      {/* ✅ Toasts and Chatbot */}
      <Toaster position="top-right" />
      <CustomToaster />
      {token && <Chatbot />}
    </div>
  );
}
