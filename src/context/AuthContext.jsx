import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api';
import { api, setAccessToken, onAuthExpired, clearGuestToken } from '../api/client';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `initialising` covers the silent session restore on first paint — routes wait
  // for it so a signed-in user is never bounced to /login on reload.
  const [initialising, setInitialising] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (isSupabaseConfigured()) {
          const { user: me } = await authApi.me();
          if (!cancelled) setUser(me);
        } else {
          // Legacy express backend silent refresh check
          const token = await api.refreshAccessToken();
          if (token && !cancelled) {
            const { user: me } = await authApi.me();
            if (!cancelled) setUser(me);
          }
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

  // Listen for Supabase session changes (sign in, sign out, token refresh)
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        try {
          const { user: me } = await authApi.me();
          setUser(me);
        } catch {
          /* ignore error in background listener */
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // The client tells us when a refresh finally fails mid-session (for legacy mode)
  useEffect(() => onAuthExpired(() => setUser(null)), []);

  const applySession = useCallback((session) => {
    if (session?.accessToken) setAccessToken(session.accessToken);
    setUser(session.user);
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

