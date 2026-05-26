import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { JwtPayload } from "../../../server/auth";

interface AuthContextType {
  user: JwtPayload | null;
  token: string | null;
  login: (token: string, user: JwtPayload) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("auth_token");
    if (t) {
      try {
        const payload = JSON.parse(atob(t.split(".")[1]));
        if (payload.exp * 1000 > Date.now()) {
          setToken(t);
          setUser(payload as JwtPayload);
        } else {
          localStorage.removeItem("auth_token");
        }
      } catch {
        localStorage.removeItem("auth_token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (t: string, u: JwtPayload) => {
    localStorage.setItem("auth_token", t);
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function getStoredToken(): string | null {
  return localStorage.getItem("auth_token");
}
