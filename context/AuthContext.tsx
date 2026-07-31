"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { setToken } from "@/lib/token-store";
import { refreshAccessToken, registerAuthCallbacks } from "@/lib/api";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  career_goal_id: number | null;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** true selagi mencoba silent-refresh session saat app pertama dibuka */
  isInitializing: boolean;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const setSession = useCallback((token: string, newUser: AuthUser) => {
    setToken(token);
    setUser(newUser);
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let initialCheckPending = true;

    registerAuthCallbacks(
      (_token, refreshedUser) => setUser(refreshedUser as AuthUser),
      () => {
        setUser((current) => {
          if (initialCheckPending && current !== null) return current;
          return null;
        });
      }
    );

    refreshAccessToken().finally(() => {
      initialCheckPending = false;
      setIsInitializing(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      setSession,
      clearSession,
    }),
    [user, isInitializing, setSession, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth harus dipanggil di dalam <AuthProvider>");
  }
  return ctx;
}