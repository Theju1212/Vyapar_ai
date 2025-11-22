// Axios instance with baseURL and JWT token in headers
import axios from 'axios';

const API = axios.create({
  baseURL: "https://statelevel-backend.onrender.com/api", // 🔥 FIXED
});

// Add JWT token to every request if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('AM_TOKEN');  // FIXED
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
