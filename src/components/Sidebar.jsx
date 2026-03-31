import { useState, useRef, useEffect, useMemo } from "react";
import {
  Sparkles, Bot, BrainCog, Vault, BarChart2, Users, Workflow,
  ChevronDown, ChevronsUpDown, Settings, LogOut,
  UserCircle, ShieldCheck, Clock,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

const imgAzironLogo = "/logo.svg";
const imgAzironLogoExpanded = "/logo-expanded.svg";
const imgUserAvatar = "https://www.figma.com/api/mcp/asset/6a5664fe-b4d1-48b0-bc2f-f6023a197ef0";

const recentChatsData = [
  "Product Roadmap", "Q3 OKRs", "Team Lunch at Joe's",
  "Customer Feedback Review", "Budget for Q4",
  "Marketing Campaign Brainstorm", "New Hire Onboarding",
  "Team Introduction Session", "Company Policies Overview",
  "Role-Specific Training", "Software Setup and Access",
  "Performance Expectations", "Mentorship Program Intro",
  "Introduction to Company Culture", "First Week Check-in",
];

const navGroups = [
  {
    id: "build", label: "BUILD",
    items: [
      { icon: Sparkles, label: "New Chat", page: "new-chat" },
      { icon: Bot,      label: "Agents",   page: "agents"   },
      { icon: Workflow, label: "Flows",     page: "flows"    },
    ],
  },
  {
    id: "platform", label: "PLATFORM",
    items: [
      { icon: BrainCog,  label: "Knowledge Hub",  page: "knowledge" },
      { icon: Vault,     label: "Vault",           page: "vault"     },
      {
        icon: Users, label: "User Management", page: "users",
        subItems: [
          { icon: UserCircle, label: "Users", page: "users-list"  },
          { icon: Users, label: "User Groups", page: "user-groups" },
          { icon: ShieldCheck,label: "Roles", page: "users-roles" },
        ],
      },
      { icon: BarChart2, label: "Usage", page: "usage" },
      {
        icon: Clock,
        label: "History",
        page: "history",
        activeFor: ["chat"],
        subItems: recentChatsData.map(chat => ({
          label: chat,
          page: "chat",
          noIcon: true,
          trackActive: false,
        })),
      },
    ],
  },
];

/**
 * Determines if a navigation item or page is currently active
 * Handles parent-child relationships and routing aliases
 */
function isActive(itemPage, activePage, activeFor = []) {
  // Direct match
  if (itemPage === activePage) return true;

  if (activeFor.includes(activePage)) return true;

  // Handle routing aliases and related pages
  if (itemPage === "users" && (activePage === "users-list" || activePage === "user-groups" || activePage === "users-roles")) return true;

  return false;
}

/**
 * Checks if any child items are active (used for parent highlighting)
 */
function hasActiveChild(items, activePage) {
  return items?.some(item =>
    item.page === activePage ||
    (item.subItems && item.subItems.some(sub => sub.page === activePage))
  );
}

/**
 * SIDEBAR ARCHITECTURE
 * ════════════════════════════════════════════════════════════════
 *
 * Structure:
 * - SidebarHeader: Logo (responsive to collapsed state)
 * - SidebarContent:
 *   - NavGroup: Collapsible groups (Build, Platform)
 *     - NavItem: Individual menu items with optional submenus
 * - SidebarFooter: User profile & account actions
 *
 * Features:
 * ✓ Auto-expand groups/submenus when child items are active
 * ✓ Collapsed icon mode with hover tooltips
 * ✓ Active state indicators (blue left bar + icon scaling)
 * ✓ Parent-child state management
 * ✓ Responsive user menu positioning
 * ✓ Keyboard support (Escape closes menus)
 * ════════════════════════════════════════════════════════════════
 */

/* ── Logout modal ─────────────────────────────────────────────── */
function LogoutModal({ onConfirm, onCancel }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onCancel}
        style={{ animation: "fadeIn 0.15s ease-out" }} />
      <div className="relative bg-white dark:bg-[#1e293b] rounded-2xl w-[340px] overflow-hidden"
        style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.18)", animation: "slideUp 0.2s cubic-bezier(0.34,1.2,0.64,1)" }}>
        <div className="h-1 w-full bg-gradient-to-r from-[#ef4444] to-[#f97316]" />
        <div className="px-6 pt-6 pb-5 flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="size-14 rounded-full bg-[#fef2f2] dark:bg-[#450a0a] flex items-center justify-center">
              <div className="size-9 rounded-full bg-[#fee2e2] dark:bg-[#7f1d1d] flex items-center justify-center">
                <LogOut size={18} className="text-[#ef4444]" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold text-[#0f172a] dark:text-[#f1f5f9]">Log out of Aziron?</h2>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-5">
                You'll be signed out of your current session.<br />Any unsaved work may be lost.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px]">
            <Avatar className="size-8 flex-shrink-0">
              <AvatarImage src={imgUserAvatar} /><AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#0f172a] dark:text-[#f1f5f9]">Admin</span>
              <span className="text-sm text-[#64748b] dark:text-[#94a3b8]">admin@aziro.com</span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button onClick={onCancel}
              className="flex-1 h-10 rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-sm font-medium text-[#475569] dark:text-[#94a3b8] hover:bg-[#f8fafc] transition-colors">
              Cancel
            </button>
            <button onClick={onConfirm}
              className="flex-1 h-10 rounded-[8px] bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-colors">
              <LogOut size={14} /> Log out
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>
    </div>
  );
}

/* ── User footer ──────────────────────────────────────────────── */
function UserFooter({ onNavigate }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [open, setOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      if (collapsed) {
        setMenuStyle({ position: "fixed", left: rect.right + 8, bottom: window.innerHeight - rect.bottom, width: 188 });
      } else {
        setMenuStyle({ position: "fixed", left: rect.left, bottom: window.innerHeight - rect.top + 4, width: rect.width });
      }
    }
    setOpen(v => !v);
  };

  const menuItems = [
    { icon: Settings, label: "Settings", onClick: () => { setOpen(false); onNavigate?.("settings"); } },
    { icon: LogOut,   label: "Logout",   danger: true, onClick: () => { setOpen(false); setShowLogout(true); } },
  ];

  return (
    <>
      {open && (
        <div ref={menuRef}
          className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] overflow-hidden z-[9999]"
          style={{ ...menuStyle, boxShadow: "0 8px 24px rgba(0,0,0,0.13)" }}>
          <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-[#f1f5f9] dark:border-[#334155]">
            <Avatar className="size-7 flex-shrink-0">
              <AvatarImage src={imgUserAvatar} /><AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#0f172a] dark:text-[#f1f5f9]">Admin</span>
              <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">admin@aziro.com</span>
            </div>
          </div>
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.label} onClick={item.onClick}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  item.danger
                    ? "text-[#ef4444] hover:bg-[#fef2f2] dark:hover:bg-[#450a0a]"
                    : "text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a]"
                }`}>
                <Icon size={14} /> {item.label}
              </button>
            );
          })}
        </div>
      )}

      {showLogout && (
        <LogoutModal onConfirm={() => setShowLogout(false)} onCancel={() => setShowLogout(false)} />
      )}

      {collapsed ? (
        <button ref={triggerRef} onClick={handleToggle}
          className={`flex items-center justify-center w-full p-1 rounded-[8px] transition-colors ${
            open ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"
          }`}>
          <Avatar className="size-6"><AvatarImage src={imgUserAvatar} /><AvatarFallback>A</AvatarFallback></Avatar>
        </button>
      ) : (
        <button ref={triggerRef} onClick={handleToggle}
          className={`flex items-center gap-2 w-full px-2 py-2 rounded-[8px] transition-colors justify-between ${
            open
              ? "bg-[#f1f5f9] dark:bg-[#334155]"
              : "bg-white dark:bg-[#1e293b] hover:bg-[#f8fafc] dark:hover:bg-[#334155]"
          } border border-[#e2e8f0] dark:border-[#334155]`}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar className="size-6 flex-shrink-0"><AvatarImage src={imgUserAvatar} /><AvatarFallback>A</AvatarFallback></Avatar>
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9] leading-none">Admin</span>
              <span className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-4 truncate w-full">admin@aziro.com</span>
            </div>
          </div>
          <ChevronsUpDown size={16} className={`flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} text-[#64748b] dark:text-[#94a3b8]`} />
        </button>
      )}
    </>
  );
}

/* ── Nav item (with optional submenu) ─────────────────────────── */
function NavItem({ item, activePage, onNavigate }) {
  const { state } = useSidebar();
  const sidebarCollapsed = state === "collapsed";
  const active = isActive(item.page, activePage, item.activeFor || []);
  const subActive = item.subItems?.some(s => s.trackActive !== false && s.page === activePage);
  const isParentActive = active || subActive;

  // Initialize submenu open state: open if sidebar not collapsed AND (item is active OR child is active)
  const [subOpen, setSubOpen] = useState(!sidebarCollapsed && isParentActive);
  const [isHovering, setIsHovering] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState({});
  const [isPopoverHovered, setIsPopoverHovered] = useState(false);
  const itemRef = useRef(null);
  const popoverRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  // Auto-expand submenu when a child becomes active
  useEffect(() => {
    if (!sidebarCollapsed && subActive && !subOpen) {
      setSubOpen(true);
    }
  }, [subActive, sidebarCollapsed, subOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    if (!showPopover) return;
    const h = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target) &&
          itemRef.current && !itemRef.current.contains(e.target)) {
        setShowPopover(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showPopover]);

  // Handle hover for both collapsed and expanded sidebars
  const handleHoverEnter = () => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (sidebarCollapsed && item.subItems?.length) {
      // Show popover for collapsed sidebar
      if (itemRef.current) {
        const rect = itemRef.current.getBoundingClientRect();
        setPopoverStyle({
          position: "fixed",
          left: rect.right + 8,
          top: rect.top,
          width: 200,
          zIndex: 99999,
        });
      }
      setShowPopover(true);
    } else if (!sidebarCollapsed) {
      // Show inline submenu for expanded sidebar
      setIsHovering(true);
      setSubOpen(true);
    }
  };

  const handleHoverLeave = () => {
    setIsHovering(false);
    // Set a timeout to close popover only if popover is not hovered
    closeTimeoutRef.current = setTimeout(() => {
      if (!isPopoverHovered && !isParentActive) {
        setShowPopover(false);
      }
    }, 150);
    // Only close if not explicitly activated by child or parent
    if (!isParentActive && !sidebarCollapsed) {
      setSubOpen(false);
    }
  };

  const handlePopoverHoverEnter = () => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsPopoverHovered(true);
    setShowPopover(true);
  };

  const handlePopoverHoverLeave = () => {
    setIsPopoverHovered(false);
    if (!isParentActive) {
      setShowPopover(false);
    }
  };

  const handleToggle = (newState) => {
    setSubOpen(newState);
  };

  if (item.subItems?.length) {
    return (
      <>
        <SidebarMenuItem
          ref={itemRef}
          onMouseEnter={handleHoverEnter}
          onMouseLeave={handleHoverLeave}
        >
          <Collapsible
            open={sidebarCollapsed ? false : subOpen}
            onOpenChange={handleToggle}
            className="group/sub w-full"
          >
            <CollapsibleTrigger asChild className="w-full">
              <SidebarMenuButton
                tooltip={item.label}
                isActive={isParentActive}
                className="relative"
              >
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full bg-[#2563eb] transition-all duration-300"
                  style={{ height: isParentActive ? 18 : 0, opacity: isParentActive ? 1 : 0 }}
                />
                {item.icon && (
                  <item.icon
                    style={{ transform: isParentActive ? "scale(1.15)" : "scale(1)", transition: "transform 0.2s" }}
                    className={isParentActive ? "text-[#1e3a8a] dark:text-[#60a5fa]" : ""}
                  />
                )}
                <span className={isParentActive ? "font-medium" : ""}>{item.label}</span>
                {!sidebarCollapsed && (
                  <ChevronDown
                    size={13}
                    className="ml-auto transition-transform duration-200 group-data-[state=open]/sub:rotate-180"
                  />
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>

            {!sidebarCollapsed && (
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.subItems.map(sub => {
                    const subIsActive = sub.trackActive !== false && sub.page === activePage;
                    return (
                      <SidebarMenuSubItem key={sub.label}>
                        <SidebarMenuSubButton
                          isActive={subIsActive}
                          onClick={() => onNavigate?.(sub.page)}
                          className={sub.noIcon ? "gap-2 pl-2" : "gap-2"}
                        >
                          {!sub.noIcon && sub.icon && (
                            <sub.icon size={13} className={subIsActive ? "text-[#2563eb]" : "text-sidebar-foreground/60"} />
                          )}
                          <span className="truncate">{sub.label}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            )}
          </Collapsible>
        </SidebarMenuItem>

        {/* Popover menu for collapsed sidebar */}
        {sidebarCollapsed && showPopover && (
          <div
            ref={popoverRef}
            onMouseEnter={handlePopoverHoverEnter}
            onMouseLeave={handlePopoverHoverLeave}
            className="fixed bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[8px] shadow-lg overflow-hidden pointer-events-auto max-h-[400px] overflow-y-auto"
            style={{
              ...popoverStyle,
              zIndex: 99999,
            }}
          >
            {item.subItems.map(sub => {
              const subIsActive = sub.trackActive !== false && sub.page === activePage;
              return (
                <button
                  key={sub.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate?.(sub.page);
                    setShowPopover(false);
                  }}
                  type="button"
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors cursor-pointer ${
                    sub.noIcon ? "pl-2" : ""
                  } ${
                    subIsActive
                      ? "bg-[#e0e7ff] dark:bg-[#1e3a8a] text-[#2563eb] font-medium"
                      : "text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a]"
                  }`}
                >
                  {!sub.noIcon && sub.icon && (
                    <sub.icon size={13} className={subIsActive ? "text-[#2563eb]" : ""} />
                  )}
                  <span className="truncate">{sub.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </>
    );
  }

  // Render item without icon (for Recent chats)
  if (item.noIcon) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.label}
          isActive={active}
          onClick={() => onNavigate?.(item.page)}
          className="relative"
        >
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full bg-[#2563eb] transition-all duration-300"
            style={{ height: active ? 18 : 0, opacity: active ? 1 : 0 }}
          />
          <span className={`truncate ${active ? "font-medium" : ""}`}>{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.label}
        isActive={active}
        onClick={() => onNavigate?.(item.page)}
        className="relative"
      >
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full bg-[#2563eb] transition-all duration-300"
          style={{ height: active ? 18 : 0, opacity: active ? 1 : 0 }}
        />
        <item.icon
          style={{ transform: active ? "scale(1.15)" : "scale(1)", transition: "transform 0.2s" }}
          className={active ? "text-[#1e3a8a] dark:text-[#60a5fa]" : ""}
        />
        <span className={active ? "font-medium" : ""}>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/* ── Collapsible nav group ─────────────────────────────────────── */
function NavGroup({ group, activePage, onNavigate }) {
  const { state } = useSidebar();
  const sidebarCollapsed = state === "collapsed";

  // Check if any item in this group is active (for auto-expand behavior)
  const hasActiveItem = hasActiveChild(group.items, activePage);

  // Initialize group open state: open by default, but can be manually toggled
  // Keep open if sidebar is not collapsed OR if an item in this group is active
  const [open, setOpen] = useState(true);

  // Auto-expand group when an item inside becomes active
  useEffect(() => {
    if (hasActiveItem && !open) {
      setOpen(true);
    }
  }, [hasActiveItem, open]);

  return (
    <Collapsible
      open={sidebarCollapsed ? true : open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="flex w-full items-center justify-between hover:text-sidebar-foreground">
            {group.label}
            <ChevronDown
              size={14}
              className="transition-transform duration-150 group-data-[state=closed]/collapsible:-rotate-90"
            />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map(item => (
                <NavItem
                  key={item.label}
                  item={item}
                  activePage={activePage}
                  onNavigate={onNavigate}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

/* ── Logo header ──────────────────────────────────────────────── */
function LogoHeader({ onNavigate }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarHeader className="p-2">
      <button onClick={() => onNavigate?.("agents")} aria-label="Go to Aziron home"
        className={`flex w-full items-center rounded-[8px] px-1 py-1 ${isCollapsed ? "justify-center" : "justify-start"}`}>
        <img
          src={isCollapsed ? imgAzironLogo : imgAzironLogoExpanded}
          alt="Aziron"
          className="object-contain flex-shrink-0"
          style={isCollapsed ? { width: 25.5, height: 23 } : { height: 28 }}
        />
      </button>
    </SidebarHeader>
  );
}

/* ── Main export ──────────────────────────────────────────────── */
export default function AppSidebar({ activePage = "agents", onNavigate }) {
  return (
    <Sidebar collapsible="icon">
      {/* Logo */}
      <LogoHeader onNavigate={onNavigate} />

      {/* Nav */}
      <SidebarContent>
        {navGroups.map(group => (
          <NavGroup key={group.id} group={group} activePage={activePage} onNavigate={onNavigate} />
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-2">
        <UserFooter onNavigate={onNavigate} />
      </SidebarFooter>
    </Sidebar>
  );
}
