import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL,
  timeout: 60000,
});

// Always attach JWT token if present
client.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('AM_TOKEN');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Token fetch error:", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default client;
