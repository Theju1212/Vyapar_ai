import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import LanguageSelector from "./LanguageSelector";
import "./navbar.css";

export default function Navbar() {
  const { token, logout } = useContext(AuthContext);
  const nav = useNavigate();

  const doLogout = () => {
    logout();
    nav("/login");
  };

  return (
    <header className="app-header">
      <div className="nav-inner">
        <div className="brand-section">
          <img src="/favicon1.png" alt="Vyapaar AI Logo" className="brand-logo" />
          <Link to="/" className="brand">Vyapaar AI</Link>
        </div>

        <nav className="nav-menu">
          {token ? (
            <>
              <Link to="/dashboard" className="btn btn-ghost">Dashboard</Link>
              <Link to="/items" className="btn btn-ghost">Items</Link>
              <Link to="/sales" className="btn btn-ghost">Sales</Link>
              <Link to="/settings" className="btn btn-ghost">Settings</Link>
              <button onClick={doLogout} className="btn btn-ghost">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" className="btn btn-ghost">Register</Link>
            </>
          )}
          <LanguageSelector />
        </nav>
      </div>
    </header>
  );
}
