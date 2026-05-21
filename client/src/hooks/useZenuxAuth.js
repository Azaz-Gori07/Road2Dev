import { useState, useCallback, useEffect, useRef } from 'react';
import ZenuxOAuth from 'zenuxs-oauth';

export default function useZenuxAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(null);
  const oauthRef = useRef(null);

  useEffect(() => {
    // Explicitly pass fetch to avoid constructor context issues
    const oauth = new ZenuxOAuth({
      clientId: "f3b01e0825dd896d",
      redirectUri: window.location.origin + "/callback.html",
      scopes: "openid profile email",
      storage: "sessionStorage",
      usePKCE: true,
      useCSRF: true,
      validateState: true,
      autoRefresh: true,
      refreshThreshold: 300,
      fetchFunction: window.fetch.bind(window),
    });

    oauthRef.current = oauth;

    // Check if already authenticated
    const isAuth = oauth.isAuthenticated();
    setIsAuthenticated(isAuth);

    if (isAuth) {
      const storedTokens = oauth.getTokens();
      setTokens(storedTokens);
      oauth.getUserInfo()
        .then((userInfo) => setUser(userInfo))
        .catch(() => setUser(null));
    }

    // Event listeners
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

    setLoading(false);

    return () => {
      oauth.off('login');
      oauth.off('logout');
      oauth.off('tokenRefresh');
      oauth.off('error');
    };
  }, []);

  const login = useCallback(async (provider = null) => {
    const oauth = oauthRef.current;
    if (!oauth) throw new Error('OAuth not initialized');

    const options = {
      popup: true,
      popupWidth: 600,
      popupHeight: 700,
    };

    // If a specific provider is requested, pass it as an extra auth param
    if (provider) {
      options.extraAuthParams = {
        provider: provider,
      };
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

  const loginWithGoogle = useCallback(() => login('google'), [login]);
  const loginWithGitHub = useCallback(() => login('github'), [login]);
  const loginWithLinkedIn = useCallback(() => login('linkedin'), [login]);

  const logout = useCallback(async () => {
    const oauth = oauthRef.current;
    if (!oauth) return;
    try {
      await oauth.logout({ revokeTokens: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const getTokens = useCallback(() => {
    return oauthRef.current?.getTokens() || null;
  }, []);

  return {
    isAuthenticated,
    user,
    loading,
    tokens,
    login,
    loginWithGoogle,
    loginWithGitHub,
    loginWithLinkedIn,
    logout,
    getTokens,
  };
}