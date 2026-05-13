import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS } from "@/config/rbac";

/**
 * usePermissions — RBAC permission checking hook
 *
 * const { can, canAny, canAll, role } = usePermissions();
 *
 * can("agents.create")              → true/false
 * canAny(["agents.edit","agents.delete"]) → true if any allowed
 * canAll(["users.view","users.invite"])   → true if all allowed
 */
export function usePermissions() {
  const { auth } = useAuth();
  const role = auth.role ?? "tenantuser";
  const perms = PERMISSIONS[role] ?? PERMISSIONS.tenantuser;

  const can    = (key)   => perms[key]  ?? false;
  const canAny = (keys)  => keys.some(k  => can(k));
  const canAll = (keys)  => keys.every(k => can(k));

  return { can, canAny, canAll, role, permissions: perms };
}
