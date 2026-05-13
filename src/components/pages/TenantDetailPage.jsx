import { ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { usePermissions } from "@/hooks/usePermissions";
import OrganisationDashboardPage from "@/components/pages/OrganisationDashboardPage";

const ORGANISATION_SECTION_IDS = new Set([
  "overview", "usage", "members", "domains", "audit", "settings",
]);

/**
 * Tenant / organisation dashboard — full-page operational view.
 * RBAC: org admins get a view-only banner inside the organisation when `tenants.edit` is false.
 */
export default function TenantDetailPage({ tenant, onNavigate }) {
  const { can, role } = usePermissions();
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section");
  const initialNavId = section && ORGANISATION_SECTION_IDS.has(section) ? section : undefined;

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

        <OrganisationDashboardPage
          tenant={tenant}
          onNavigate={onNavigate}
          canEditTenant={canEditTenant}
          role={role}
          initialNavId={initialNavId}
        />
      </div>
    </div>
  );
}
