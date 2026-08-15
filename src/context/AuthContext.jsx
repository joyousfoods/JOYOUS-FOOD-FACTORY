import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api';
import { api, setAccessToken, onAuthExpired, clearGuestToken } from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `initialising` covers the silent refresh on first paint — routes wait
  // for it so a signed-in user is never bounced to /login on reload.
  const [initialising, setInitialising] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // The refresh token lives in an httpOnly cookie, so this succeeds
        // on a page reload without any token in localStorage.
        const token = await api.refreshAccessToken();
        if (token && !cancelled) {
          const { user: me } = await authApi.me();
          if (!cancelled) setUser(me);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setInitialising(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // The client tells us when a refresh finally fails mid-session.
  useEffect(() => onAuthExpired(() => setUser(null)), []);

  const applySession = useCallback((session) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
    // The guest cart has been merged server-side; drop the local token so
    // a later sign-out starts from a clean guest cart.
    clearGuestToken();
  }, []);

  const login = useCallback(
    async (credentials) => {
      const session = await authApi.login(credentials);
      applySession(session);
      return session.user;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      const session = await authApi.register(payload);
      applySession(session);
      return session.user;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
      clearGuestToken();
    }
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const { user: updated } = await authApi.updateProfile(payload);
    setUser(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      initialising,
      login,
      register,
      logout,
      updateProfile,
      changePassword: authApi.changePassword,
    }),
    [user, initialising, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
