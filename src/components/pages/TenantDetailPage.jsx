import { ChevronRight } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { usePermissions } from "@/hooks/usePermissions";
import WorkspaceDashboardPage from "@/components/pages/WorkspaceDashboardPage";

/**
 * Tenant / organisation workspace — full-page operational dashboard.
 * RBAC: org admins get a view-only banner inside the workspace when `tenants.edit` is false.
 */
export default function TenantDetailPage({ tenant, onNavigate }) {
  const { can, role } = usePermissions();

  const listCrumbLabel = role === "tenantadmin" ? "Organisation" : "Tenants";
  const canEditTenant = can("tenants.edit");

  if (!tenant) {
    return (
      <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
        <Sidebar activePage="tenants" onNavigate={onNavigate} />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AppHeader onNavigate={onNavigate} />
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-slate-500">No tenant selected.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar activePage="tenants" onNavigate={onNavigate} />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          <div className="ml-1 flex items-center gap-2">
            <div className="h-6 w-px bg-border" />
            <button
              type="button"
              onClick={() => onNavigate?.("tenants")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {listCrumbLabel}
            </button>
            <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />
            <span className="max-w-[200px] truncate text-sm font-medium text-foreground">
              {tenant.name}
            </span>
          </div>
        </AppHeader>

        <WorkspaceDashboardPage
          tenant={tenant}
          onNavigate={onNavigate}
          canEditTenant={canEditTenant}
          can={can}
          role={role}
        />
      </div>
    </div>
  );
}
