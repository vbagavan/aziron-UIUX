import { useState, useRef, useEffect, useMemo } from "react";
import {
  Sparkles, Bot, BrainCog, Vault, BarChart2, LayoutDashboard, Users, Workflow,
  ChevronDown, ChevronsUpDown, Settings, LogOut,
  UserCircle, ShieldCheck, Clock, Building2, Tag, Store,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
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
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";

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
      { icon: Store,     label: "Marketplace",    page: "marketplace" },
      { icon: Vault,     label: "Vault",           page: "vault"     },
      {
        icon: Users, label: "User Management", page: "users",
        subItems: [
          { icon: UserCircle, label: "Users", page: "tenant-users" },
          { icon: Users, label: "User Groups", page: "user-groups" },
          { icon: ShieldCheck,label: "Roles", page: "users-roles" },
        ],
      },
      { icon: BarChart2, label: "Usage", page: "usage" },
      { icon: LayoutDashboard, label: "Pulse", page: "pulse" },
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
  {
    id: "admin", label: "ADMIN",
    items: [
      { icon: Building2, label: "Tenants",        page: "tenants"       },
      { icon: Tag,       label: "Pricing & Plans", page: "pricing-plans" },
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
  if (itemPage === "users" && (activePage === "users-list" || activePage === "user-groups" || activePage === "users-roles" || activePage === "tenant-users")) return true;
  if (itemPage === "tenants" && activePage === "tenant-detail") return true;

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
function LogoutModal({ onConfirm, onCancel, displayName = "Admin", displayEmail = "admin@aziro.com", initials = "A" }) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent showCloseButton={false} className="w-[340px] max-w-[340px] overflow-hidden rounded-2xl p-0 gap-0">
        <div className="h-1 w-full bg-gradient-to-r from-destructive to-orange-500" />
        <div className="px-6 pt-6 pb-5 flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="size-14 rounded-full bg-destructive/10 dark:bg-destructive/20 flex items-center justify-center">
              <div className="size-9 rounded-full bg-destructive/20 dark:bg-destructive/30 flex items-center justify-center">
                <LogOut size={18} className="text-destructive" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold text-foreground">Log out of Aziron?</h2>
              <p className="text-sm text-muted-foreground leading-5">
                You'll be signed out of your current session.<br />Any unsaved work may be lost.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-muted border border-border rounded-2xl">
            <Avatar className="size-8 flex-shrink-0">
              <AvatarImage src={imgUserAvatar} /><AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-foreground">{displayName}</span>
              <span className="text-sm text-muted-foreground">{displayEmail}</span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={onCancel}
              className="flex-1 h-10 rounded-2xl border border-border bg-background text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-10 rounded-2xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── User footer ──────────────────────────────────────────────── */
function UserFooter({ onNavigate }) {
  const { state } = useSidebar();
  const { auth, logout } = useAuth();
  const collapsed = state === "collapsed";
  const [open, setOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const displayName  = auth.user?.name  ?? "Admin";
  const displayEmail = auth.user?.email ?? "admin@aziro.com";
  const initials     = displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

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
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden z-[9999] shadow-lg max-h-100 overflow-y-auto"
          style={menuStyle}>
          <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <Avatar className="size-7 flex-shrink-0">
              <AvatarImage src={imgUserAvatar} /><AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{displayName}</span>
              <span className="text-xs text-slate-600 dark:text-slate-400">{displayEmail}</span>
            </div>
          </div>
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.label} onClick={item.onClick}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  item.danger
                    ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                    : "text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}>
                <Icon size={14} /> {item.label}
              </button>
            );
          })}
        </div>
      )}

      {showLogout && (
        <LogoutModal
          displayName={displayName} displayEmail={displayEmail} initials={initials}
          onConfirm={() => { setShowLogout(false); logout(); }}
          onCancel={() => setShowLogout(false)}
        />
      )}

      {collapsed ? (
        <button ref={triggerRef} onClick={handleToggle}
          className={`flex items-center justify-center w-full p-1 rounded-2xl transition-colors ${
            open ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"
          }`}>
          <Avatar className="size-6"><AvatarImage src={imgUserAvatar} /><AvatarFallback>A</AvatarFallback></Avatar>
        </button>
      ) : (
        <button ref={triggerRef} onClick={handleToggle}
          className={`flex items-center gap-2 w-full px-2 py-2 rounded-2xl transition-colors justify-between ${
            open
              ? "bg-slate-100 dark:bg-slate-800"
              : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
          } border border-slate-200 dark:border-slate-700`}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar className="size-6 flex-shrink-0"><AvatarImage src={imgUserAvatar} /><AvatarFallback>{initials}</AvatarFallback></Avatar>
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-none">{displayName}</span>
              <span className="text-sm text-slate-600 dark:text-slate-400 leading-4 truncate w-full">{displayEmail}</span>
            </div>
          </div>
          <ChevronsUpDown size={16} className={`flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} text-slate-600 dark:text-slate-400`} />
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
              <SidebarMenuButton
                tooltip={item.subItems?.length ? (sidebarCollapsed ? item.label : undefined) : item.label}
                isActive={isParentActive}
                className="relative"
                onClick={() => { if (!sidebarCollapsed) handleToggle(!subOpen); }}
              >
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-full bg-blue-600 transition-all duration-300"
                  style={{ height: isParentActive ? 18 : 0, opacity: isParentActive ? 1 : 0 }}
                />
                {item.icon && (
                  <item.icon
                    style={{ transform: isParentActive ? "scale(1.15)" : "scale(1)", transition: "transform 0.2s" }}
                    className={isParentActive ? "text-blue-900 dark:text-blue-400" : ""}
                  />
                )}
                <span className={isParentActive ? "font-medium" : ""}>{item.label}</span>
                {!sidebarCollapsed && (
                  <ChevronDown
                    size={13}
                    className={cn(
                      "ml-auto transition-transform duration-200",
                      subOpen && "rotate-180",
                    )}
                  />
                )}
              </SidebarMenuButton>

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
                          className="gap-2"
                        >
                          {!sub.noIcon && sub.icon && (
                            <sub.icon size={13} className={subIsActive ? "text-blue-600" : "text-sidebar-foreground/60"} />
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
            className="fixed bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg overflow-hidden pointer-events-auto max-h-100 overflow-y-auto z-[99999]"
            style={popoverStyle}
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
                      ? "bg-blue-100 dark:bg-blue-950 text-blue-600 font-medium"
                      : "text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {!sub.noIcon && sub.icon && (
                    <sub.icon size={13} className={subIsActive ? "text-blue-600" : ""} />
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
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-full bg-blue-600 transition-all duration-300"
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
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-full bg-blue-600 transition-all duration-300"
          style={{ height: active ? 18 : 0, opacity: active ? 1 : 0 }}
        />
        <item.icon
          style={{ transform: active ? "scale(1.15)" : "scale(1)", transition: "transform 0.2s" }}
          className={isParentActive ? "text-blue-900 dark:text-blue-400" : ""}
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
  const { auth } = useAuth();

  // Tenant role: now has access to ADMIN section (Tenants, Pricing & Plans)
  const visibleGroups = navGroups;

  return (
    <Sidebar collapsible="icon">
      {/* Logo */}
      <LogoHeader onNavigate={onNavigate} />

      {/* Nav */}
      <SidebarContent>
        {visibleGroups.map(group => (
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
