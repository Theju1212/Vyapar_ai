// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import API from '../utils/api';
import { parseJwt } from '../utils/jwt';

export const AuthContext = createContext({
  user: null,
  token: null,
  storeId: null,
  loading: true,
  login: () => {},
  logout: () => {},
  setUser: () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
const [token, setToken] = useState(null);  // start clean
  const [storeId, setStoreId] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Initialize auth from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('AM_TOKEN');
      if (storedToken) {
        const payload = parseJwt(storedToken);
        if (payload) {
          setToken(storedToken);
          setUser({
            id: payload.userId,
            role: payload.role,
            email: payload.email
          });
          setStoreId(payload.storeId || null);
          API.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else {
          localStorage.removeItem('AM_TOKEN');
        }
      } else {
        localStorage.removeItem('AM_TOKEN');
      }
    } catch (err) {
      console.warn('Auth initialization error', err);
      localStorage.removeItem('AM_TOKEN');
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 Login — saves token + user data
  const login = (newToken, userData) => {
    if (!newToken) return;
    localStorage.setItem('AM_TOKEN', newToken);
    setToken(newToken);

    const payload = parseJwt(newToken);
    setUser(userData || {
      id: payload?.userId,
      role: payload?.role,
      email: payload?.email
    });
    setStoreId(payload?.storeId || null);
    API.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  // 🔹 Logout — clear all session data
  const logout = () => {
    localStorage.removeItem('AM_TOKEN');
    setUser(null);
    setToken(null);
    setStoreId(null);
    delete API.defaults.headers.common['Authorization'];
  };

  // 🔹 Update user info manually (optional)
  const setUserFromServer = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        storeId,
        loading,
        login,
        logout,
        setUser: setUserFromServer
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
