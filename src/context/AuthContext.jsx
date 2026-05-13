import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

/* ── Role definitions ──────────────────────────────────────────── */
export const ROLES = {
  superadmin:  { id: "superadmin",  label: "Super Admin",   sublabel: "Global Control",   color: "violet" },
  tenantadmin: { id: "tenantadmin", label: "Tenant Admin",  sublabel: "Org Level",        color: "blue"   },
  tenantuser:  { id: "tenantuser",  label: "Tenant User",   sublabel: "Execution Level",  color: "slate"  },
};

const ROLE_PROFILES = {
  superadmin:  { name: "Admin",        email: "admin@aziro.com"       },
  tenantadmin: { name: "Sarah Chen",   email: "admin@meridian.com"    },
  tenantuser:  { name: "Jane Cooper",  email: "jane@meridian.com"     },
};

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    isAuthenticated: true,
    role: "superadmin",
    user: ROLE_PROFILES.superadmin,
  });

  const login      = (role, user) => setAuth({ isAuthenticated: true, role, user });
  const logout     = ()           => setAuth({ isAuthenticated: false, role: null, user: null });
  const switchRole = (role)       => setAuth(prev => ({ ...prev, role, user: ROLE_PROFILES[role] }));

  return (
    <AuthContext.Provider value={{ auth, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
