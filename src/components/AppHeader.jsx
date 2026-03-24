import { useState } from "react";
import { PanelLeft, Bell } from "lucide-react";
import NotificationPanel from "@/components/NotificationPanel";

export default function AppHeader({
  onToggleSidebar,
  onNavigate,
  children,
  // Optional kudos approval props (passed from KudosPage)
  approvals,
  onApprove,
  onReject,
  notifOpen: notifOpenProp,
  onNotifToggle,
}) {
  const [showNotificationsInternal, setShowNotificationsInternal] = useState(false);

  // Controlled when notifOpenProp is provided, otherwise uncontrolled
  const showNotifications = notifOpenProp !== undefined ? notifOpenProp : showNotificationsInternal;
  const toggleNotifications = onNotifToggle ?? (() => setShowNotificationsInternal((v) => !v));

  // Show badge when there are pending kudos OR the static data has unread items
  const pendingKudos = (approvals ?? []).filter((a) => a.status === "pending").length;
  const hasBadge = pendingKudos > 0;

  return (
    <>
      <header className="flex items-center justify-between h-12 px-4 border-b border-[#e2e8f0] flex-shrink-0 bg-white">
        {/* Left: sidebar toggle + optional children (breadcrumb, etc.) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center size-7 rounded-[6px] text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
          >
            <PanelLeft size={16} />
          </button>
          {children}
        </div>

        {/* Right: bell */}
        <button
          onClick={toggleNotifications}
          className="relative flex items-center justify-center size-8 rounded-full text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
        >
          <Bell size={16} />
          {/* Badge: red dot always for static unread; pulse ring when kudos pending */}
          <span className="absolute top-[7px] right-[7px] size-[7px] bg-[#ef4444] rounded-full border border-white" />
          {hasBadge && (
            <span className="absolute top-[5px] right-[5px] size-[11px] rounded-full bg-[#ef4444] opacity-40 animate-ping" />
          )}
        </button>
      </header>

      <NotificationPanel
        open={showNotifications}
        onClose={toggleNotifications}
        onNavigate={onNavigate}
        approvals={approvals}
        onApprove={onApprove}
        onReject={onReject}
      />
    </>
  );
}
