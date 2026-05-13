import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AlertTriangle, BarChart3, Building2, Check,
  ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Clock, Command,
  Copy, CreditCard, FileDown, GitBranch, Globe2,
  LayoutDashboard, LineChart, Lock, Network,
  Pencil, Receipt, Search, Server, Settings2, ShieldCheck,
  UserPlus, Users, X, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { MembersDirectory } from "@/components/members/MembersDirectory";
import OrganisationUsageSection from "@/components/pages/OrganisationUsageSection";
import { cn } from "@/lib/utils";
import {
  TENANT_AUDIT_LOG, TENANT_DOMAINS, TENANT_USERS, INVOICES,
  DEPLOY_CFG, STATUS_CFG, PLAN_CFG, INV_STATUS_CFG,
} from "@/data/adminData";
import { PERMISSIONS } from "@/config/rbac";

const AVATAR_GRAD = [
  ["#1e3a8a", "#2563eb"], ["#0f766e", "#14b8a6"], ["#7c2d12", "#ea580c"],
  ["#581c87", "#a855f7"], ["#0c4a6e", "#0284c7"],
];

function initials(name) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function avatarIdx(id) {
  return [...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_GRAD.length;
}

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, perm: () => true },
  { id: "usage",    label: "Usage",    icon: BarChart3,        perm: (p) => p["usage.view"] },
  { id: "members",  label: "Members",  icon: Users,            perm: (p) => p["users.view"] },
  { id: "domains",  label: "Domains",  icon: Globe2,           perm: () => true },
  { id: "audit",    label: "Audit Log",icon: ClipboardList,    perm: (p) => p["settings.audit_log"] },
  { id: "settings", label: "Settings", icon: Settings2,        perm: (p) => p["settings.org"] },
];

/** Human-readable relative timestamp: "Just now", "3m ago", "2 hrs ago", "Yesterday", "4 Jun 2025" */
function formatRelativeTime(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? "1 hr ago" : `${hrs} hrs ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function buildActivityFeed(tenant) {
  const now = Date.now();
  const base = [
    {
      id: "1",
      feedVariant: "check",
      actor: tenant.contactName ?? "Admin",
      actorEmail: tenant.contactEmail,
      verb: `added ${Math.min(24, (tenant.usage?.memberCount ?? 0) % 20 + 4)} users`,
      tone: "ok",
      ts: now - 120000,
      detail: "Bulk import from HRIS completed without conflicts.",
      category: "identity",
      tag: "Directory",
    },
    {
      id: "2",
      feedVariant: "target",
      subdued: true,
      actor: "System",
      actorEmail: "automation@aziron.com",
      verb: "AI token usage exceeded soft threshold",
      tone: "warn",
      ts: now - 900000,
      detail: "Organisation policy WS-TOK-14 triggered a notification to billing admins.",
      category: "attention",
      tag: "Billing",
    },
    {
      id: "3",
      feedVariant: "check",
      actor: "Sarah Chen",
      actorEmail: "s.chen@meridian.io",
      verb: "updated security policy",
      tone: "ok",
      ts: now - 3600000,
      detail: "MFA grace period reduced from 14 days to 7 days.",
      category: "policy",
      tag: "Policy",
    },
    {
      id: "4",
      feedVariant: "check-double",
      actor: "Deploy Bot",
      actorEmail: "deploy@aziron.com",
      verb: "completed flow deployment",
      tone: "ok",
      ts: now - 7200000,
      detail: "Incident RCA flow v2.3 promoted to production.",
      category: "deploy",
      tag: "Deploy",
    },
    {
      id: "5",
      feedVariant: "building",
      actor: "Domain Service",
      actorEmail: "noreply@aziron.com",
      verb: "verified new domain",
      tone: "ok",
      ts: now - 86400000,
      detail: `${tenant.domain} ownership confirmed via DNS TXT.`,
      category: "identity",
      tag: "Domains",
    },
  ];
  return base;
}

function StickyOrganisationHeader({
  tenant,
  planCfg,
  statusCfg,
  canEditTenant,
  onEditSettings,
  onGoToMembers,
}) {
  const qi = avatarIdx(tenant.id);

  // Inline name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(tenant.name);
  const nameInputRef = useRef(null);

  // Copy states
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Status dropdown
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(tenant.status);
  const statusDropRef = useRef(null);

  // Quick actions dropdown
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef(null);
  useEffect(() => {
    if (!actionsOpen) return;
    const handler = (e) => {
      if (!actionsRef.current?.contains(e.target)) setActionsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [actionsOpen]);

  // Sync when tenant changes
  useEffect(() => {
    setNameValue(tenant.name);
    setCurrentStatus(tenant.status);
    setEditingName(false);
  }, [tenant.id]);

  const currentStatusCfg = STATUS_CFG[currentStatus] ?? statusCfg;

  // Tenant ID display
  const tenantIdFull = String(tenant.id);
  const tenantIdDisplay = tenantIdFull.length > 8 ? `${tenantIdFull.slice(0, 8)}…` : `#${tenantIdFull}`;

  // Created date
  const createdDate = tenant.createdAt
    ? new Date(tenant.createdAt.includes("T") ? tenant.createdAt : `${tenant.createdAt}T12:00:00`)
        .toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "—";

  const startEdit = () => {
    if (!canEditTenant) return;
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };
  const commitName = () => setEditingName(false);
  const cancelEdit = () => { setNameValue(tenant.name); setEditingName(false); };

  const copySlug = () => {
    navigator.clipboard?.writeText(tenant.slug);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 1600);
  };
  const copyId = () => {
    navigator.clipboard?.writeText(tenantIdFull);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1600);
  };

  // Close status dropdown on outside click
  useEffect(() => {
    if (!statusDropOpen) return;
    const handler = (e) => {
      if (!statusDropRef.current?.contains(e.target)) setStatusDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusDropOpen]);

  return (
    <header
      className={cn(
        "relative z-30 shrink-0 border-b border-border/70 bg-card/95 backdrop-blur-md",
        "dark:border-border/80 dark:bg-background/98",
      )}
    >
      {/* Subtle plan-tinted radial glow */}
      {planCfg && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
          style={{ background: `radial-gradient(ellipse 50% 130% at 0% 50%, ${planCfg.color}, transparent)` }}
          aria-hidden
        />
      )}

      <div className="relative mx-auto max-w-[1728px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

          {/* Left: avatar + identity */}
          <div className="flex min-w-0 items-start gap-4">
            {/* Hero avatar */}
            <div
              className="mt-0.5 flex size-14 shrink-0 items-center justify-center rounded-2xl text-sm font-bold tracking-tight text-white shadow-md ring-1 ring-black/10 dark:ring-white/10"
              style={{ background: `linear-gradient(145deg,${AVATAR_GRAD[qi][0]},${AVATAR_GRAD[qi][1]})` }}
              aria-hidden
            >
              {initials(nameValue)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Organisation
              </p>

              {/* Inline-editable name */}
              <div className="mt-0.5 flex items-center">
                {editingName ? (
                  <input
                    ref={nameInputRef}
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onBlur={commitName}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitName();
                      if (e.key === "Escape") cancelEdit();
                    }}
                    className="min-w-0 flex-1 border-b-2 border-primary bg-transparent text-xl font-semibold tracking-tight text-foreground outline-none sm:text-2xl"
                    aria-label="Edit organisation name"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={canEditTenant ? startEdit : undefined}
                    tabIndex={canEditTenant ? 0 : -1}
                    className={cn(
                      "group flex items-center gap-1.5 text-left text-xl font-semibold tracking-tight text-foreground sm:text-2xl",
                      canEditTenant
                        ? "cursor-pointer rounded hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        : "cursor-default",
                    )}
                    aria-label={canEditTenant ? `Edit name: ${nameValue}` : nameValue}
                  >
                    {nameValue}
                    {canEditTenant && (
                      <Pencil
                        className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-40"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    )}
                  </button>
                )}
              </div>

              {/* Primary row: status + plan + upgrade */}
              <div className="mt-2 flex flex-wrap items-center gap-2">

                {/* Status badge — dropdown for admins */}
                <div ref={statusDropRef} className="relative">
                  <button
                    type="button"
                    onClick={canEditTenant ? () => setStatusDropOpen((v) => !v) : undefined}
                    aria-label={canEditTenant ? `Status: ${currentStatusCfg.label}. Click to change` : `Status: ${currentStatusCfg.label}`}
                    aria-haspopup={canEditTenant ? "listbox" : undefined}
                    aria-expanded={canEditTenant ? statusDropOpen : undefined}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                      canEditTenant ? "cursor-pointer transition-opacity hover:opacity-75" : "cursor-default",
                    )}
                    style={{
                      borderColor: `${currentStatusCfg.dot}55`,
                      color: currentStatusCfg.text,
                      background: currentStatusCfg.bg ?? "transparent",
                    }}
                  >
                    <span className="size-1.5 shrink-0 rounded-full" style={{ background: currentStatusCfg.dot }} aria-hidden />
                    {currentStatusCfg.label}
                    {canEditTenant && <ChevronDown className="size-3 shrink-0 opacity-50" aria-hidden />}
                  </button>

                  {statusDropOpen && canEditTenant && (
                    <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[11rem] overflow-hidden rounded-xl border border-border bg-card shadow-xl ring-1 ring-black/5 dark:border-border dark:bg-card dark:ring-white/5">
                      <ul role="listbox" aria-label="Change tenant status" className="py-1">
                        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                          <li key={key}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={currentStatus === key}
                              onClick={() => { setCurrentStatus(key); setStatusDropOpen(false); }}
                              className={cn(
                                "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                                currentStatus === key && "bg-muted/60 font-medium",
                              )}
                            >
                              <span className="size-2 shrink-0 rounded-full" style={{ background: cfg.dot }} aria-hidden />
                              {cfg.label}
                              {currentStatus === key && <Check className="ml-auto size-3.5 text-primary" aria-hidden />}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Plan badge */}
                {planCfg && (
                  <span
                    className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ background: planCfg.bg, color: planCfg.text }}
                  >
                    {planCfg.label}
                  </span>
                )}

                {/* Upgrade — outlined button, clearly distinct from badges */}
                {canEditTenant && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary transition-colors hover:border-primary/70 hover:bg-primary/10"
                    aria-label="Upgrade plan"
                  >
                    ↑ Upgrade
                  </button>
                )}
              </div>

              {/* Secondary row: reference info — muted, smaller */}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">

                {/* Slug — copyable */}
                <button
                  type="button"
                  onClick={copySlug}
                  className="group inline-flex items-center gap-1 rounded font-mono text-[11px] text-muted-foreground/70 transition-colors hover:text-foreground"
                  aria-label={copiedSlug ? "Slug copied" : `Copy slug: ${tenant.slug}`}
                >
                  @{tenant.slug}
                  {copiedSlug
                    ? <Check className="size-3 shrink-0 text-success" aria-hidden />
                    : <Copy className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-50" aria-hidden />
                  }
                </button>

                <span className="text-[10px] text-muted-foreground/30" aria-hidden>·</span>

                {/* Tenant ID — copyable */}
                <button
                  type="button"
                  onClick={copyId}
                  className="group inline-flex items-center gap-1 rounded font-mono text-[11px] text-muted-foreground/70 transition-colors hover:text-foreground"
                  aria-label={copiedId ? "ID copied" : `Copy tenant ID: ${tenantIdFull}`}
                >
                  #{tenantIdFull}
                  {copiedId
                    ? <Check className="size-3 shrink-0 text-success" aria-hidden />
                    : <Copy className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-50" aria-hidden />
                  }
                </button>

                <span className="text-[10px] text-muted-foreground/30" aria-hidden>·</span>

                {/* Created date — demoted to reference info */}
                <span className="text-[11px] text-muted-foreground/60">
                  Created{" "}
                  <time dateTime={tenant.createdAt} className="tabular-nums">
                    {createdDate}
                  </time>
                </span>
              </div>
            </div>
          </div>

          {/* Right: admin actions */}
          {canEditTenant && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {/* Quick Actions dropdown */}
              <div ref={actionsRef} className="relative">
                <button
                  type="button"
                  onClick={() => setActionsOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={actionsOpen}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                >
                  <Zap className="size-3.5" aria-hidden />
                  Actions
                  <ChevronDown className="size-3 opacity-70" aria-hidden />
                </button>
                {actionsOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-xl ring-1 ring-black/5 dark:border-border dark:bg-card dark:ring-white/5">
                    <ul role="menu" className="py-1">
                      {[
                        { icon: UserPlus,  label: "Invite Member",   action: () => { onGoToMembers?.(); setActionsOpen(false); } },
                        { icon: Receipt,   label: "View Billing",     action: () => { setActionsOpen(false); } },
                        { icon: FileDown,  label: "Export Report",    action: () => { setActionsOpen(false); } },
                        { icon: Settings2, label: "Edit Settings",    action: () => { onEditSettings?.(); setActionsOpen(false); } },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <li key={item.label} role="none">
                            <button
                              type="button"
                              role="menuitem"
                              onClick={item.action}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                            >
                              <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                              {item.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function OrganisationNav({
  items,
  activeId,
  onSelect,
  navRef,
  navBadges = {},
}) {
  const onKeyDown = (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const ids = items.map((i) => i.id);
    const ix = ids.indexOf(activeId);
    const next = e.key === "ArrowDown" ? Math.min(ids.length - 1, ix + 1) : Math.max(0, ix - 1);
    onSelect(ids[next]);
    const el = navRef.current?.querySelector?.(`[data-nav-id="${ids[next]}"]`);
    el?.focus?.();
  };

  return (
    <nav
      ref={navRef}
      className="flex w-full flex-col border-b border-border bg-card/90 p-2 backdrop-blur-sm dark:border-border dark:bg-background/95 lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-r lg:p-3"
      aria-label="Organisation"
      onKeyDown={onKeyDown}
    >
      <p className="mb-2 hidden px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground lg:block">
        Organisation
      </p>
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible" role="list">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeId === item.id;
          const badge = navBadges[item.id];
          return (
            <li key={item.id} className="shrink-0 lg:w-full">
              <button
                type="button"
                data-nav-id={item.id}
                role="tab"
                aria-selected={active}
                tabIndex={0}
                onClick={() => onSelect(item.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring/50",
                  active
                    ? "border-l-2 border-primary bg-primary/10 font-medium text-primary dark:border-primary dark:bg-primary/15 dark:text-primary"
                    : "border-l-2 border-transparent text-muted-foreground hover:bg-muted dark:hover:bg-muted",
                )}
              >
                <Icon className="size-4 shrink-0 opacity-80" strokeWidth={1.75} aria-hidden />
                <span className="min-w-0 flex-1 whitespace-nowrap">{item.label}</span>
                {badge != null && badge > 0 && (
                  <span className={cn(
                    "ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    active
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}>
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ActivityFeed({ tenant, className, onViewAll }) {
  const items = useMemo(() => buildActivityFeed(tenant), [tenant]);

  return (
    <section aria-labelledby="activity-heading" className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="size-3.5 text-muted-foreground" aria-hidden />
          <h2 id="activity-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recent Activity
          </h2>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="shrink-0 text-[11px] font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View all →
          </button>
        )}
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        {items.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <div className="flex flex-col gap-0">
            {items.map((ev, i) => {
              const label = `${ev.actor} ${ev.verb}${ev.tag ? ` · ${ev.tag}` : ""}`;
              const iso = new Date(ev.ts).toISOString();
              return (
                <div key={ev.id} className="relative flex items-start gap-3 pb-3 last:pb-0">
                  <div className="relative flex flex-col items-center">
                    <div className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />
                    {i < items.length - 1 && (
                      <div className="mt-1 w-px flex-1 bg-border" style={{ minHeight: "16px" }} aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground">{label}</p>
                    <time
                      dateTime={iso}
                      title={new Date(ev.ts).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
                      className="text-[11px] text-muted-foreground"
                    >
                      {formatRelativeTime(ev.ts)}
                    </time>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

const PLAN_FEATURES = {
  trial:        ["7-day audit log", "API access (read-only)"],
  standard:     ["30-day audit log", "API access", "Custom domains"],
  professional: ["90-day audit log", "API access", "Custom domains", "SSO (add-on)"],
  enterprise:   ["Unlimited audit log", "API access", "Custom domains", "SSO", "Priority support", "SLA guarantee"],
};

function BillingHealthPanel({ tenant, deployCfg, onNavigate, onGoToMembers, className }) {
  const seats = tenant.seats ?? tenant.usage?.memberCount ?? 0;
  const maxUsers = tenant.max_users;
  const seatPct = maxUsers ? Math.min(100, Math.round((seats / maxUsers) * 100)) : null;

  // Per-plan entitlement limits
  const ov = tenant.overrides ?? {};
  const agentLimit    = ov.agents    ?? (tenant.plan === "enterprise" ? 50 : tenant.plan === "professional" ? 25 : 10);
  const workflowLimit = ov.workflows ?? (tenant.plan === "enterprise" ? null : 50);
  const planFeatures  = PLAN_FEATURES[tenant.plan] ?? PLAN_FEATURES.standard;
  const licenseRef    = `LIC-${String(tenant.id).padStart(5, "0")}`;

  // Latest invoice for this tenant
  const latestInvoice = useMemo(() =>
    [...(INVOICES ?? [])].filter(i => i.tenantId === tenant.id)
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))[0]
  , [tenant.id]);

  const renewal = tenant.subscriptionRenewalDate
    ? new Date(`${tenant.subscriptionRenewalDate}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "—";

  const invCfg = latestInvoice ? INV_STATUS_CFG[latestInvoice.status] ?? INV_STATUS_CFG.pending : null;

  // Risk flags
  const risks = [
    !tenant.settings?.sso_enabled && { label: "SSO not enabled", level: "warn" },
    !tenant.settings?.mfa_required && { label: "MFA not enforced", level: "warn" },
    latestInvoice?.status === "overdue" && { label: "Invoice overdue", level: "danger" },
    seatPct != null && seatPct >= 90 && { label: `Seats at ${seatPct}% capacity`, level: "danger" },
  ].filter(Boolean);

  const complianceLabel = tenant.settings?.hipaa ? "HIPAA-ready · SOC2" : "SOC2 (inherited)";

  return (
    <aside aria-labelledby="billing-health-heading" className={cn("flex min-h-0 flex-col", className)}>
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
        <h2 id="billing-health-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Billing &amp; Health
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onNavigate?.("usage")}
        >
          Full report →
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-0.5">

        {/* Seat utilization */}
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3 dark:border-border/60 dark:bg-muted/10">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Seat usage</p>
            {maxUsers ? (
              <span className={cn(
                "text-[11px] font-semibold tabular-nums",
                seatPct >= 90 ? "text-destructive" : seatPct >= 75 ? "text-amber-600" : "text-foreground",
              )}>
                {seats} / {maxUsers.toLocaleString()} · {seatPct}%
              </span>
            ) : (
              <span className="text-[11px] font-medium text-muted-foreground">{seats} / Unlimited</span>
            )}
          </div>
          {maxUsers && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  seatPct >= 90 ? "bg-destructive" : seatPct >= 75 ? "bg-amber-500" : "bg-primary",
                )}
                style={{ width: `${seatPct}%` }}
              />
            </div>
          )}
          {seatPct != null && seatPct >= 85 && (
            <button
              type="button"
              onClick={onGoToMembers}
              className="mt-1.5 text-[11px] font-medium text-destructive underline-offset-2 hover:underline"
            >
              Manage members →
            </button>
          )}
        </div>

        {/* Billing snapshot */}
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3 dark:border-border/60 dark:bg-muted/10">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Billing</p>
          <div className="flex flex-col gap-1.5 text-[12px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Next renewal</span>
              <span className="font-medium text-foreground tabular-nums">{renewal}</span>
            </div>
            {latestInvoice && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Latest invoice</span>
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{ background: invCfg?.bg, color: invCfg?.text }}
                >
                  {invCfg?.label ?? latestInvoice.status} · ${latestInvoice.amount.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Entitlements */}
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3 dark:border-border/60 dark:bg-muted/10">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Entitlements</p>
            <span className="font-mono text-[10px] text-muted-foreground/50">{licenseRef}</span>
          </div>
          {/* Limits line */}
          <p className="mb-2.5 text-[11px] leading-relaxed text-foreground">
            {[
              maxUsers ? `${maxUsers.toLocaleString()} seats` : "Unlimited seats",
              `${agentLimit} agents`,
              workflowLimit ? `${workflowLimit} flows` : "Unlimited flows",
            ].join(" · ")}
          </p>
          {/* Feature chips */}
          <div className="flex flex-wrap gap-1">
            {planFeatures.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary dark:border-primary/20 dark:bg-primary/10"
              >
                <Check className="size-2.5 shrink-0" aria-hidden />
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Risk flags */}
        {risks.length > 0 && (
          <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Attention needed
            </p>
            <ul className="flex flex-col gap-1.5">
              {risks.map((r) => (
                <li key={r.label} className="flex items-center gap-2 text-[12px]">
                  <AlertTriangle
                    className={cn("size-3 shrink-0", r.level === "danger" ? "text-destructive" : "text-amber-500")}
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className={r.level === "danger" ? "font-medium text-destructive" : "text-amber-700 dark:text-amber-400"}>
                    {r.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Compliance & data plane */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Compliance</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
              <ShieldCheck className="size-3.5 shrink-0" strokeWidth={1.25} aria-hidden />
              {complianceLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/20 px-2.5 py-1 text-[11px] font-medium text-foreground dark:border-border">
              <Lock className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.25} aria-hidden />
              AES-256 · TLS 1.3
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/20 px-2.5 py-1 text-[11px] font-medium text-muted-foreground dark:border-border">
              <Server className="size-3.5 shrink-0" strokeWidth={1.25} aria-hidden />
              {deployCfg.label}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ResourceUsageOverview({ tenant, onNavigate }) {
  const u = tenant.usage ?? {};
  const ov = tenant.overrides ?? {};
  const domainCount = (TENANT_DOMAINS[tenant.id] ?? []).length || 1;
  const members = u.memberCount ?? 0;
  const maxUsers = tenant.max_users;

  // Derive per-plan limits (fallback to generous values for enterprise)
  const agentLimit = ov.agents ?? (tenant.plan === "enterprise" ? 50 : tenant.plan === "professional" ? 25 : 10);
  const workflowLimit = ov.workflows ?? (tenant.plan === "enterprise" ? null : 50);

  const cards = [
    {
      key: "agents",    label: "Agents",    value: u.agentCount ?? 0,
      limit: agentLimit, trend: "+3 this wk",  foot: "Execution plane", navId: "usage",
    },
    {
      key: "workflows", label: "Workflows", value: u.workflowCount ?? 0,
      limit: workflowLimit, trend: "+1 this wk", foot: "Published flows", navId: "usage",
    },
    {
      key: "vector",    label: "Vector DBs",value: u.vectorDbCount ?? 0,
      limit: null, trend: "Stable",    foot: "Retrieval stores", navId: "usage",
    },
    {
      key: "members",   label: "Members",   value: members,
      limit: maxUsers,
      trend: members > 120 ? "⚠ Elevated" : "+4 this wk",
      trendDanger: members > 120,
      foot: "Seated users",           navId: "members",
    },
    {
      key: "providers", label: "Providers", value: u.providerCount ?? 0,
      limit: null, trend: "Stable",    foot: "Model routes",   navId: "usage",
    },
    {
      key: "domains",   label: "Domains",   value: domainCount,
      limit: null, trend: "✓ Verified", foot: "Auth domains",  navId: "domains",
    },
  ];

  return (
    <section aria-labelledby="resource-usage-heading" className="col-span-12">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <h2 id="resource-usage-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Resource footprint
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Click any card to view details. Bars show quota usage.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((row) => {
          const pct = row.limit ? Math.min(100, Math.round((row.value / row.limit) * 100)) : null;
          const isAtRisk = pct != null && pct >= 85;
          return (
            <button
              key={row.key}
              type="button"
              onClick={() => onNavigate?.(row.navId)}
              className={cn(
                "group flex flex-col overflow-hidden rounded-2xl bg-card p-4 text-left shadow-sm",
                "transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                isAtRisk && "ring-1 ring-destructive/30",
                "dark:bg-card/90",
              )}
              aria-label={`${row.label}: ${row.value}${row.limit ? ` of ${row.limit}` : ""}. Go to ${row.navId}`}
            >
              <p className={cn(
                "font-mono text-2xl font-semibold tabular-nums tracking-tight",
                isAtRisk ? "text-destructive" : "text-foreground",
              )}>
                {(row.value ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {row.label}
              </p>

              {/* Quota bar */}
              {pct != null && (
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        pct >= 90 ? "bg-destructive" : pct >= 75 ? "bg-amber-500" : "bg-primary/60",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium tabular-nums",
                    pct >= 90 ? "text-destructive" : "text-muted-foreground",
                  )}>
                    {pct}%
                  </span>
                </div>
              )}

              <p className={cn(
                "mt-2 text-[11px] font-medium",
                row.trendDanger ? "text-amber-600" : "text-muted-foreground/90",
              )}>
                {row.trend}
              </p>
              <p className="mt-auto pt-2 text-[10px] text-muted-foreground group-hover:text-primary">
                {row.foot} →
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function OverviewInsightsBand({ tenant, deployCfg, onNavigate, onViewActivity, onGoToMembers }) {
  return (
    <div
      className={cn(
        "col-span-12 overflow-hidden rounded-[1.25rem] border border-border/70 bg-card shadow-sm",
        "dark:border-border dark:bg-card/80",
      )}
    >
      <div className="grid min-h-0 grid-cols-1 divide-y divide-border/70 lg:grid-cols-12 lg:divide-x lg:divide-y-0 dark:divide-border/80">
        <BillingHealthPanel
          tenant={tenant}
          deployCfg={deployCfg}
          onNavigate={onNavigate}
          onGoToMembers={onGoToMembers}
          className="min-h-0 p-5 sm:p-6 lg:col-span-3 lg:max-h-[min(72vh,56rem)]"
        />
        <ActivityFeed
          tenant={tenant}
          onViewAll={onViewActivity}
          className="min-h-0 p-5 sm:p-6 lg:col-span-9 lg:max-h-[min(72vh,56rem)]"
        />
      </div>
    </div>
  );
}

function DomainsSection({ tenant }) {
  const rows = TENANT_DOMAINS[tenant.id];
  const list =
    rows && rows.length > 0
      ? rows
      : [{ domain: tenant.domain, verified: true, addedAt: tenant.createdAt }];
  return (
    <section className="col-span-12" aria-labelledby="domains-heading">
      <h2 id="domains-heading" className="text-sm font-semibold text-foreground">
        Auth domains
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Verified domains control where users can sign in and receive organisation email.
      </p>
      <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card dark:divide-border dark:border-border dark:bg-card">
        {list.map((d, i) => (
          <li
            key={`${d.domain}-${i}`}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="font-mono text-sm text-foreground">{d.domain}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Added{" "}
                {d.addedAt
                  ? new Date(d.addedAt.includes("T") ? d.addedAt : `${d.addedAt}T12:00:00`).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })
                  : "—"}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                d.verified
                  ? "border border-success/30 bg-success/10 text-success"
                  : "border border-warning/40 bg-warning/15 text-warning dark:border-warning/45 dark:bg-warning/15 dark:text-amber-100",
              )}
            >
              {d.verified ? "Verified" : "Pending"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Audit log metadata ───────────────────────────────────────────────────────

const AUDIT_ACTION_META = {
  "tenant.created":   { label: "Tenant Created",   category: "platform",  severity: "info"    },
  "tenant.suspended": { label: "Tenant Suspended", category: "platform",  severity: "danger"  },
  "domain.added":     { label: "Domain Added",     category: "settings",  severity: "info"    },
  "domain.verified":  { label: "Domain Verified",  category: "settings",  severity: "success" },
  "user.invited":     { label: "User Invited",     category: "identity",  severity: "info"    },
  "user.removed":     { label: "User Removed",     category: "identity",  severity: "warning" },
  "role.changed":     { label: "Role Changed",     category: "identity",  severity: "info"    },
  "admin.granted":    { label: "Admin Granted",    category: "security",  severity: "warning" },
  "admin.revoked":    { label: "Admin Revoked",    category: "security",  severity: "warning" },
  "plan.changed":     { label: "Plan Changed",     category: "billing",   severity: "info"    },
  "invoice.paid":     { label: "Invoice Paid",     category: "billing",   severity: "success" },
  "mfa.enforced":     { label: "MFA Enforced",     category: "security",  severity: "info"    },
  "mfa.disabled":     { label: "MFA Disabled",     category: "security",  severity: "danger"  },
  "sso.enabled":      { label: "SSO Enabled",      category: "security",  severity: "info"    },
  "api_key.created":  { label: "API Key Created",  category: "security",  severity: "info"    },
  "api_key.revoked":  { label: "API Key Revoked",  category: "security",  severity: "warning" },
  "agent.deployed":   { label: "Agent Deployed",   category: "platform",  severity: "info"    },
  "flow.published":   { label: "Flow Published",   category: "platform",  severity: "info"    },
  "override.set":     { label: "Override Set",     category: "settings",  severity: "info"    },
  "login.failed":     { label: "Login Failed",     category: "security",  severity: "danger"  },
  "settings.updated": { label: "Settings Updated", category: "settings",  severity: "info"    },
  "data.exported":    { label: "Data Exported",    category: "security",  severity: "info"    },
};

const AUDIT_CATEGORY_META = {
  security: {
    label: "Security", icon: ShieldCheck,
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    avatar: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  identity: {
    label: "Identity", icon: Users,
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    avatar: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  billing: {
    label: "Billing", icon: CreditCard,
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    avatar: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  settings: {
    label: "Settings", icon: Settings2,
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300",
    avatar: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300",
    dot: "bg-slate-400",
  },
  platform: {
    label: "Platform", icon: Zap,
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    avatar: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
    dot: "bg-violet-500",
  },
};

function auditSeverityDot(severity) {
  if (severity === "danger")  return "bg-rose-500";
  if (severity === "warning") return "bg-amber-500";
  if (severity === "success") return "bg-emerald-500";
  return "bg-primary/40";
}

const AUDIT_PAGE_SIZE = 12;

function AuditSection({ tenant }) {
  const raw = useMemo(() => [...(TENANT_AUDIT_LOG[tenant.id] ?? [])].reverse(), [tenant.id]);

  const [search, setSearch]               = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterActor, setFilterActor]     = useState("all");
  const [expandedId, setExpandedId]       = useState(null);
  const [page, setPage]                   = useState(1);

  useEffect(() => { setPage(1); }, [search, filterCategory, filterActor]);
  useEffect(() => { setExpandedId(null); setSearch(""); setFilterCategory("all"); setFilterActor("all"); setPage(1); }, [tenant.id]);

  const now = Date.now();
  const thisMonthCount = raw.filter((e) => {
    const d = new Date(e.ts);
    const n = new Date(now);
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;
  const securityCount = raw.filter((e) => AUDIT_ACTION_META[e.action]?.category === "security").length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return raw.filter((e) => {
      const meta = AUDIT_ACTION_META[e.action] ?? {};
      if (filterCategory !== "all" && meta.category !== filterCategory) return false;
      if (filterActor === "system"  && e.actor !== "system")      return false;
      if (filterActor === "admin"   && e.actor !== "super-admin") return false;
      if (filterActor === "member"  && (e.actor === "system" || e.actor === "super-admin")) return false;
      if (q && !e.detail.toLowerCase().includes(q) && !e.actor.toLowerCase().includes(q) && !e.action.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [raw, search, filterCategory, filterActor]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / AUDIT_PAGE_SIZE));
  const safePage  = Math.min(page, pageCount);
  const pageRows  = filtered.slice((safePage - 1) * AUDIT_PAGE_SIZE, safePage * AUDIT_PAGE_SIZE);

  const hasFilters = search !== "" || filterCategory !== "all" || filterActor !== "all";
  const clearFilters = () => { setSearch(""); setFilterCategory("all"); setFilterActor("all"); };

  const handleExport = () => {
    const rows = [
      ["Timestamp", "Actor", "Action", "Category", "Detail"],
      ...raw.map((e) => {
        const meta = AUDIT_ACTION_META[e.action] ?? {};
        return [e.ts, e.actor, e.action, meta.category ?? "", `"${e.detail.replace(/"/g, '""')}"`];
      }),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `audit-${tenant.slug ?? tenant.id}-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
  };

  return (
    <div className="col-span-12 flex flex-col gap-5">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Audit Log</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Immutable record of all administrative and system events.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleExport}>
          <FileDown className="size-4" aria-hidden />
          Export CSV
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Events",     value: raw.length,     valueClass: "" },
          { label: "Security Events",  value: securityCount,  valueClass: securityCount > 0 ? "text-rose-600 dark:text-rose-400" : "" },
          { label: "This Month",       value: thisMonthCount, valueClass: "" },
        ].map(({ label, value, valueClass }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className={cn("mt-1 text-2xl font-semibold tabular-nums text-foreground", valueClass)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Main card */}
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          {/* Search */}
          <div className="relative min-w-[160px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events…"
              className="h-9 w-full rounded-md border border-border bg-transparent pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 dark:bg-transparent"
            />
          </div>

          {/* Category */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger size="sm" className={cn("w-[9.5rem]", filterCategory !== "all" && "border-primary/40 bg-primary/5 text-primary")}>
              <span className="truncate">
                {filterCategory === "all" ? "Category" : AUDIT_CATEGORY_META[filterCategory]?.label ?? filterCategory}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.entries(AUDIT_CATEGORY_META).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Actor */}
          <Select value={filterActor} onValueChange={setFilterActor}>
            <SelectTrigger size="sm" className={cn("w-[9rem]", filterActor !== "all" && "border-primary/40 bg-primary/5 text-primary")}>
              <span className="truncate">
                {filterActor === "all" ? "Actor" : filterActor === "system" ? "System" : filterActor === "admin" ? "Super Admin" : "Members"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actors</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="admin">Super Admin</SelectItem>
              <SelectItem value="member">Members</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 rounded text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              <X className="size-3" />Clear
            </button>
          )}

          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Active filter strip */}
        {hasFilters && (
          <div className="flex items-center gap-2 border-b border-border/60 bg-muted/20 px-4 py-1.5 dark:bg-muted/10">
            <p className="text-[11px] text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {raw.length} events
            </p>
          </div>
        )}

        {/* Timeline */}
        {pageRows.length === 0 ? (
          <div className="py-14 text-center">
            <ClipboardList className="mx-auto mb-3 size-9 text-muted-foreground/30" aria-hidden />
            <p className="text-sm font-medium text-foreground">No matching events</p>
            <p className="mt-1 text-xs text-muted-foreground">Try adjusting your filters or search.</p>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="mt-3 text-xs text-primary hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <ul>
            {pageRows.map((e, idx) => {
              const meta    = AUDIT_ACTION_META[e.action] ?? { label: e.action, category: "platform", severity: "info" };
              const catMeta = AUDIT_CATEGORY_META[meta.category] ?? AUDIT_CATEGORY_META.platform;
              const CatIcon = catMeta.icon;
              const isExpanded = expandedId === e.id;
              const isSystem = e.actor === "system";
              const isAdmin  = e.actor === "super-admin";
              const displayActor  = isSystem ? "System" : isAdmin ? "Super Admin" : e.actor;
              const actorInitials = isSystem ? "SY" : isAdmin ? "SA" : e.actor.split("@")[0].slice(0, 2).toUpperCase();

              return (
                <li key={e.id} className={cn("border-b border-border/50 last:border-0", isExpanded && "bg-meither")}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : e.id)}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/30"
                  >
                    {/* Severity dot + timeline line */}
                    <div className="relative flex flex-col items-center pt-1">
                      <div className={cn("size-2 rounded-full shrink-0 ring-2 ring-card", auditSeverityDot(meta.severity))} />
                      {idx < pageRows.length - 1 && (
                        <div className="mt-1.5 w-px flex-1 bg-border/50" style={{ minHeight: "20px" }} />
                      )}
                    </div>

                    {/* Actor avatar */}
                    <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", catMeta.avatar)}>
                      {actorInitials}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", catMeta.badge)}>
                          <CatIcon className="size-2.5" aria-hidden />
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{displayActor}</span>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-foreground">{e.detail}</p>
                    </div>

                    {/* Time + expand chevron */}
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {formatRelativeTime(new Date(e.ts).getTime())}
                      </span>
                      <ChevronDown className={cn("size-3.5 text-muted-foreground/40 transition-transform duration-150", isExpanded && "rotate-180")} />
                    </div>
                  </button>

                  {/* Expanded metadata */}
                  {isExpanded && (
                    <div className="border-t border-border/50 bg-muted/20 px-4 pb-4 pt-3 dark:bg-muted/10">
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-4">
                        <div>
                          <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Timestamp</dt>
                          <dd className="mt-1 font-mono text-[11px] text-foreground">{new Date(e.ts).toLocaleString()}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Actor</dt>
                          <dd className="mt-1 text-[11px] text-foreground">{displayActor}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Action Code</dt>
                          <dd className="mt-1 font-mono text-[11px] text-foreground">{e.action}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Category</dt>
                          <dd className="mt-1 capitalize text-[11px] text-foreground">{meta.category}</dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Pagination */}
        {filtered.length > AUDIT_PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>
              Showing {(safePage - 1) * AUDIT_PAGE_SIZE + 1}–{Math.min(safePage * AUDIT_PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1 px-2" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="size-4" aria-hidden />Prev
              </Button>
              <span className="px-2 tabular-nums">Page {safePage} / {pageCount}</span>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1 px-2" disabled={safePage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                Next<ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        )}

        {/* Footer note */}
        {filtered.length <= AUDIT_PAGE_SIZE && filtered.length > 0 && (
          <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}{hasFilters ? " (filtered)" : ""}
          </div>
        )}
      </section>
    </div>
  );
}

function SettingsSection({ tenant, onNavigate }) {
  return (
    <div className="col-span-12 max-w-2xl space-y-4">
      <p className="text-sm text-muted-foreground">
        Organisation defaults and integrations. Appearance is in your personal settings.
      </p>
      <Button variant="outline" onClick={() => onNavigate?.("settings")}>
        Open appearance & profile
      </Button>
      <pre className="rounded-xl border border-border bg-muted p-4 font-mono text-xs text-foreground overflow-x-auto dark:border-border">
        {JSON.stringify({ slug: tenant.slug, plan: tenant.plan, deployment: tenant.deployment }, null, 2)}
      </pre>
    </div>
  );
}

export default function OrganisationDashboardPage({
  tenant,
  onNavigate,
  canEditTenant,
  role,
  initialNavId,
}) {
  const navItems = useMemo(
    () => NAV.filter((n) => n.perm(PERMISSIONS[role] ?? PERMISSIONS.tenantuser)),
    [role],
  );
  const [active, setActive] = useState("overview");

  useEffect(() => {
    if (initialNavId && navItems.some((n) => n.id === initialNavId)) {
      setActive(initialNavId);
    } else {
      setActive(navItems[0]?.id ?? "overview");
    }
  }, [tenant?.id, initialNavId, navItems]);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [mobileNav, setMobileNav] = useState(false);
  const navRef = useRef(null);

  const firstNavId = navItems[0]?.id ?? "overview";
  const safeActive = navItems.some((n) => n.id === active) ? active : firstNavId;

  useEffect(() => {
    const t = setInterval(() => setLastUpdated(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const planCfg = PLAN_CFG[tenant.plan];
  const deployCfg = DEPLOY_CFG[tenant.deployment] ?? DEPLOY_CFG.saas;
  const statusCfg = STATUS_CFG[tenant.status] ?? STATUS_CFG.active;

  // Seat warning
  const seats = tenant.seats ?? tenant.usage?.memberCount ?? 0;
  const maxUsers = tenant.max_users;
  const seatPct = maxUsers ? Math.min(100, Math.round((seats / maxUsers) * 100)) : null;
  const showSeatWarning = seatPct != null && seatPct >= 85;

  // Nav count badges
  const navBadges = useMemo(() => ({
    members: (TENANT_USERS[tenant.id] ?? []).length || undefined,
    domains: (TENANT_DOMAINS[tenant.id] ?? []).length || 1,
    audit:   (TENANT_AUDIT_LOG[tenant.id] ?? []).length || undefined,
  }), [tenant.id]);

  const goToMembers = () => setActive("members");

  const mainContent = useMemo(() => {
    switch (safeActive) {
      case "overview":
        return (
          <>
            <ResourceUsageOverview tenant={tenant} onNavigate={setActive} />
            <OverviewInsightsBand
              tenant={tenant}
              deployCfg={deployCfg}
              onNavigate={onNavigate}
              onViewActivity={() => setActive("audit")}
              onGoToMembers={goToMembers}
            />
          </>
        );
      case "members":
        return <MembersDirectory tenant={tenant} variant="embedded" />;
      case "usage":
        return <OrganisationUsageSection tenant={tenant} onNavigate={setActive} />;
      case "domains":
        return <DomainsSection tenant={tenant} />;
      case "audit":
        return <AuditSection tenant={tenant} />;
      case "settings":
        return <SettingsSection tenant={tenant} onNavigate={onNavigate} />;
      default:
        return null;
    }
  }, [safeActive, tenant, deployCfg, onNavigate, setActive]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      {!canEditTenant && (
        <div
          className="shrink-0 border-b border-border bg-muted px-4 py-3 text-sm text-foreground"
          role="status"
        >
          <span className="font-semibold text-foreground">View-only organisation.</span>{" "}
          <span className="text-muted-foreground">
            Commercial and suspension controls are managed by Aziron platform operations.
          </span>
        </div>
      )}

      <StickyOrganisationHeader
        tenant={tenant}
        planCfg={planCfg}
        statusCfg={statusCfg}
        canEditTenant={canEditTenant}
        onEditSettings={() => setActive("settings")}
        onGoToMembers={goToMembers}
      />

      {/* Seat capacity warning band */}
      {showSeatWarning && (
        <div className="shrink-0 border-b border-amber-200/80 bg-amber-50/80 px-4 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/30">
          <div className="mx-auto flex max-w-[1728px] flex-wrap items-center justify-between gap-x-4 gap-y-1 sm:px-2">
            <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle className="size-4 shrink-0" strokeWidth={2} aria-hidden />
              <span>
                <span className="font-semibold">{seats} / {maxUsers} seats used ({seatPct}%)</span>
                {" "}— this organisation is near its seat limit.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToMembers}
                className="text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
              >
                Manage members
              </button>
              <span className="text-amber-400" aria-hidden>·</span>
              <button
                type="button"
                className="text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
              >
                Upgrade plan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        <div className="lg:hidden">
          <button
            type="button"
            className="flex w-full items-center justify-between border-b border-border bg-card px-4 py-2 text-sm font-medium text-foreground dark:border-border dark:bg-card dark:text-muted-foreground"
            aria-expanded={mobileNav}
            onClick={() => setMobileNav((v) => !v)}
          >
            Organisation menu
            <ChevronRight className={cn("size-4 transition-transform", mobileNav && "rotate-90")} />
          </button>
          {mobileNav && (
            <OrganisationNav items={navItems} activeId={safeActive} onSelect={(id) => { setActive(id); setMobileNav(false); }} navRef={navRef} navBadges={navBadges} />
          )}
        </div>

        <div className="hidden lg:flex">
          <OrganisationNav items={navItems} activeId={safeActive} onSelect={setActive} navRef={navRef} navBadges={navBadges} />
        </div>

        <main
          id="organisation-main"
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-8 lg:pb-6"
          role="main"
        >
          <div className="mx-auto max-w-[1728px] px-4 py-6 sm:px-6 lg:py-8">
            <div className="grid grid-cols-12 gap-5 lg:gap-6">
              {mainContent}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-card/95 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md dark:border-border dark:bg-background/95 lg:hidden">
        <Button variant="ghost" size="sm" className="flex-1 flex-col gap-0.5 h-auto py-2" onClick={() => onNavigate?.("new-chat")}>
          <LineChart className="size-4" />
          <span className="text-[10px]">Pulse</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 flex-col gap-0.5 h-auto py-2" onClick={() => onNavigate?.("tenant-users")}>
          <Users className="size-4" />
          <span className="text-[10px]">Members</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 flex-col gap-0.5 h-auto py-2" onClick={() => setCmdOpen(true)}>
          <Command className="size-4" />
          <span className="text-[10px]">Command</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 flex-col gap-0.5 h-auto py-2" onClick={() => setMobileNav(true)}>
          <LayoutDashboard className="size-4" />
          <span className="text-[10px]">Menu</span>
        </Button>
      </div>

      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen} title="Organisation command palette">
        <Command className="rounded-xl border-0">
          <CommandInput placeholder="Jump to module, run action…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Organisation">
              <CommandItem onSelect={() => { setCmdOpen(false); setActive("overview"); }}>
                <LayoutDashboard className="size-4" />
                Overview
                <CommandShortcut>⌘1</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => { setCmdOpen(false); setActive("usage"); }}>
                <BarChart3 className="size-4" />
                Usage
              </CommandItem>
              <CommandItem onSelect={() => { setCmdOpen(false); setActive("members"); }}>
                <Users className="size-4" />
                Members
              </CommandItem>
              <CommandItem onSelect={() => { setCmdOpen(false); setActive("domains"); }}>
                <Globe2 className="size-4" />
                Domains
              </CommandItem>
              <CommandItem onSelect={() => { setCmdOpen(false); setActive("audit"); }}>
                <ClipboardList className="size-4" />
                Audit Log
              </CommandItem>
              <CommandItem onSelect={() => { setCmdOpen(false); setActive("settings"); }}>
                <Settings2 className="size-4" />
                Settings
              </CommandItem>
              <CommandItem onSelect={() => { setCmdOpen(false); onNavigate?.("usage"); }}>
                <LineChart className="size-4" />
                Open platform usage report
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

    </div>
  );
}

