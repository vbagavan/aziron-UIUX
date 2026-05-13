/** Maps legacy `currentPage` ids (Sidebar / onNavigate) to URL paths. */
export const PAGE_PATH = {
  "new-chat": "/new-chat",
  agents: "/agents",
  "agent-detail": "/agents/detail",
  chat: "/chat",
  kudos: "/kudos",
  settings: "/settings",
  notifications: "/notifications",
  flows: "/flows",
  "flow-view": "/flows",
  users: "/users",
  "users-list": "/users",
  "user-detail": "/users/detail",
  "user-groups": "/user-groups",
  usage: "/usage",
  /** Sidebar “Roles” → tenant users until a dedicated roles route exists */
  "users-roles": "/tenant-users",
  vault: "/vault",
  knowledge: "/knowledge",
  marketplace: "/marketplace",
  pulse: "/pulse",
  tenants: "/tenants",
  "tenant-detail": "/tenants/detail",
  "tenant-create": "/tenants/new",
  "pricing-plans": "/pricing-plans",
  "tenant-users": "/tenant-users",
};

/**
 * Sidebar active highlight: derive legacy page id from location.pathname.
 */
export function pathToActivePage(pathname) {
  if (!pathname || pathname === "/") return "new-chat";
  if (pathname === "/new-chat") return "new-chat";
  if (pathname.startsWith("/flows") || pathname === "/create-flow") return "flows";
  if (pathname.startsWith("/agents/detail")) return "agent-detail";
  if (pathname.startsWith("/agents")) return "agents";
  if (pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/kudos")) return "kudos";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/notifications")) return "notifications";
  if (pathname.startsWith("/users/detail")) return "user-detail";
  if (pathname.startsWith("/users")) return "tenant-users";
  if (pathname.startsWith("/user-groups")) return "user-groups";
  if (pathname.startsWith("/usage")) return "usage";
  if (pathname.startsWith("/vault")) return "vault";
  if (pathname.startsWith("/knowledge")) return "knowledge";
  if (pathname.startsWith("/marketplace")) return "marketplace";
  if (pathname.startsWith("/pulse")) return "pulse";
  if (pathname.startsWith("/tenants/new")) return "tenant-create";
  if (pathname.startsWith("/tenants/detail")) return "tenant-detail";
  if (pathname.startsWith("/tenants")) return "tenants";
  if (pathname.startsWith("/pricing-plans")) return "pricing-plans";
  if (pathname.startsWith("/tenant-users")) return "tenant-users";
  return "new-chat";
}
