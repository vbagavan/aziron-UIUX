/**
 * Per-hub RBAC — distinct from the org-level roles in @/config/rbac.
 *
 * Sharing happens only at the Knowledge Hub level: a member who can access the
 * hub can access every source and generated asset inside it. These roles govern
 * what that member may *do* once inside.
 *
 *   Viewer       → read + ask AI + generate (consume knowledge)
 *   Contributor  → Viewer + add sources, connect DBs/APIs, pin assets
 *   Editor       → Contributor + delete sources, archive assets, manage members
 *   Owner        → Editor + delete hub / transfer ownership (implicit, creator)
 */

export const HUB_ROLES = ["viewer", "contributor", "editor", "owner"];

/** Display metadata for each role. */
export const HUB_ROLE_META = {
  viewer: {
    label: "Viewer",
    description: "View sources & assets, ask AI, generate content.",
    badgeClass: "border-border bg-muted/50 text-muted-foreground",
    rank: 1,
  },
  contributor: {
    label: "Contributor",
    description: "Everything a Viewer can do, plus add sources & connections.",
    badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    rank: 2,
  },
  editor: {
    label: "Editor",
    description: "Everything a Contributor can do, plus delete, archive & manage members.",
    badgeClass: "border-primary/35 bg-primary/10 text-primary dark:bg-primary/15",
    rank: 3,
  },
  owner: {
    label: "Owner",
    description: "Full control, including deleting the hub and transferring ownership.",
    badgeClass:
      "border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300",
    rank: 4,
  },
};

/** Roles a person can be assigned when shared with (Owner is not assignable). */
export const ASSIGNABLE_HUB_ROLES = ["viewer", "contributor", "editor"];

export function hubRoleRank(role) {
  return HUB_ROLE_META[role]?.rank ?? 0;
}

export function hubRoleLabel(role) {
  return HUB_ROLE_META[role]?.label ?? "Viewer";
}

/**
 * Minimum role required for each action inside a hub.
 * A role grants an action when its rank ≥ the action's minimum rank.
 */
export const HUB_ACTION_MIN_ROLE = {
  // consume
  "sources.view": "viewer",
  "assets.view": "viewer",
  "ai.ask": "viewer",
  "ai.generate": "viewer",
  "members.view": "viewer",
  // contribute
  "sources.upload": "contributor",
  "connections.manage": "contributor",
  "assets.pin": "contributor",
  // edit / govern
  "sources.delete": "editor",
  "assets.archive": "editor",
  "assets.delete": "editor",
  "hub.editMeta": "editor",
  "hub.share": "editor",
  "members.manage": "editor",
  // own
  "hub.delete": "owner",
  "hub.transfer": "owner",
};

/** Can a role perform an action inside a hub? */
export function hubRoleCan(role, action) {
  const min = HUB_ACTION_MIN_ROLE[action];
  if (!min) return false;
  return hubRoleRank(role) >= hubRoleRank(min);
}

/** Build a bound checker: `const can = hubCan(role); can("assets.archive")`. */
export function hubCan(role) {
  return (action) => hubRoleCan(role, action);
}

/**
 * Resolve the current user's effective role on a hub.
 *
 * Precedence:
 *   1. Explicit membership for this user → that role (so a user listed at a
 *      lower role is genuinely restricted).
 *   2. Otherwise Owner. This is a single-tenant prototype where the viewing
 *      user is the workspace owner of every hub; the "View as" control is how
 *      lower roles are previewed. This also preserves the pre-feature behaviour
 *      where seed hubs were fully editable.
 */
export function resolveHubRole(hub, user) {
  if (!hub) return "viewer";
  const email = (user?.email ?? "").toLowerCase();

  if (email) {
    const mine = (hub.members ?? []).find(
      (m) => m.principalType === "user" && (m.email ?? "").toLowerCase() === email,
    );
    if (mine?.role) return mine.role;
  }

  return "owner";
}
