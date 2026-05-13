import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AlertTriangle, BarChart3, Bell, Bot, Building2,
  CheckCircle2, ChevronRight, ClipboardList, Clock, Command,
  Copy, CreditCard, ExternalLink, GitBranch, Globe2,
  LayoutDashboard, LineChart, Lock, Network, Radar,
  Server, Settings2, Shield, ShieldCheck, Sparkles,
  UserPlus, Users, PanelRightClose, PanelRightOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import {
  INVOICES, TENANT_AUDIT_LOG, TENANT_DOMAINS,
  DEPLOY_CFG, STATUS_CFG, PLAN_CFG,
} from "@/data/adminData";
import { PERMISSIONS } from "@/config/rbac";
import { getBaseTierPackage } from "@/data/packagesData";

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
  { id: "members", label: "Members", icon: Users, perm: (p) => p["users.view"] },
  { id: "operations", label: "Operations", icon: Server, perm: () => true },
  { id: "usage", label: "Usage & Costs", icon: BarChart3, perm: (p) => p["usage.view"] },
  { id: "security", label: "Security", icon: Shield, perm: () => true },
  { id: "governance", label: "AI Governance", icon: Radar, perm: () => true },
  { id: "billing", label: "Billing", icon: CreditCard, perm: (p) => p["settings.billing"] },
  { id: "audit", label: "Audit Logs", icon: ClipboardList, perm: (p) => p["settings.audit_log"] },
  { id: "settings", label: "Settings", icon: Settings2, perm: (p) => p["settings.org"] },
];

function buildActivityFeed(tenant) {
  const now = Date.now();
  const base = [
    { id: "1", actor: tenant.contactName ?? "Admin", actorEmail: tenant.contactEmail, verb: `added ${Math.min(24, (tenant.usage?.memberCount ?? 0) % 20 + 4)} users`, tone: "ok", ts: now - 120000, detail: "Bulk import from HRIS completed without conflicts.", category: "identity", tag: "Directory" },
    { id: "2", actor: "System", actorEmail: "automation@aziron.com", verb: "AI token usage exceeded soft threshold", tone: "warn", ts: now - 900000, detail: "Workspace policy WS-TOK-14 triggered a notification to billing admins.", category: "attention", tag: "Billing" },
    { id: "3", actor: "Sarah Chen", actorEmail: "s.chen@meridian.io", verb: "Security policy updated", tone: "ok", ts: now - 3600000, detail: "MFA grace period reduced from 14 days to 7 days.", category: "policy", tag: "Policy" },
    { id: "4", actor: "Deploy Bot", actorEmail: "deploy@aziron.com", verb: "Flow deployment completed", tone: "ok", ts: now - 7200000, detail: "Incident RCA flow v2.3 promoted to production.", category: "deploy", tag: "Deploy" },
    { id: "5", actor: "Domain Service", actorEmail: "noreply@aziron.com", verb: "New domain verified", tone: "ok", ts: now - 86400000, detail: `${tenant.domain} ownership confirmed via DNS TXT.`, category: "identity", tag: "Domains" },
  ];
  return base;
}

function StickyWorkspaceHeader({
  tenant,
  planCfg,
  statusCfg,
  workspaceHost,
  lastUpdated,
}) {
  const qi = avatarIdx(tenant.id);
  const [copied, setCopied] = useState(false);
  const copyHost = () => {
    navigator.clipboard?.writeText(workspaceHost);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  const region = tenant.settings?.region ?? "US-East (primary)";
  const planLabel = planCfg?.label ?? tenant.plan;

  return (
    <header
      className={cn(
        "relative z-30 shrink-0 border-b border-border/70 bg-card/90 backdrop-blur-md",
        "dark:border-border/80 dark:bg-background/95",
      )}
    >
      <div className="mx-auto max-w-[1728px] px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div
              className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold tracking-tight text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
              style={{ background: `linear-gradient(145deg,${AVATAR_GRAD[qi][0]},${AVATAR_GRAD[qi][1]})` }}
              aria-hidden
            >
              {initials(tenant.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Workspace
              </p>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {tenant.name}
                </h1>
                {planCfg && (
                  <span
                    className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ background: planCfg.bg, color: planCfg.text }}
                  >
                    {planCfg.label}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono text-[11px] text-foreground/90">{tenant.domain}</span>
                <span className="text-muted-foreground/50" aria-hidden>·</span>
                <span>{region}</span>
                <span className="text-muted-foreground/50" aria-hidden>·</span>
                <span>{planLabel}</span>
                <span className="text-muted-foreground/50" aria-hidden>·</span>
                <button
                  type="button"
                  onClick={copyHost}
                  className="group inline-flex max-w-[min(100%,14rem)] items-center gap-1 truncate font-mono text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:max-w-xs"
                  aria-label={copied ? "Host copied" : `Copy workspace host ${workspaceHost}`}
                >
                  {workspaceHost}
                  <Copy className="size-3 shrink-0 opacity-50 group-hover:opacity-100" aria-hidden />
                  {copied && <span className="text-[10px] font-medium text-success">Copied</span>}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                <span className="text-foreground/80">Updated</span>{" "}
                <time dateTime={lastUpdated.toISOString()} className="tabular-nums">
                  {lastUpdated.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </time>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 lg:max-w-[40%]">
            <span
              className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold"
              style={{
                borderColor: `${statusCfg.dot}55`,
                color: statusCfg.text,
                background: statusCfg.bg ?? "transparent",
              }}
            >
              <span className="size-1.5 rounded-full" style={{ background: statusCfg.dot }} aria-hidden />
              {statusCfg.label}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function WorkspaceNav({
  items,
  activeId,
  onSelect,
  navRef,
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
      aria-label="Workspace"
      onKeyDown={onKeyDown}
    >
      <p className="mb-2 hidden px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground lg:block">
        Workspace
      </p>
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible" role="list">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeId === item.id;
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
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ActivityFeed({ tenant, className, onViewAll }) {
  const [expanded, setExpanded] = useState(null);
  const items = useMemo(() => buildActivityFeed(tenant), [tenant]);

  const tagStyles = {
    attention: "border-warning/35 bg-warning/10 text-warning-foreground",
    policy: "border-info/35 bg-info/10 text-info-foreground",
    deploy: "border-success/35 bg-success/10 text-success",
    identity: "border-primary/25 bg-primary/10 text-primary dark:text-primary",
  };

  return (
    <section aria-labelledby="activity-heading" className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="mb-4 flex shrink-0 flex-col gap-2 border-b border-border/70 pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-border/80">
        <div>
          <h2 id="activity-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Workspace activity
          </h2>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
            Signal stream for membership, policy, deploy, and domain events—newest first.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-primary"
            >
              View all
              <span className="tabular-nums" aria-hidden> →</span>
            </button>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success dark:border-success-ring/35">
            <Activity className="size-3.5" strokeWidth={1.25} aria-hidden />
            Live
          </span>
        </div>
      </div>
      <ol className="relative min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-y-contain pr-0.5">
        {items.map((ev) => {
          const open = expanded === ev.id;
          const tone = ev.tone === "warn" ? "text-warning-foreground" : "text-success";
          const tagClass = tagStyles[ev.category] ?? tagStyles.identity;
          return (
            <li key={ev.id} className="rounded-xl border border-transparent px-1 py-0.5 transition-colors hover:border-border/80 hover:bg-muted/40 dark:hover:border-border/60 dark:hover:bg-muted/25">
              <div className="flex gap-3 px-2 py-2.5">
                <div className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-card shadow-sm dark:border-border dark:bg-card", tone)}>
                  {ev.tone === "warn" ? <AlertTriangle className="size-3.5" strokeWidth={1.25} /> : <CheckCircle2 className="size-3.5" strokeWidth={1.25} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-[13px] leading-snug text-foreground">
                      <span className="font-semibold">{ev.actor}</span>
                      {" "}
                      <span className="font-normal text-muted-foreground">{ev.verb}</span>
                    </p>
                    <span className={cn("shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", tagClass)}>
                      {ev.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                    <time dateTime={new Date(ev.ts).toISOString()}>{new Date(ev.ts).toLocaleString()}</time>
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-primary"
                      aria-expanded={open}
                      onClick={() => setExpanded(open ? null : ev.id)}
                    >
                      {open ? "Show less" : "Details"}
                    </button>
                  </div>
                  {open && (
                    <p className="mt-2 border-l-2 border-primary/40 pl-3 text-xs leading-relaxed text-muted-foreground">
                      {ev.detail}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function MetaCopyIconButton({ label, value }) {
  return (
    <button
      type="button"
      className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-background/40"
      aria-label={`Copy ${label}`}
      onClick={() => navigator.clipboard?.writeText(String(value))}
    >
      <Copy className="size-3.5" strokeWidth={1.25} aria-hidden />
    </button>
  );
}

function MetadataPanel({ tenant, deployCfg, onNavigate, className }) {
  const region = tenant.settings?.region ?? "US-East (primary)";
  const created = new Date(tenant.createdAt).toLocaleDateString(undefined, { dateStyle: "long" });
  const planLabel = PLAN_CFG[tenant.plan]?.label ?? tenant.plan;
  const complianceLabel = tenant.settings?.hipaa ? "HIPAA-ready · SOC2" : "SOC2 (inherited)";
  const qi = avatarIdx(tenant.id);

  return (
    <aside aria-labelledby="meta-heading" className={cn("flex min-h-0 flex-col", className)}>
      <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="meta-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Workspace profile
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Identity, compliance, and routing context for this organization.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onNavigate?.("settings")}
        >
          Edit
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-0.5">
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-muted/50 via-card to-card p-4 shadow-sm dark:border-border dark:from-muted/20 dark:via-card dark:to-card">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card text-primary shadow-inner dark:border-border dark:bg-background/80">
                <Globe2 className="size-5" strokeWidth={1.5} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Primary domain</p>
                <p className="mt-1 break-all font-mono text-sm font-semibold tracking-tight text-foreground">{tenant.domain}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{tenant.name}</p>
              </div>
            </div>
            <MetaCopyIconButton label="primary domain" value={tenant.domain} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4 dark:border-border/80">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/70 px-2.5 py-1 font-mono text-[11px] text-foreground dark:border-border dark:bg-background/40">
              <GitBranch className="size-3 shrink-0 text-muted-foreground" strokeWidth={1.25} aria-hidden />
              {tenant.slug}
            </span>
            <MetaCopyIconButton label="slug" value={tenant.slug} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { icon: Network, label: "Region", value: region },
            { icon: Building2, label: "Industry", value: tenant.industry ?? "—" },
            { icon: Clock, label: "Created", value: created },
            { icon: CreditCard, label: "Commercial plan", value: planLabel },
          ].map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.label}
                className="rounded-xl border border-border/60 bg-muted/15 px-3 py-2.5 dark:border-border/70 dark:bg-muted/10"
              >
                <div className="flex items-center gap-2">
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.25} aria-hidden />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{row.label}</p>
                </div>
                <p className="mt-1 pl-5 text-[13px] font-medium leading-snug text-foreground">{row.value}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-3.5 dark:border-border dark:bg-card/60">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Primary contact</p>
          <div className="mt-3 flex items-center gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ring-2 ring-background"
              style={{ background: `linear-gradient(145deg,${AVATAR_GRAD[qi][0]},${AVATAR_GRAD[qi][1]})` }}
              aria-hidden
            >
              {initials(tenant.contactName ?? "—")}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{tenant.contactName}</p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{tenant.contactEmail}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Compliance &amp; data plane</p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success dark:border-success-ring/40">
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

function ResourceUsageOverview({ tenant }) {
  const u = tenant.usage ?? {};
  const domainCount = (TENANT_DOMAINS[tenant.id] ?? []).length || 1;
  const members = u.memberCount ?? 0;
  const cards = [
    { key: "agents", label: "Agents", value: u.agentCount ?? 0, trend: "↑ 3 this week", foot: "Execution plane" },
    { key: "workflows", label: "Workflows", value: u.workflowCount ?? 0, trend: "↑ 1 this week", foot: "Published flows" },
    { key: "vector", label: "Vector DBs", value: u.vectorDbCount ?? 0, trend: "No change", foot: "Retrieval stores" },
    {
      key: "members",
      label: "Members",
      value: members,
      trend: members > 120 ? "⚠ Elevated joins" : "+4 this week",
      foot: "Seated users",
    },
    { key: "providers", label: "Providers", value: u.providerCount ?? 0, trend: "No change", foot: "Model routes" },
    { key: "domains", label: "Domains", value: domainCount, trend: "✓ Verified", foot: "Auth domains" },
  ];

  return (
    <section aria-labelledby="resource-usage-heading" className="col-span-12">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="resource-usage-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Resource footprint
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
            Capacity snapshot across agents, flows, data stores, and identity—aligned to your commercial tier.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((row) => (
          <div
            key={row.key}
            className={cn(
              "group overflow-hidden rounded-2xl bg-card p-4 text-left shadow-sm",
              "transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md",
              "dark:bg-card/90",
            )}
          >
            <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              {(row.value ?? 0).toLocaleString()}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {row.label}
            </p>
            <p className="mt-2 text-[11px] font-medium text-muted-foreground/90">{row.trend}</p>
            <p className="mt-3 pt-2 text-[10px] text-muted-foreground">
              {row.foot}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function WorkspaceInsightsColumn({ can, onNavigate, onOpenGovernance, className }) {
  return (
    <aside aria-labelledby="insights-heading" className={cn("flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-y-contain", className)}>
      <div>
        <h2 id="insights-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Signals &amp; actions
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Operational nudges without leaving the overview.</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-card p-4 shadow-sm dark:border-primary/25 dark:from-primary/[0.08] dark:via-card dark:to-card">
        <div className="absolute -right-6 -top-6 size-24 rounded-full bg-primary/10 blur-2xl" aria-hidden />
        <div className="relative flex gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="size-4" strokeWidth={1.5} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-primary">AI routing insight</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              Shift roughly <span className="font-semibold text-foreground">6%</span> of retrieval traffic to cached embeddings to compress tail latency on support flows.
            </p>
            <button
              type="button"
              className="mt-3 text-xs font-semibold text-primary underline-offset-4 hover:underline"
              onClick={onOpenGovernance}
            >
              Review in governance
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-success/25 bg-success/[0.06] p-4 dark:border-success-ring/35 dark:bg-success/10">
        <p className="text-[11px] font-bold uppercase tracking-wide text-success">Approvals</p>
        <p className="mt-2 text-sm text-muted-foreground">No pending change requests for this workspace.</p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/15 p-1 dark:border-border dark:bg-muted/10">
        <p className="px-3 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick paths</p>
        <ul className="mt-1 divide-y divide-border/60 dark:divide-border/80">
          {[
            { label: "Manage members", icon: UserPlus, action: () => onNavigate?.("tenant-users"), show: can("users.view") },
            { label: "View active agents", icon: Bot, action: () => onNavigate?.("agents"), show: true },
            { label: "Token usage report", icon: BarChart3, action: () => onNavigate?.("usage"), show: can("usage.view") },
          ].filter((x) => x.show).map((row) => {
            const Icon = row.icon;
            return (
              <li key={row.label}>
                <button
                  type="button"
                  onClick={row.action}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-background/80 dark:hover:bg-background/40"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground dark:border-border">
                    <Icon className="size-4" strokeWidth={1.5} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">{row.label}</span>
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground opacity-60" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

function OverviewInsightsBand({ tenant, deployCfg, can, onNavigate, onViewActivity, onOpenGovernance }) {
  return (
    <div
      className={cn(
        "col-span-12 overflow-hidden rounded-[1.25rem] border border-border/70 bg-card shadow-sm",
        "dark:border-border dark:bg-card/80",
      )}
    >
      <div className="grid min-h-0 grid-cols-1 divide-y divide-border/70 lg:grid-cols-12 lg:divide-x lg:divide-y-0 dark:divide-border/80">
        <MetadataPanel
          tenant={tenant}
          deployCfg={deployCfg}
          onNavigate={onNavigate}
          className="min-h-0 p-5 sm:p-6 lg:col-span-3 lg:max-h-[min(72vh,56rem)]"
        />
        <ActivityFeed
          tenant={tenant}
          onViewAll={onViewActivity}
          className="min-h-0 p-5 sm:p-6 lg:col-span-5 lg:max-h-[min(72vh,56rem)]"
        />
        <WorkspaceInsightsColumn
          can={can}
          onNavigate={onNavigate}
          onOpenGovernance={onOpenGovernance}
          className="min-h-0 p-5 sm:p-6 lg:col-span-4 lg:max-h-[min(72vh,56rem)]"
        />
      </div>
    </div>
  );
}

function RightContextPanel({ collapsed, onToggle }) {
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="fixed bottom-20 right-4 z-30 flex size-11 items-center justify-center rounded-full border border-border bg-card shadow-lg lg:static lg:mt-0 lg:size-auto lg:rounded-lg lg:px-2 dark:border-border dark:bg-card"
        aria-label="Open context panel"
      >
        <PanelRightOpen className="size-5 text-muted-foreground" />
      </button>
    );
  }
  return (
    <aside
      className={cn(
        "flex w-full flex-col border-t border-border bg-muted/30/90 dark:border-border dark:bg-background/95",
        "lg:w-72 lg:shrink-0 lg:border-l lg:border-t-0",
        "fixed inset-x-0 bottom-0 z-30 max-h-[45vh] overflow-y-auto shadow-lg lg:static lg:max-h-none lg:shadow-none",
      )}
      aria-label="Workspace intelligence"
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2 dark:border-border">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Context</p>
        <button
          type="button"
          className="rounded-md p-1 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-muted"
          onClick={onToggle}
          aria-label="Collapse context panel"
        >
          <PanelRightClose className="size-4" />
        </button>
      </div>
      <div className="divide-y divide-border/90 p-3 dark:divide-border">
        <div className="py-3 first:pt-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-warning-foreground">
            <Bell className="size-3.5" strokeWidth={1.25} aria-hidden />
            Alerts
          </p>
          <p className="mt-1 text-xs text-warning-foreground">Token soft-cap trending high for next cycle.</p>
        </div>
        <div className="py-3">
          <p className="text-xs font-semibold text-foreground">Approvals</p>
          <p className="mt-1 text-xs text-muted-foreground">No pending change requests.</p>
        </div>
        <div className="py-3 last:pb-0">
          <p className="text-xs font-semibold text-foreground">AI insights</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Shift 6% of retrieval traffic to cached embeddings to reduce tail latency on support flows.
          </p>
        </div>
      </div>
    </aside>
  );
}

function GovernanceSection() {
  return (
    <div className="col-span-12 space-y-4">
      <p className="text-sm text-muted-foreground">
        Model policies, approvals, and regional controls will plug into this lane. Architecture is module-ready.
      </p>
      <div className="grid grid-cols-12 gap-3">
        {["Model allowlist", "Data residency", "Workflow approvals", "Observability exports"].map((t) => (
          <div key={t} className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl border border-dashed border-border bg-muted/50 p-4 text-sm font-medium text-muted-foreground dark:border-border dark:bg-card/40 dark:text-muted-foreground/35">
            {t}
            <span className="mt-2 block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Module</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecuritySection() {
  return (
    <div className="col-span-12 max-w-3xl space-y-4">
      <p className="text-sm text-muted-foreground">
        MFA coverage, policy compliance, and suspicious sign-ins roll up here. Connect your IdP to unlock SAML.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: "MFA enrolled", v: "94%" },
          { k: "Policies", v: "12 active" },
          { k: "Risk signals", v: "Low" },
          { k: "DLP scans", v: "OK" },
        ].map((x) => (
          <div key={x.k} className="rounded-xl border border-border bg-card p-3 text-center dark:border-border dark:bg-card">
            <p className="text-lg font-semibold text-foreground">{x.v}</p>
            <p className="text-[11px] text-muted-foreground">{x.k}</p>
          </div>
        ))}
      </div>
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

function OperationsSection({ tenant }) {
  const base = getBaseTierPackage(tenant.id);
  return (
    <div className="col-span-12 grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-4 dark:border-border dark:bg-card">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Packages</p>
        <p className="mt-2 text-lg font-semibold">{base ? base.pkg.name : "No base tier assigned"}</p>
        <p className="text-sm text-muted-foreground">Entitlements and seat pools for execution plane.</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 dark:border-border dark:bg-card">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Domains & routing</p>
        <p className="mt-2 text-sm text-foreground">Primary {tenant.domain} · verified routing healthy.</p>
      </div>
    </div>
  );
}

function AuditSection({ tenant }) {
  const log = TENANT_AUDIT_LOG[tenant.id] ?? [];
  return (
    <div className="col-span-12">
      <ul className="divide-y divide-border rounded-xl border border-border bg-card dark:divide-border dark:border-border dark:bg-card">
        {[...log].reverse().slice(0, 12).map((e) => (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <span className="text-foreground">{e.detail}</span>
            <span className="text-xs text-muted-foreground">{new Date(e.ts).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BillingSection({ tenant }) {
  const invoices = INVOICES.filter((i) => i.tenantId === tenant.id).slice(0, 6);
  return (
    <div className="col-span-12">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground dark:border-border">
            <th className="py-2 pr-4">Invoice</th>
            <th className="py-2 pr-4">Period</th>
            <th className="py-2 pr-4">Amount</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b border-border dark:border-border">
              <td className="py-2 font-mono text-xs">{inv.id}</td>
              <td className="py-2">{inv.period}</td>
              <td className="py-2 font-medium">${inv.amount.toLocaleString()}</td>
              <td className="py-2">{inv.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WorkspaceDashboardPage({
  tenant,
  onNavigate,
  canEditTenant,
  can,
  role,
}) {
  const navItems = useMemo(
    () => NAV.filter((n) => n.perm(PERMISSIONS[role] ?? PERMISSIONS.tenantuser)),
    [role],
  );
  const [active, setActive] = useState("overview");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [rightCollapsed, setRightCollapsed] = useState(false);
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
  const workspaceHost = tenant.slug?.includes("meridian")
    ? "enterprise.meridian.io"
    : `workspace.${tenant.slug}.aziron.app`;

  const mainContent = useMemo(() => {
    switch (safeActive) {
      case "overview":
        return (
          <>
            <ResourceUsageOverview tenant={tenant} />
            <OverviewInsightsBand
              tenant={tenant}
              deployCfg={deployCfg}
              can={can}
              onNavigate={onNavigate}
              onViewActivity={() => setActive("audit")}
              onOpenGovernance={() => setActive("governance")}
            />
          </>
        );
      case "members":
        return <MembersDirectory tenant={tenant} variant="embedded" onNavigate={onNavigate} />;
      case "operations":
        return <OperationsSection tenant={tenant} />;
      case "usage":
        return (
          <section className="col-span-12 rounded-xl border border-border bg-card p-6 dark:border-border dark:bg-card" aria-labelledby="usage-hint-heading">
            <h2 id="usage-hint-heading" className="text-sm font-semibold text-foreground">
              Usage & costs
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Detailed usage meters and exports live on the platform usage page.
            </p>
            <Button type="button" className="mt-4" variant="outline" size="sm" onClick={() => onNavigate?.("usage")}>
              Open usage page
            </Button>
          </section>
        );
      case "security":
        return <SecuritySection />;
      case "governance":
        return <GovernanceSection />;
      case "billing":
        return <BillingSection tenant={tenant} />;
      case "audit":
        return <AuditSection tenant={tenant} />;
      case "settings":
        return <SettingsSection tenant={tenant} onNavigate={onNavigate} />;
      default:
        return null;
    }
  }, [safeActive, tenant, deployCfg, can, onNavigate, setActive]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      {!canEditTenant && (
        <div className="shrink-0 border-b border-info-ring/25 bg-info/10 px-4 py-3 text-sm text-info-foreground dark:dark:border-border dark:bg-muted text-info-foreground">
          <span className="font-semibold">View-only workspace.</span>{" "}
          Commercial and suspension controls are managed by Aziron platform operations.
        </div>
      )}

      <StickyWorkspaceHeader
        tenant={tenant}
        planCfg={planCfg}
        statusCfg={statusCfg}
        workspaceHost={workspaceHost}
        lastUpdated={lastUpdated}
      />

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        <div className="lg:hidden">
          <button
            type="button"
            className="flex w-full items-center justify-between border-b border-border bg-card px-4 py-2 text-sm font-medium text-foreground dark:border-border dark:bg-card dark:text-muted-foreground"
            aria-expanded={mobileNav}
            onClick={() => setMobileNav((v) => !v)}
          >
            Workspace menu
            <ChevronRight className={cn("size-4 transition-transform", mobileNav && "rotate-90")} />
          </button>
          {mobileNav && (
            <WorkspaceNav items={navItems} activeId={safeActive} onSelect={(id) => { setActive(id); setMobileNav(false); }} navRef={navRef} />
          )}
        </div>

        <div className="hidden lg:flex">
          <WorkspaceNav items={navItems} activeId={safeActive} onSelect={setActive} navRef={navRef} />
        </div>

        <main
          id="workspace-main"
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-20 lg:pb-6"
          role="main"
        >
          <div className="mx-auto max-w-[1728px] px-4 py-6 sm:px-6 lg:py-8">
            <div className="grid grid-cols-12 gap-5 lg:gap-6">
              {mainContent}
            </div>
          </div>
        </main>

        <div className="hidden lg:block">
          {safeActive !== "overview" && (
            !rightCollapsed ? (
              <RightContextPanel collapsed={false} onToggle={() => setRightCollapsed(true)} />
            ) : (
              <div className="flex w-12 shrink-0 flex-col items-center border-l border-border bg-muted/30 pt-3 dark:border-border dark:bg-background">
                <RightContextPanel collapsed onToggle={() => setRightCollapsed(false)} />
              </div>
            )
          )}
        </div>
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

      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen} title="Workspace command palette">
        <Command className="rounded-xl border-0">
          <CommandInput placeholder="Jump to module, run action…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Navigate">
              <CommandItem onSelect={() => { setCmdOpen(false); setActive("overview"); }}>
                <LayoutDashboard className="size-4" />
                Overview
                <CommandShortcut>⌘1</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => { setCmdOpen(false); setActive("members"); }}>
                <Users className="size-4" />
                Members
              </CommandItem>
              <CommandItem onSelect={() => { setCmdOpen(false); onNavigate?.("usage"); }}>
                <BarChart3 className="size-4" />
                Global usage page
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Workspace">
              <CommandItem onSelect={() => { setCmdOpen(false); setActive("billing"); }}>
                <CreditCard className="size-4" />
                Billing & invoices
              </CommandItem>
              <CommandItem onSelect={() => { setCmdOpen(false); setActive("audit"); }}>
                <ClipboardList className="size-4" />
                Audit logs
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

    </div>
  );
}

