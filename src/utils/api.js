// src/utils/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: "https://statelevel-backend.onrender.com/api",
});

// Add JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('AM_TOKEN');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
