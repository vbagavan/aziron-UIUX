// ─── Package Catalog ──────────────────────────────────────────────────────────
// Each package is either a 'base_tier' (one per tenant) or an 'addon' (stackable).
export const PACKAGES = {

  // ── SaaS base tiers ─────────────────────────────────────────────────────────
  "saas-lite": {
    id: "saas-lite", name: "SaaS Lite", type: "base_tier", deployment: "saas",
    priceModel: "per_seat", basePrice: 15, tokenRatePerM: 5.00,
    seatRange: "Up to 100 users",
    limits: { agents: 5, workflows: 2, concurrentFlows: 5, flowExecPerMonth: 5000, knowledgeHubGB: 5 },
    features: { hipaa: false, sso: true, auditLogs: false, dedicatedInfra: false, advancedAnalytics: false },
    support: "Email", uptime: "99.9%",
    description: "Perfect for small teams getting started with AI automation.",
    color: "#475569", gradient: "from-[#475569] to-[#334155]",
  },
  "saas-growth": {
    id: "saas-growth", name: "SaaS Growth", type: "base_tier", deployment: "saas",
    priceModel: "per_seat", basePrice: 12, tokenRatePerM: 3.00,
    seatRange: "101–500 users", recommended: true,
    limits: { agents: 10, workflows: 10, concurrentFlows: 20, flowExecPerMonth: 50000, knowledgeHubGB: 50 },
    features: { hipaa: false, sso: true, auditLogs: true, dedicatedInfra: false, advancedAnalytics: false },
    support: "Priority", uptime: "99.9%",
    description: "For growing teams that need more power and flexibility.",
    color: "#2563eb", gradient: "from-[#1d4ed8] to-[#2563eb]",
  },
  "saas-scale": {
    id: "saas-scale", name: "SaaS Scale", type: "base_tier", deployment: "saas",
    priceModel: "per_seat", basePrice: 10, tokenRatePerM: 2.00,
    seatRange: "500+ users",
    limits: { agents: 50, workflows: 50, concurrentFlows: 100, flowExecPerMonth: null, knowledgeHubGB: 500 },
    features: { hipaa: true, sso: true, auditLogs: true, dedicatedInfra: true, advancedAnalytics: false },
    support: "Dedicated", uptime: "99.9%",
    description: "Enterprise-grade platform for large-scale deployments.",
    color: "#7c3aed", gradient: "from-[#6d28d9] to-[#7c3aed]",
  },

  // ── Add-on packages ──────────────────────────────────────────────────────────
  "addon-hipaa": {
    id: "addon-hipaa", name: "HIPAA Compliance", type: "addon", deployment: "saas",
    priceModel: "fixed_monthly", basePrice: 500,
    features: { hipaa: true },
    limitBoosts: {},
    description: "BAA agreement, HIPAA-compliant data handling, and audit controls.",
    tagline: "+$500/mo",
    color: "#059669", iconKey: "shield",
  },
  "addon-sso-audit": {
    id: "addon-sso-audit", name: "SSO & Audit Logs", type: "addon", deployment: "saas",
    priceModel: "fixed_monthly", basePrice: 150,
    features: { sso: true, auditLogs: true },
    limitBoosts: {},
    description: "SAML/OIDC single sign-on and full activity audit trail.",
    tagline: "+$150/mo",
    color: "#7c3aed", iconKey: "key",
  },
  "addon-analytics": {
    id: "addon-analytics", name: "Advanced Analytics", type: "addon", deployment: "saas",
    priceModel: "fixed_monthly", basePrice: 200,
    features: { advancedAnalytics: true },
    limitBoosts: {},
    description: "Deep usage reports, custom dashboards, and CSV/API data exports.",
    tagline: "+$200/mo",
    color: "#2563eb", iconKey: "trending-up",
  },
  "addon-storage-100gb": {
    id: "addon-storage-100gb", name: "Storage Expansion", type: "addon", deployment: "saas",
    priceModel: "per_unit", basePrice: 50, unitLabel: "+100 GB",
    features: {},
    limitBoosts: { knowledgeHubGB: 100 },
    description: "Expand Knowledge Hub by 100 GB per unit purchased.",
    tagline: "+$50/mo per 100 GB",
    color: "#f59e0b", iconKey: "hard-drive",
  },
  "addon-agents-10": {
    id: "addon-agents-10", name: "Agent Expansion", type: "addon", deployment: "saas",
    priceModel: "per_unit", basePrice: 100, unitLabel: "+10 agents",
    features: {},
    limitBoosts: { agents: 10 },
    description: "Add 10 additional agents to your tenant per unit.",
    tagline: "+$100/mo per 10 agents",
    color: "#0ea5e9", iconKey: "sparkles",
  },
  "addon-support-priority": {
    id: "addon-support-priority", name: "Priority Support Upgrade", type: "addon", deployment: "saas",
    priceModel: "fixed_monthly", basePrice: 300,
    features: {},
    limitBoosts: {},
    description: "Upgrades Lite tier to Priority support with 4-hour response SLA.",
    tagline: "+$300/mo",
    color: "#ec4899", iconKey: "headphones",
  },
};

// ─── Tenant-Package Assignments (sample data) ─────────────────────────────────
export const TENANT_PACKAGES = [
  // Meridian Financial (id: 1) — SaaS Scale + Analytics + Storage ×3
  { id: "tp-1-1", tenantId: 1, packageId: "saas-scale",         seats: 620, quantity: 1, status: "active",    billingStart: "2024-03-15", overrides: {} },
  { id: "tp-1-2", tenantId: 1, packageId: "addon-analytics",               quantity: 1, status: "active",    billingStart: "2024-05-01" },
  { id: "tp-1-3", tenantId: 1, packageId: "addon-storage-100gb",           quantity: 3, status: "active",    billingStart: "2024-05-01" },

  // Nexus Health Systems (id: 2) — SaaS Scale + HIPAA + Analytics
  { id: "tp-2-1", tenantId: 2, packageId: "saas-scale",         seats: 350, quantity: 1, status: "active",    billingStart: "2024-02-01", overrides: {} },
  { id: "tp-2-2", tenantId: 2, packageId: "addon-hipaa",                   quantity: 1, status: "active",    billingStart: "2024-02-01" },
  { id: "tp-2-3", tenantId: 2, packageId: "addon-analytics",               quantity: 1, status: "active",    billingStart: "2024-03-01" },

  // Vanta Logistics (id: 3) — SaaS Growth + Agent Expansion ×1
  { id: "tp-3-1", tenantId: 3, packageId: "saas-growth",        seats: 245, quantity: 1, status: "active",    billingStart: "2024-06-22", overrides: { agents: 15 } },
  { id: "tp-3-2", tenantId: 3, packageId: "addon-agents-10",               quantity: 1, status: "active",    billingStart: "2024-08-01" },

  // Orion EdTech (id: 4) — SaaS Lite
  { id: "tp-4-1", tenantId: 4, packageId: "saas-lite",          seats: 88,  quantity: 1, status: "active",    billingStart: "2024-09-10", overrides: {} },

  // Apex Manufacturing (id: 5) — SaaS Growth + HIPAA
  { id: "tp-5-1", tenantId: 5, packageId: "saas-growth",        seats: 200, quantity: 1, status: "active",    billingStart: "2024-06-15", overrides: {} },
  { id: "tp-5-2", tenantId: 5, packageId: "addon-hipaa",                   quantity: 1, status: "active",    billingStart: "2024-06-15" },

  // Brightline Retail (id: 6) — SaaS Growth + Analytics
  { id: "tp-6-1", tenantId: 6, packageId: "saas-growth",        seats: 182, quantity: 1, status: "active",    billingStart: "2024-07-14", overrides: { flowExecPerMonth: 80000 } },
  { id: "tp-6-2", tenantId: 6, packageId: "addon-analytics",               quantity: 1, status: "active",    billingStart: "2024-09-01" },

  // Strategos Consulting (id: 7) — SaaS Lite (trial)
  { id: "tp-7-1", tenantId: 7, packageId: "saas-lite",          seats: 42,  quantity: 1, status: "trial",     billingStart: "2025-03-01", overrides: {} },

  // Cobalt Insurance (id: 8) — SaaS Scale + HIPAA + SSO & Audit + Storage ×3
  { id: "tp-8-1", tenantId: 8, packageId: "saas-scale",         seats: 510, quantity: 1, status: "active",    billingStart: "2023-11-20", overrides: { knowledgeHubGB: 800 } },
  { id: "tp-8-2", tenantId: 8, packageId: "addon-hipaa",                   quantity: 1, status: "active",    billingStart: "2023-11-20" },
  { id: "tp-8-3", tenantId: 8, packageId: "addon-sso-audit",               quantity: 1, status: "active",    billingStart: "2023-12-01" },
  { id: "tp-8-4", tenantId: 8, packageId: "addon-storage-100gb",           quantity: 3, status: "active",    billingStart: "2024-01-01" },

  // Zenith Pharma (id: 9) — SaaS Lite + HIPAA
  { id: "tp-9-1", tenantId: 9, packageId: "saas-lite",          seats: 150, quantity: 1, status: "active",    billingStart: "2024-11-01", overrides: {} },
  { id: "tp-9-2", tenantId: 9, packageId: "addon-hipaa",                   quantity: 1, status: "active",    billingStart: "2024-11-01" },

  // Pulsar Media (id: 10) — SaaS Growth (cancelled/suspended)
  { id: "tp-10-1", tenantId: 10, packageId: "saas-growth",      seats: 130, quantity: 1, status: "cancelled", billingStart: "2024-04-18", overrides: {} },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** All package assignments for a tenant */
export function getTenantPackages(tenantId) {
  return TENANT_PACKAGES.filter(tp => tp.tenantId === tenantId);
}

/** Active base-tier assignment + its package definition */
export function getBaseTierPackage(tenantId) {
  const active = TENANT_PACKAGES.find(
    tp => tp.tenantId === tenantId &&
          PACKAGES[tp.packageId]?.type === "base_tier" &&
          ["active", "trial"].includes(tp.status)
  );
  if (!active) return null;
  return { assignment: active, pkg: PACKAGES[active.packageId] };
}

/** Active add-on assignments + their package definitions */
export function getAddonPackages(tenantId) {
  return TENANT_PACKAGES
    .filter(tp =>
      tp.tenantId === tenantId &&
      PACKAGES[tp.packageId]?.type === "addon" &&
      ["active", "trial"].includes(tp.status)
    )
    .map(tp => ({ assignment: tp, pkg: PACKAGES[tp.packageId] }));
}

/** Compute effective limits and feature flags from all active packages */
export function getEntitlements(tenantId) {
  const active = TENANT_PACKAGES.filter(
    tp => tp.tenantId === tenantId && ["active", "trial"].includes(tp.status)
  );
  let limits = {};
  let features = {};

  for (const tp of active) {
    const pkg = PACKAGES[tp.packageId];
    if (!pkg) continue;
    if (pkg.type === "base_tier") {
      limits = { ...pkg.limits, ...(tp.overrides || {}) };
      features = { ...features, ...pkg.features };
    } else if (pkg.type === "addon") {
      features = { ...features, ...pkg.features };
      for (const [key, boost] of Object.entries(pkg.limitBoosts || {})) {
        limits[key] = (limits[key] ?? 0) + boost * (tp.quantity || 1);
      }
    }
  }
  return { limits, features };
}

/** Monthly recurring revenue from all active package assignments */
export function computePackageMRR(tenantId, tokensConsumed = 0) {
  const active = TENANT_PACKAGES.filter(
    tp => tp.tenantId === tenantId && tp.status === "active"
  );
  let mrr = 0;
  let tokenRate = 0;

  for (const tp of active) {
    const pkg = PACKAGES[tp.packageId];
    if (!pkg) continue;
    if (pkg.priceModel === "per_seat")      mrr += (tp.seats ?? 0) * pkg.basePrice;
    else if (pkg.priceModel === "fixed_monthly") mrr += pkg.basePrice;
    else if (pkg.priceModel === "per_unit") mrr += (tp.quantity ?? 1) * pkg.basePrice;
    if (pkg.tokenRatePerM) tokenRate = pkg.tokenRatePerM;
  }
  mrr += tokensConsumed * tokenRate;
  return mrr;
}

/** pkg status badge config */
export const PKG_STATUS_CFG = {
  active:    { bg: "#dcfce7", text: "#16a34a", label: "Active"    },
  trial:     { bg: "#fef9c3", text: "#ca8a04", label: "Trial"     },
  cancelled: { bg: "#fee2e2", text: "#dc2626", label: "Cancelled" },
  scheduled: { bg: "#eff6ff", text: "#2563eb", label: "Scheduled" },
};
