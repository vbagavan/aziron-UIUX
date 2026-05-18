import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

/* ── Role definitions ──────────────────────────────────────────── */
export const ROLES = {
  superadmin:  { id: "superadmin",  label: "Super Admin",   sublabel: "Global Control",   color: "violet" },
  tenantadmin: { id: "tenantadmin", label: "Tenant Admin",  sublabel: "Org Level",        color: "blue"   },
  tenantuser:  { id: "tenantuser",  label: "Tenant User",   sublabel: "Execution Level",  color: "slate"  },
};

const ROLE_PROFILES = {
  superadmin: {
    name: "Admin",
    /** As on government-issued ID (employee / verified records). */
    legalName: "Alexandra R. Admin",
    email: "admin@aziro.com",
    employeeId: "EMP-2024-000",
    department: "Operations",
    joiningDate: "2022-03-14",
    dateOfBirth: "1985-04-12",
    mobile: "+1 (555) 010-0001",
    gender: "Female",
  },
  tenantadmin: {
    name: "Sarah Chen",
    legalName: "Sarah Min-Ji Chen",
    email: "admin@meridian.com",
    employeeId: "EMP-2023-014",
    department: "Human Resources",
    joiningDate: "2021-06-15",
    dateOfBirth: "1990-08-20",
    mobile: "+1 (555) 010-2201",
    gender: "Female",
  },
  tenantuser: {
    name: "Jane Cooper",
    legalName: "Jane Avery Cooper",
    email: "jane@meridian.com",
    employeeId: "EMP-2024-001",
    department: "Engineering",
    joiningDate: "2024-01-08",
    dateOfBirth: "1995-11-03",
    mobile: "+1 (555) 010-8422",
    gender: "Female",
  },
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
