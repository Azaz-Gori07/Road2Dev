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
  const saveSession = (data) => {
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    if (data.refreshToken) {
      localStorage.setItem('auth_refresh_token', data.refreshToken);
    }
    setTokens(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
  };

  // Clear session
  const clearSession = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_refresh_token');
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
        const body = await res.json();
        const userData = body?.data?.user || body?.user;
        if (userData) {
          setUser(userData);
          localStorage.setItem('auth_user', JSON.stringify(userData));
        } else {
          clearSession();
        }
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

    // Zenux Event Listeners
    oauth.on('login', async (tokenData) => {
      const accessToken = tokenData?.access_token || tokenData;
      if (accessToken) {
        await exchangeZenuxsToken(accessToken);
      } else {
        setIsAuthenticated(true);
        setTokens(tokenData);
        try {
          const userInfo = await oauth.getUserInfo();
          setUser(userInfo);
        } catch {
          setUser(null);
        }
      }
    });

    oauth.on('logout', () => {
      setIsAuthenticated(false);
      setUser(null);
      setTokens(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    });

    oauth.on('tokenRefresh', (newTokens) => {
      setTokens(newTokens);
    });

    oauth.on('error', (error) => {
      console.error('OAuth error:', error?.message || error);
    });

    // Helper to exchange Zenuxs token for our local JWT token
    const exchangeZenuxsToken = async (zenuxsToken) => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/auth/zenuxs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: zenuxsToken }),
        });
        const body = await res.json();
        if (res.ok && body?.data?.token) {
          if (active) {
            saveSession(body.data);
          }
        } else {
          if (active) clearSession();
        }
      } catch (err) {
        console.error('Failed to exchange Zenuxs token:', err?.message || err);
        if (active) clearSession();
      } finally {
        if (active) setLoading(false);
      }
    };

    // Call init to handle same-page callbacks and restore session state
    oauth.init().then(() => {
      if (!active) return;
      const isZenuxAuth = oauth.isAuthenticated();
      if (isZenuxAuth) {
        const storedTokens = oauth.getTokens();
        const accessToken = storedTokens?.access_token || storedTokens;

        if (!isLocalAuthenticated && accessToken) {
          exchangeZenuxsToken(accessToken);
        } else {
          oauth.getUserInfo()
            .then((userInfo) => {
              if (active) setUser(userInfo);
            })
            .catch(() => {
              if (active) setUser(null);
            })
            .finally(() => {
              if (active) setLoading(false);
            });
        }
      } else if (!isLocalAuthenticated) {
        setLoading(false);
      }
    }).catch((err) => {
      console.error('ZenuxOAuth initialization error:', err?.message || err);
      if (active && !isLocalAuthenticated) {
        setLoading(false);
      }
    });

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

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || 'Verification failed');
    }
    saveSession(body.data);
    return body.data?.user;
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

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || 'Login failed');
    }
    saveSession(body.data);
    return body.data?.user;
  }, []);

  const loginWithZenuxs = useCallback(async (zenuxsToken) => {
    const res = await fetch(`${API_BASE}/auth/zenuxs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: zenuxsToken }),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || 'OAuth login failed');
    }
    saveSession(body.data);
    return body.data?.user;
  }, []);

  const forgotPassword = useCallback(async (email) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send reset email');
    }
    return data;
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || 'Failed to reset password');
    }
    saveSession(body.data);
    return body.data?.user;
  }, []);

  const verifyEmail = useCallback(async (token) => {
    const res = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Verification failed');
    }

    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      parsed.emailVerified = true;
      localStorage.setItem('auth_user', JSON.stringify(parsed));
      setUser(parsed);
    }

    return data;
  }, []);

  const resendVerification = useCallback(async () => {
    const storedToken = localStorage.getItem('auth_token');
    const res = await fetch(`${API_BASE}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to resend verification email');
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem('auth_refresh_token');
    if (storedRefreshToken) {
      try {
        await fetch(`${API_BASE}/auth/revoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });
      } catch {}
    }
    clearSession();
    const oauth = oauthRef.current;
    if (oauth && oauth.isAuthenticated()) {
      try {
        await oauth.logout({ revokeTokens: true });
      } catch {}
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
      mode: 'popup',
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
      forgotPassword,
      resetPassword,
      verifyEmail,
      resendVerification,
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
