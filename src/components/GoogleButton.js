import React, { useContext } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../pages/login.css'; // to apply button styles

const GoogleButton = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Get Google profile
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });
        const profile = await res.json();
        const { sub: googleId, email, name } = profile;

        // Send to backend
        const backendRes = await API.post('/api/auth/google', { googleId, email, name });

        // Update global auth state
        login(backendRes.data.token, backendRes.data.user);

        navigate('/dashboard'); // redirect after login
      } catch (err) {
        console.error('Google login failed', err);
      }
    },
    onError: (err) => console.error('Login Failed:', err),
  });

  return (
    <button
      className="google-btn"
      onClick={() => googleLogin()}
    >
      <img
        src="https://developers.google.com/identity/images/g-logo.png"
        alt="Google"
        className="google-logo"
      />
      Sign in with Google
    </button>
  );
};

export default GoogleButton;
