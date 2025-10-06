import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../lib/auth";

type AuthState = {
  user: api.AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<api.AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("nm_token");
    const u = localStorage.getItem("nm_user");
    if (t) setToken(t);
    if (u) {
      try { setUser(JSON.parse(u)); } catch {}
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await api.login(email, password);
    setToken(token);
    setUser(user);
    localStorage.setItem("nm_token", token);
    localStorage.setItem("nm_user", JSON.stringify(user));
  };

  const signup = async (email: string, password: string, name?: string) => {
    const { token, user } = await api.register(email, password, name);
    setToken(token);
    setUser(user);
    localStorage.setItem("nm_token", token);
    localStorage.setItem("nm_user", JSON.stringify(user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("nm_token");
    localStorage.removeItem("nm_user");
  };

  const value = useMemo(() => ({ user, token, login, signup, logout }), [user, token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
