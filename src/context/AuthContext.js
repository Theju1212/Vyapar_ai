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
  const [token, setToken] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Load token & user from localStorage on app start
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
            email: payload.email,
            storeId: payload.storeId
          });
          setStoreId(payload.storeId);
          API.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else {
          localStorage.removeItem('AM_TOKEN');
        }
      }
    } catch (err) {
      console.warn('Auth init failed:', err);
      localStorage.removeItem('AM_TOKEN');
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 Login (from Register or Login or Google)
  const login = (newToken, userData) => {
    if (!newToken) return;

    localStorage.setItem('AM_TOKEN', newToken);
    setToken(newToken);

    const payload = parseJwt(newToken);

    // backend ALWAYS returns user + token
    setUser(userData || {
      id: payload?.userId,
      email: payload?.email,
      role: payload?.role,
      storeId: payload?.storeId
    });

    setStoreId(payload?.storeId);

    API.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  // 🔹 Logout
  const logout = () => {
    localStorage.removeItem('AM_TOKEN');
    setUser(null);
    setToken(null);
    setStoreId(null);
    delete API.defaults.headers.common['Authorization'];
  };

  // 🔹 Update user manually
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
