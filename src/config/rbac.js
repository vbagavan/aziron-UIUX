/**
 * RBAC — Role-Based Access Control Permission Matrix
 *
 * Three platform roles:
 *   superadmin   — Global platform control (Aziron staff)
 *   tenantadmin  — Org-level administration (customer IT / admin team)
 *   tenantuser   — Execution-level access (end users)
 *
 * Permission keys follow the pattern: resource.action
 * true  = allowed
 * false = denied (action hidden or disabled in UI)
 */

export const PERMISSIONS = {
  /* ── Super Admin ── full platform access ───────────────────── */
  superadmin: {
    // Agents
    "agents.view":       true,
    "agents.create":     true,
    "agents.edit":       true,
    "agents.delete":     true,
    "agents.publish":    true,
    "agents.fork":       true,
    "agents.run":        true,
    // Flows
    "flows.view":        true,
    "flows.create":      true,
    "flows.edit":        true,
    "flows.delete":      true,
    "flows.run":         true,
    // Knowledge Hub
    "knowledge.view":    true,
    "knowledge.create":  true,
    "knowledge.edit":    true,
    "knowledge.delete":  true,
    // Marketplace
    "marketplace.view":  true,
    "marketplace.fork":  true,
    "marketplace.publish": true,
    "marketplace.manage":  true,
    // Vault
    "vault.view":        true,
    "vault.create":      true,
    "vault.delete":      true,
    // User Management
    "users.view":        true,
    "users.invite":      true,
    "users.edit":        true,
    "users.remove":      true,
    "users.assign_role": true,
    // Usage & Analytics
    "usage.view":        true,
    "usage.export":      true,
    "pulse.view":        true,
    // Tenant Administration (platform-only)
    "tenants.view":      true,
    "tenants.create":    true,
    "tenants.edit":      true,
    "tenants.suspend":   true,
    "tenants.delete":    true,
    // Pricing
    "pricing.view":      true,
    "pricing.edit":      true,
    // Settings
    "settings.org":      true,
    "settings.billing":  true,
    "settings.integrations": true,
    "settings.audit_log":    true,
  },

  /* ── Tenant Admin ── org-scoped management ──────────────────── */
  tenantadmin: {
    // Agents
    "agents.view":       true,
    "agents.create":     true,
    "agents.edit":       true,   // own org only
    "agents.delete":     true,   // own org only
    "agents.publish":    true,   // within org
    "agents.fork":       true,
    "agents.run":        true,
    // Flows
    "flows.view":        true,
    "flows.create":      true,
    "flows.edit":        true,
    "flows.delete":      true,
    "flows.run":         true,
    // Knowledge Hub
    "knowledge.view":    true,
    "knowledge.create":  true,
    "knowledge.edit":    true,
    "knowledge.delete":  true,
    // Marketplace
    "marketplace.view":  true,
    "marketplace.fork":  true,
    "marketplace.publish": false,  // platform publishing only
    "marketplace.manage":  false,
    // Vault
    "vault.view":        true,
    "vault.create":      true,
    "vault.delete":      true,
    // User Management
    "users.view":        true,
    "users.invite":      true,
    "users.edit":        true,
    "users.remove":      true,
    "users.assign_role": true,    // within org only
    // Usage & Analytics
    "usage.view":        true,
    "usage.export":      true,
    "pulse.view":        true,
    // Tenant Administration — can view own org; no platform-level management
    "tenants.view":      true,
    "tenants.create":    false,
    "tenants.edit":      false,
    "tenants.suspend":   false,
    "tenants.delete":    false,
    // Pricing
    "pricing.view":      false,
    "pricing.edit":      false,
    // Settings
    "settings.org":      true,
    "settings.billing":  true,    // own org billing
    "settings.integrations": true,
    "settings.audit_log":    true,
  },

  /* ── Tenant User ── execution-level access ──────────────────── */
  tenantuser: {
    // Agents — view & run; fork personal copies; cannot manage org agents
    "agents.view":       true,
    "agents.create":     false,
    "agents.edit":       false,
    "agents.delete":     false,
    "agents.publish":    false,
    "agents.fork":       true,
    "agents.run":        true,
    // Flows — run only; no authoring
    "flows.view":        true,
    "flows.create":      false,
    "flows.edit":        false,
    "flows.delete":      false,
    "flows.run":         true,
    // Knowledge Hub — read-only
    "knowledge.view":    true,
    "knowledge.create":  false,
    "knowledge.edit":    false,
    "knowledge.delete":  false,
    // Marketplace — browse and fork only
    "marketplace.view":  true,
    "marketplace.fork":  true,
    "marketplace.publish": false,
    "marketplace.manage":  false,
    // Vault — no access
    "vault.view":        false,
    "vault.create":      false,
    "vault.delete":      false,
    // User Management — no access
    "users.view":        false,
    "users.invite":      false,
    "users.edit":        false,
    "users.remove":      false,
    "users.assign_role": false,
    // Usage & Analytics — no access
    "usage.view":        false,
    "usage.export":      false,
    "pulse.view":        false,
    // Tenant Administration
    "tenants.view":      false,
    "tenants.create":    false,
    "tenants.edit":      false,
    "tenants.suspend":   false,
    "tenants.delete":    false,
    // Pricing
    "pricing.view":      false,
    "pricing.edit":      false,
    // Settings
    "settings.org":      false,
    "settings.billing":  false,
    "settings.integrations": false,
    "settings.audit_log":    false,
  },
};

/**
 * Scope context shown in the sidebar for each role.
 * label   — short display text
 * sublabel — secondary context (org name, scope description)
 * color   — tailwind color key used for the accent
 */
export const ROLE_SCOPE = {
  superadmin:  { label: "Platform Admin", sublabel: "All organizations",    color: "violet" },
  tenantadmin: { label: "Org Admin",       sublabel: "Meridian Financial",   color: "blue"   },
  tenantuser:  { label: "Member",          sublabel: "Meridian Financial",   color: "slate"  },
};

/** Dot colors matching roleBadgeStyles in Sidebar */
export const SCOPE_COLORS = {
  violet: { bg: "#ede9fe", border: "#c4b5fd", text: "#6d28d9", dot: "#7c3aed" },
  blue:   { bg: "#dbeafe", border: "#93c5fd", text: "#1d4ed8", dot: "#2563eb" },
  slate:  { bg: "#f1f5f9", border: "#cbd5e1", text: "#475569", dot: "#64748b" },
};
