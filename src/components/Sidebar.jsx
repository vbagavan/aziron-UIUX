import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Bot,
  BrainCog,
  Vault,
  BarChart2,
  Users,
  Workflow,
  ChevronDown,
  ChevronsUpDown,
  Settings,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const imgAzironLogo = "https://www.figma.com/api/mcp/asset/f4c83c9c-c4ed-4c76-880e-b0d714d34c1e";
const imgUserAvatar = "https://www.figma.com/api/mcp/asset/6a5664fe-b4d1-48b0-bc2f-f6023a197ef0";

const recentChats = [
  "Product Roadmap",
  "Q3 OKRs",
  "Team Lunch at Joe's",
  "Customer Feedback Review",
  "Budget for Q4",
  "Marketing Campaign Brainstorm",
  "New Hire Onboarding",
  "Team Introduction Session",
  "Company Policies Overview",
  "Role-Specific Training",
  "Software Setup and Access",
  "Performance Expectations",
  "Mentorship Program Intro",
  "Introduction to Company Culture",
  "First Week Check-in",
];

const navGroups = [
  {
    id: "build",
    label: "Build",
    items: [
      { icon: Sparkles, label: "New Chat", page: "new-chat" },
      { icon: Bot,      label: "Agents",   page: "agents" },
      { icon: Workflow, label: "Flows",     page: "flows" },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    items: [
      { icon: BrainCog,  label: "Knowledge Hub",   page: "knowledge" },
      { icon: Vault,     label: "Vault",            page: "vault" },
      { icon: Users,     label: "User Management",  page: "users" },
      { icon: BarChart2, label: "Usage",            page: "usage" },
    ],
  },
];

const collapsedNavIcons = [
  { icon: Sparkles,  page: "new-chat" },
  { icon: Bot,       page: "agents" },
  { icon: Workflow,  page: "flows" },
  { icon: BrainCog,  page: "knowledge" },
  { icon: Vault,     page: "vault" },
  { icon: Users,     page: "users" },
  { icon: BarChart2, page: "usage" },
];

function isActive(itemPage, activePage) {
  if (itemPage === activePage) return true;
  if (itemPage === "agents" && activePage === "chat") return true;
  return false;
}

function NavGroup({ label, items, activePage, onNavigate }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between px-2 h-7 rounded-[6px] hover:bg-[#d3d3d3]/50 dark:hover:bg-[#334155] transition-colors"
      >
        <span className="text-xs font-medium text-[#363636]/70 dark:text-[#cbd5e1] leading-none">{label}</span>
        <ChevronDown
          size={14}
          className={`text-[#363636]/70 dark:text-[#cbd5e1] transition-transform duration-150 ${open ? "" : "-rotate-90"}`}
        />
      </button>

      {open && (
        <div className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active = isActive(item.page, activePage);
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => onNavigate?.(item.page)}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-2 px-2 h-8 rounded-[6px] text-sm w-full overflow-hidden
                  transition-all duration-200 ease-out
                  ${active
                    ? "bg-[#d3d3d3] dark:bg-[#334155] text-[#0f172a] dark:text-[#f1f5f9]"
                    : "text-[#363636] dark:text-[#cbd5e1] hover:bg-[#d3d3d3]/50 dark:hover:bg-[#334155]"
                  }`}
              >
                {/* Left accent bar — grows in height when active */}
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full bg-[#2563eb] transition-all duration-300 ease-out"
                  style={{ height: active ? 18 : 0, opacity: active ? 1 : 0 }}
                />

                {/* Icon — scales up when active */}
                <span
                  className="flex-shrink-0 transition-transform duration-200 ease-out"
                  style={{ transform: active ? "scale(1.18)" : "scale(1)" }}
                >
                  <Icon
                    size={16}
                    className={`transition-colors duration-200 ${active ? "text-[#1e3a8a] dark:text-[#60a5fa]" : ""}`}
                  />
                </span>

                <span className={`truncate text-left transition-all duration-200 ${active ? "font-medium" : ""}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ collapsed, activePage = "agents", onNavigate }) {
  return (
    <aside
      className={`flex flex-col bg-[#f1f2f6] dark:bg-[#1e293b] flex-shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out ${
        collapsed ? "w-10" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center flex-shrink-0 p-2 ${collapsed ? "justify-center" : ""}`}>
        <button
          onClick={() => onNavigate?.("agents")}
          aria-label="Go to Aziron home"
          className={`flex items-center gap-2 px-1 py-1 rounded-[6px] hover:bg-[#d3d3d3]/50 dark:hover:bg-[#334155] transition-colors ${
            collapsed ? "" : "w-full"
          }`}
        >
          <img
            src={imgAzironLogo}
            alt="Aziron"
            className="w-[25.5px] h-[23px] object-contain flex-shrink-0"
          />
          {!collapsed && (
            <span className="text-sm font-semibold text-[#363636] dark:text-[#e2e8f0] leading-none whitespace-nowrap">
              Aziron
            </span>
          )}
        </button>
      </div>

      {/* Nav */}
      {collapsed ? (
        <div className="flex flex-col items-center gap-2 flex-1 px-1 py-2">
          {collapsedNavIcons.map((item, i) => {
            const active = isActive(item.page, activePage);
            const Icon = item.icon;
            // Find label from navGroups
            const navLabel = navGroups.flatMap(g => g.items).find(n => n.page === item.page)?.label ?? item.page;
            return (
              <button
                key={i}
                onClick={() => onNavigate?.(item.page)}
                aria-label={navLabel}
                title={navLabel}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center justify-center size-8 rounded-[6px]
                  transition-all duration-200 ease-out
                  ${active
                    ? "bg-[#d3d3d3] dark:bg-[#334155] text-[#1e3a8a] dark:text-[#60a5fa]"
                    : "text-[#64748b] dark:text-[#94a3b8] hover:bg-[#d3d3d3]/50 dark:hover:bg-[#334155]"
                  }`}
              >
                {/* Subtle glow ring when active */}
                {active && (
                  <span
                    className="absolute inset-0 rounded-[6px] ring-[1.5px] ring-[#2563eb]/30 transition-opacity duration-300"
                  />
                )}

                {/* Blue bottom dot indicator */}
                <span
                  className="absolute bottom-[3px] left-1/2 -translate-x-1/2 rounded-full bg-[#2563eb] transition-all duration-300 ease-out"
                  style={{
                    width: active ? 4 : 0,
                    height: active ? 4 : 0,
                    opacity: active ? 1 : 0,
                  }}
                />

                {/* Icon — scales up when active */}
                <span
                  className="transition-transform duration-200 ease-out"
                  style={{ transform: active ? "scale(1.2)" : "scale(1)" }}
                >
                  <Icon size={16} />
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 px-2 py-1 gap-1">
          {navGroups.map((group) => (
            <NavGroup
              key={group.id}
              label={group.label}
              items={group.items}
              activePage={activePage}
              onNavigate={onNavigate}
            />
          ))}

          {/* Recent — scrollable */}
          <div className="flex flex-col flex-1 min-h-0 mt-1">
            <div className="flex items-center justify-between px-2 h-7 flex-shrink-0">
              <span className="text-xs font-medium text-[#363636]/70 dark:text-[#cbd5e1] leading-none">Recent</span>
              <ChevronDown size={14} className="text-[#363636]/70 dark:text-[#cbd5e1]" />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-0.5 mt-0.5 pr-0.5">
              {recentChats.map((chat) => (
                <button
                  key={chat}
                  onClick={() => onNavigate?.("chat")}
                  className="flex items-center px-2 h-8 rounded-[6px] text-sm text-[#363636] dark:text-[#cbd5e1] hover:bg-[#d3d3d3]/50 dark:hover:bg-[#334155] transition-colors w-full text-left"
                >
                  <span className="truncate">{chat}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <UserFooter collapsed={collapsed} onNavigate={onNavigate} />
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Logout Confirmation Modal
// ---------------------------------------------------------------------------

function LogoutModal({ onConfirm, onCancel }) {
  // Trap focus & close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onCancel}
        style={{ animation: "fadeIn 0.15s ease-out" }}
      />

      {/* Dialog */}
      <div
        className="relative bg-white dark:bg-[#1e293b] rounded-2xl w-[340px] overflow-hidden"
        style={{
          boxShadow: "0 24px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
          animation: "slideUp 0.2s cubic-bezier(0.34,1.2,0.64,1)",
        }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#ef4444] to-[#f97316]" />

        <div className="px-6 pt-6 pb-5 flex flex-col gap-5">
          {/* Icon + title */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="size-14 rounded-full bg-[#fef2f2] dark:bg-[#450a0a] flex items-center justify-center">
              <div className="size-9 rounded-full bg-[#fee2e2] dark:bg-[#7f1d1d] flex items-center justify-center">
                <LogOut size={18} className="text-[#ef4444]" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold text-[#0f172a] dark:text-[#f1f5f9] leading-snug">
                Log out of Aziron?
              </h2>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-5">
                You'll be signed out of your current session.<br />Any unsaved work may be lost.
              </p>
            </div>
          </div>

          {/* User info chip */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px]">
            <Avatar className="size-8 flex-shrink-0">
              <AvatarImage src={imgUserAvatar} />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#0f172a] dark:text-[#f1f5f9] leading-4">Admin</span>
              <span className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-4">admin@aziro.com</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5">
            <button
              onClick={onCancel}
              className="flex-1 h-10 rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-sm font-medium text-[#475569] dark:text-[#94a3b8] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-10 rounded-[8px] bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut size={14} />
              Log out
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// User Footer with context menu
// ---------------------------------------------------------------------------

function UserFooter({ collapsed, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      if (collapsed) {
        // Appear to the right of the sidebar, aligned to bottom of trigger
        setMenuStyle({
          position: "fixed",
          left: rect.right + 8,
          bottom: window.innerHeight - rect.bottom,
          width: 188,
        });
      } else {
        // Appear above the trigger, same width
        setMenuStyle({
          position: "fixed",
          left: rect.left,
          bottom: window.innerHeight - rect.top + 4,
          width: rect.width,
        });
      }
    }
    setOpen((v) => !v);
  };

  const menuItems = [
    { icon: Settings, label: "Settings", onClick: () => { setOpen(false); onNavigate?.("settings"); } },
    { icon: LogOut,   label: "Logout",   danger: true, onClick: () => { setOpen(false); setShowLogout(true); } },
  ];

  return (
    <div className={`flex items-center flex-shrink-0 p-2 ${collapsed ? "justify-center" : ""}`}>

      {/* Context menu — fixed so it escapes overflow:hidden on aside */}
      {open && (
        <div
          ref={menuRef}
          className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] overflow-hidden z-[9999]"
          style={{
            ...menuStyle,
            boxShadow: "0 8px 24px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)",
          }}
        >
          {/* User info header */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-[#f1f5f9] dark:border-[#1e293b]">
            <Avatar className="size-7 flex-shrink-0">
              <AvatarImage src={imgUserAvatar} />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#0f172a] dark:text-[#f1f5f9] leading-4 truncate">Admin</span>
              <span className="text-xs text-[#64748b] dark:text-[#94a3b8] leading-4 truncate">admin@aziro.com</span>
            </div>
          </div>

          {/* Menu items */}
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  item.danger
                    ? "text-[#ef4444] hover:bg-[#fef2f2] dark:hover:bg-[#450a0a]"
                    : "text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a]"
                }`}
              >
                <Icon size={14} className="flex-shrink-0" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Logout confirmation modal */}
      {showLogout && (
        <LogoutModal
          onConfirm={() => setShowLogout(false)}
          onCancel={() => setShowLogout(false)}
        />
      )}

      {/* Trigger — collapsed avatar or expanded dark pill */}
      {collapsed ? (
        <button
          ref={triggerRef}
          onClick={handleToggle}
          className={`flex items-center justify-center p-1 rounded-[8px] transition-colors ${
            open ? "bg-[#d3d3d3] dark:bg-[#334155]" : "hover:bg-[#d3d3d3]/50 dark:hover:bg-[#334155]"
          }`}
        >
          <Avatar className="size-6">
            <AvatarImage src={imgUserAvatar} />
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
        </button>
      ) : (
        <button
          ref={triggerRef}
          onClick={handleToggle}
          className={`flex items-center gap-2 w-full px-2 py-2 rounded-[8px] transition-colors ${
            open ? "bg-[#3a3a3a]" : "bg-[#2d2d2d] hover:bg-[#3a3a3a]"
          }`}
        >
          <Avatar className="size-6 flex-shrink-0">
            <AvatarImage src={imgUserAvatar} />
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start flex-1 min-w-0">
            <span className="text-sm font-semibold text-[#fafafa] leading-none">Admin</span>
            <span className="text-sm text-[#fafafa]/70 leading-4 tracking-[0.12px] truncate w-full">
              admin@aziro.com
            </span>
          </div>
          <ChevronsUpDown
            size={16}
            className={`flex-shrink-0 transition-transform duration-200 ${
              open ? "rotate-180 text-[#fafafa]" : "text-[#fafafa]/70"
            }`}
          />
        </button>
      )}
    </div>
  );
}
