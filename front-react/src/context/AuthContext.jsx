import { createContext, useContext, useState, useCallback } from "react";
import { api, getUser, getToken, saveSession, clearSession } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getUser());
  const [token, setToken] = useState(() => getToken());

  const login = useCallback(async (email, password) => {
    const res = await api("POST", "/rpc/auth/login", { email, password });
    if (res.ok && res.data && res.data.token) {
      saveSession(res.data.token, res.data.user);
      setUser(res.data.user);
      setToken(res.data.token);
    }
    return res;
  }, []);

  const register = useCallback(
    (username, email, password, role) =>
      api("POST", "/rpc/auth/register", { username, email, password, role }),
    []
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setToken("");
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    myId: user ? Number(user.id) : null,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
