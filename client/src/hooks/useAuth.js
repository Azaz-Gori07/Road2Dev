import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';

export default function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(null);

  // On mount, check local storage for token
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      setTokens(storedToken);
      setIsAuthenticated(true);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
      // Verify token with backend (don't block UI)
      verifyTokenOnServer(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyTokenOnServer = async (token) => {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
      } else {
        // Token invalid — clear
        logout();
      }
    } catch {
      // Offline — keep cached user
    } finally {
      setLoading(false);
    }
  };

  const saveSession = (token, userData) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setTokens(token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const clearSession = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setTokens(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  /**
   * Send OTP for registration
   */
  const sendOtp = useCallback(async (name, email, password) => {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to send OTP');
    }

    return data;
  }, []);

  /**
   * Verify OTP and create account
   */
  const verifyOtp = useCallback(async (email, otp) => {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Verification failed');
    }

    saveSession(data.token, data.user);
    return data.user;
  }, []);

  /**
   * Resend OTP
   */
  const resendOtp = useCallback(async (email) => {
    const res = await fetch(`${API_BASE}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to resend OTP');
    }

    return data;
  }, []);

  /**
   * Login with email & password
   */
  const loginWithEmail = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    saveSession(data.token, data.user);
    return data.user;
  }, []);

  /**
   * Login/Register via Zenuxs OAuth token
   */
  const loginWithZenuxs = useCallback(async (zenuxsToken) => {
    const res = await fetch(`${API_BASE}/auth/zenuxs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: zenuxsToken }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'OAuth login failed');
    }

    saveSession(data.token, data.user);
    return data.user;
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    clearSession();
  }, []);

  /**
   * Update profile
   */
  const updateProfile = useCallback(async (profileData) => {
    const storedToken = localStorage.getItem('auth_token');
    if (!storedToken) throw new Error('Not authenticated');

    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }

    // Update local storage with new user data
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  return {
    isAuthenticated,
    user,
    loading,
    tokens,
    sendOtp,
    verifyOtp,
    resendOtp,
    loginWithEmail,
    loginWithZenuxs,
    logout,
    updateProfile,
  };
}