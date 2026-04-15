import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    role: null,   // "admin" | "tenant"
    user: null,   // { name, email, avatar?, tenantId? }
  });

  const login  = (role, user) => setAuth({ isAuthenticated: true, role, user });
  const logout = ()           => setAuth({ isAuthenticated: false, role: null, user: null });

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
