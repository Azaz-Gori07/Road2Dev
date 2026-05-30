import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import ZenuxOAuth from 'zenuxs-oauth';

export const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(null);
  const oauthRef = useRef(null);

  // Helper to get Zenuxs Redirect URI
  const getRedirectUri = useCallback(() => {
    const baseUrl = window.location.origin;
    const cleaned = baseUrl.replace(/\/+$/, '');
    return cleaned + '/callback.html';
  }, []);

  // Save session for email/password auth
  const saveSession = (token, userData) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setTokens(token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Clear session
  const clearSession = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setTokens(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Verify token on backend
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
        clearSession();
      }
    } catch {
      // Offline — keep cached user
    } finally {
      setLoading(false);
    }
  };

  // On mount, initialize both local and Zenux OAuth authentication
  useEffect(() => {
    let active = true;

    // 1. Initial Local Storage Auth check
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    let isLocalAuthenticated = false;
    if (storedToken && storedUser) {
      setTokens(storedToken);
      setIsAuthenticated(true);
      isLocalAuthenticated = true;
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
      verifyTokenOnServer(storedToken);
    }

    // 2. Initialize ZenuxOAuth
    const oauth = new ZenuxOAuth({
      clientId: "f3b01e0825dd896d",
      redirectUri: getRedirectUri(),
      scopes: "openid profile email github:repo",
      storage: "sessionStorage",
      usePKCE: true,
      useCSRF: true,
      validateState: true,
      autoRefresh: true,
      refreshThreshold: 300,
      fetchFunction: window.fetch.bind(window),
    });

    oauthRef.current = oauth;

    const isZenuxAuth = oauth.isAuthenticated();
    if (isZenuxAuth && !isLocalAuthenticated) {
      setIsAuthenticated(true);
      const storedTokens = oauth.getTokens();
      setTokens(storedTokens);
      oauth.getUserInfo()
        .then((userInfo) => {
          if (active) setUser(userInfo);
        })
        .catch(() => {
          if (active) setUser(null);
        });
    }

    // Zenux Event Listeners
    oauth.on('login', async (tokenData) => {
      setIsAuthenticated(true);
      setTokens(tokenData);
      try {
        const userInfo = await oauth.getUserInfo();
        setUser(userInfo);
      } catch {
        setUser(null);
      }
    });

    oauth.on('logout', () => {
      setIsAuthenticated(false);
      setUser(null);
      setTokens(null);
    });

    oauth.on('tokenRefresh', (newTokens) => {
      setTokens(newTokens);
    });

    oauth.on('error', (error) => {
      console.error('OAuth error:', error);
    });

    if (!isLocalAuthenticated) {
      setLoading(false);
    }

    return () => {
      active = false;
      oauth.off('login');
      oauth.off('logout');
      oauth.off('tokenRefresh');
      oauth.off('error');
    };
  }, [getRedirectUri]);

  // Methods for email/password OTP auth
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

  const logout = useCallback(async () => {
    clearSession();
    const oauth = oauthRef.current;
    if (oauth && oauth.isAuthenticated()) {
      try {
        await oauth.logout({ revokeTokens: true });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  }, []);

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

    localStorage.setItem('auth_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const loginZenuxOAuth = useCallback(async (provider = null) => {
    const oauth = oauthRef.current;
    if (!oauth) throw new Error('OAuth not initialized');

    const options = {
      popup: true,
      popupWidth: 600,
      popupHeight: 700,
    };

    if (provider) {
      options.extraAuthParams = { provider };
    }

    try {
      const tokenData = await oauth.login(options);
      return tokenData;
    } catch (error) {
      if (error.code === 'POPUP_BLOCKED') {
        throw new Error('Please allow popups for this site to login with social accounts.');
      }
      if (error.code === 'AUTH_CANCELLED') {
        throw new Error('Login was cancelled.');
      }
      throw error;
    }
  }, []);

  const loginWithGoogle = useCallback(() => loginZenuxOAuth('google'), [loginZenuxOAuth]);
  const loginWithGitHub = useCallback(() => loginZenuxOAuth('github'), [loginZenuxOAuth]);
  const loginWithLinkedIn = useCallback(() => loginZenuxOAuth('linkedin'), [loginZenuxOAuth]);
  const getTokens = useCallback(() => oauthRef.current?.getTokens() || null, []);

  return (
    <AuthContext.Provider value={{
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
      loginZenuxOAuth,
      loginWithGoogle,
      loginWithGitHub,
      loginWithLinkedIn,
      getTokens
    }}>
      {children}
    </AuthContext.Provider>
  );
}
