import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { MembersDirectory } from "@/components/members/MembersDirectory";
import { TENANTS } from "@/data/adminData";

const MY_TENANT = TENANTS.find((t) => t.id === 3);

export default function TenantUsersPage({ onNavigate }) {
  const tenant = MY_TENANT;

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="tenant-users" onNavigate={onNavigate} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate} />

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5 pb-8 sm:px-6">
          <MembersDirectory tenant={tenant} variant="page" onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}
