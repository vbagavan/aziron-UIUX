import { useEffect, useId, useMemo, useState } from "react";
import {
  Check, ChevronLeft, ChevronRight, Info, MoreVertical,
  Search, Shield, ShieldCheck, ShieldOff, UserPlus, Users, X,
  Activity, Database, Lock, Unlock, MousePointerClick,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getTierDef, TENANT_USERS } from "@/data/adminData";

const PAGE_SIZE = 8;
const ROLES = ["Admin", "Editor", "Viewer"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function rosterWithIds(tenantId, rows) {
  return (rows ?? []).map((u) => ({
    ...u,
    userUid: `azr-${tenantId}-${String(u.id).padStart(4, "0")}`,
  }));
}

function statusLabel(status) {
  if (status === "Invited") return "Pending invite";
  return status;
}

function roleBadgeClass(role) {
  if (role === "Admin") return "border-primary/35 bg-primary/10 text-primary dark:bg-primary/15";
  if (role === "Editor") return "border-border bg-muted/40 text-foreground";
  return "border-border/80 bg-background text-muted-foreground";
}

function statusBadgeClass(status) {
  if (status === "Active") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
  if (status === "Invited") return "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-100";
  return "border-border bg-muted/50 text-muted-foreground";
}

function avatarColor(name) {
  const colors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
    "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function recentActivityForUser(u) {
  if (u.status === "Invited") return [{ label: "Invitation sent", time: "Pending acceptance" }];
  if (u.status === "Inactive") return [
    { label: "Last session ended", time: u.lastActive },
    { label: "Account deactivated", time: u.lastActive },
  ];
  return [
    { label: "Signed in", time: u.lastActive },
    { label: "Ran workflow: Data Sync", time: "Yesterday" },
    { label: "Updated profile settings", time: "3 days ago" },
    { label: "Accessed Knowledge Hub", time: "4 days ago" },
  ];
}

function resourcesForUser(u) {
  if (u.status !== "Active") return [];
  return [
    { name: "Data Sync Agent", type: "Agent" },
    { name: "Customer Analytics Flow", type: "Flow" },
    { name: "Q2 Strategy Vault", type: "Vault" },
  ];
}

// ─── Filter Select helper (shows label when "all") ───────────────────────────

function FilterSelect({ value, onChange, label, options, width = "w-[8.5rem]" }) {
  const isActive = value !== "all";
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        size="sm"
        className={cn(
          width,
          isActive && "border-primary/40 bg-primary/5 text-primary dark:border-primary/30 dark:bg-primary/10",
        )}
      >
        <span className="truncate text-sm">
          {isActive ? `${label}: ${options.find((o) => o.value === value)?.label ?? value}` : label}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label}s</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeatBar({ used, provisioned }) {
  if (provisioned == null || provisioned === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
        <p className="text-sm font-semibold text-foreground">Seat usage</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {used} seat{used !== 1 ? "s" : ""} in use — this organisation is not capped in demo data.
        </p>
      </div>
    );
  }
  const pct = Math.min(100, (used / provisioned) * 100);
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Seat usage</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Active and pending seats count toward your plan.</p>
        </div>
        <div className="text-right">
          <p className={cn("text-xl font-bold tabular-nums text-foreground", pct >= 100 && "text-destructive")}>
            {used} <span className="text-sm font-normal text-muted-foreground">/ {provisioned}</span>
          </p>
          <p className="text-xs text-muted-foreground">{Math.max(0, provisioned - used)} available</p>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", pct >= 90 ? "bg-destructive" : pct >= 75 ? "bg-amber-500" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function InvitePanel({ inviteFieldId, domainHint, onInvite, onCancel, seatsFull }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Editor");
  const [error, setError] = useState("");

  const submit = () => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return setError("Email is required.");
    if (!re.test(email.trim())) return setError("Enter a valid email address.");
    onInvite(email.trim(), role, setError);
  };

  return (
    <div className="border-b border-border bg-muted/30 px-5 py-4 dark:bg-muted/15">
      <p className="mb-3 text-xs font-semibold text-foreground">Invite a member</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <label htmlFor={inviteFieldId} className="text-xs font-medium text-muted-foreground">Work email</label>
          <Input
            id={inviteFieldId}
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder={domainHint}
            className="h-9 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Role</span>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger size="sm" className="min-w-[8.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={submit} disabled={seatsFull}>Send invite</Button>
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
      {error && !seatsFull ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      {seatsFull ? <p className="mt-2 text-xs text-destructive">No seats available. Expand your plan to invite more members.</p> : null}
    </div>
  );
}

function RowActionsMenu({ user, onSetRole, onRemove, onClose }) {
  return (
    <div
      className="absolute right-0 top-full z-20 mt-1 w-52 rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Change role</p>
      {ROLES.map((r) => (
        <button
          key={r}
          type="button"
          disabled={user.role === r}
          onClick={() => { onSetRole(r); onClose(); }}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Shield className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          {r}
          {user.role === r ? <span className="ml-auto text-xs text-muted-foreground">Current</span> : null}
        </button>
      ))}
      <Separator className="my-1" />
      <button
        type="button"
        onClick={() => { onRemove(); onClose(); }}
        className="flex w-full items-center px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
      >
        Remove from organisation
      </button>
    </div>
  );
}

// ─── User Profile Drawer ──────────────────────────────────────────────────────

function UserProfileDrawer({ user, onClose, onGrantAdmin, onSuspend }) {
  const activity = recentActivityForUser(user);
  const resources = resourcesForUser(user);

  return (
    <aside className="flex w-[340px] shrink-0 self-start flex-col overflow-hidden border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">User Profile</span>
        <button
          type="button"
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close profile"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Identity block — avatar left, details right */}
      <div className="flex items-start gap-4 px-5 pb-5 pt-6 text-left">
        <div
          className={cn(
            "flex size-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold",
            avatarColor(user.name),
          )}
        >
          {initials(user.name)}
        </div>
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <p className="text-base font-semibold leading-snug text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <p className="font-mono text-[10px] text-muted-foreground/70">{user.userUid}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline" className={cn("font-medium", roleBadgeClass(user.role))}>
              <Shield className="mr-1 size-3" />{user.role}
            </Badge>
            <Badge variant="outline" className={cn("font-medium", statusBadgeClass(user.status))}>
              {statusLabel(user.status)}
            </Badge>
            {user.mfa ? (
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 font-medium text-emerald-800 dark:text-emerald-200">
                <ShieldCheck className="mr-1 size-3" />MFA on
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 font-medium text-amber-800 dark:text-amber-200">
                <ShieldOff className="mr-1 size-3" />No MFA
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Recent Activity */}
      <div className="px-5 py-4">
        <div className="mb-3 flex items-center gap-2">
          <Activity className="size-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent Activity</p>
        </div>
        <div className="flex flex-col gap-0">
          {activity.map((a, i) => (
            <div key={i} className="relative flex items-start gap-3 pb-3 last:pb-0">
              <div className="relative flex flex-col items-center">
                <div className="mt-0.5 size-1.5 rounded-full bg-primary/60" />
                {i < activity.length - 1 && <div className="mt-1 w-px flex-1 bg-border" style={{ minHeight: "16px" }} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">{a.label}</p>
                <p className="text-[11px] text-muted-foreground">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Assigned Resources */}
      <div className="px-5 py-4">
        <div className="mb-3 flex items-center gap-2">
          <Database className="size-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assigned Resources</p>
        </div>
        {resources.length === 0 ? (
          <p className="text-xs text-muted-foreground">No resources assigned.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {resources.map((r) => (
              <div key={r.name} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-xs font-medium text-foreground">{r.name}</span>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">{r.type}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="border-t border-border p-4">
        <div className="flex flex-col gap-2">
          {user.role !== "Admin" ? (
            <Button type="button" size="sm" className="w-full justify-center gap-2" onClick={() => onGrantAdmin(user)}>
              <Lock className="size-3.5" />Grant Admin Access
            </Button>
          ) : (
            <Button type="button" size="sm" variant="outline" className="w-full justify-center gap-2" onClick={() => onGrantAdmin(user)}>
              <Unlock className="size-3.5" />Remove Admin Access
            </Button>
          )}
          {user.status !== "Inactive" ? (
            <Button type="button" size="sm" variant="destructive" className="w-full justify-center" onClick={() => onSuspend(user)}>
              Suspend User
            </Button>
          ) : (
            <Button type="button" size="sm" variant="outline" className="w-full justify-center" onClick={() => onSuspend(user)}>
              Reactivate User
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "all", label: "All Members" },
  { id: "admin", label: "Admin Access" },
  { id: "pending", label: "Pending Invites" },
];

function TabBar({ active, onChange, counts }) {
  return (
    <div className="flex items-center gap-0 border-b border-border">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors",
            active === t.id
              ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
          {counts[t.id] > 0 && (
            <span className={cn(
              "inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
              active === t.id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
            )}>
              {counts[t.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Split-screen members directory with profile drawer, tabs, status + MFA columns,
 * labelled filters, clear-filter strip, and clickable-row hint.
 */
export function MembersDirectory({ tenant, variant = "page" }) {
  const tierDef = getTierDef(tenant);
  const provisionedCap = tenant.seats ?? tenant.max_users ?? null;
  const inviteFieldId = useId();

  const [users, setUsers] = useState(() => rosterWithIds(tenant.id, TENANT_USERS[tenant.id] ?? []));
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMfa, setFilterMfa] = useState("all");
  const [filterActivity, setFilterActivity] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    setUsers(rosterWithIds(tenant.id, TENANT_USERS[tenant.id] ?? []));
    setSearch(""); setShowInvite(false); setOpenMenuId(null);
    setFilterRole("all"); setFilterStatus("all"); setFilterMfa("all"); setFilterActivity("all");
    setActiveTab("all"); setPage(1); setSelectedUser(null);
  }, [tenant.id]);

  const seatsUsed = users.filter((u) => u.status !== "Inactive").length;
  const seatsFull = provisionedCap != null && seatsUsed >= provisionedCap;
  const pendingCount = users.filter((u) => u.status === "Invited").length;
  const adminCount = users.filter((u) => u.role === "Admin").length;

  const hasActiveFilters = filterRole !== "all" || filterStatus !== "all" || filterMfa !== "all" || filterActivity !== "all" || search.trim() !== "";

  const clearFilters = () => {
    setSearch(""); setFilterRole("all"); setFilterStatus("all"); setFilterMfa("all"); setFilterActivity("all");
  };

  useEffect(() => { setPage(1); }, [search, filterRole, filterStatus, filterMfa, filterActivity, activeTab]);

  const handleInvite = (email, role, setError) => {
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase()))
      return setError("This email already has access.");
    const displayName = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const nextId = Math.max(0, ...users.map((u) => u.id)) + 1;
    setUsers((prev) => [...prev, {
      id: nextId, name: displayName, email, role, status: "Invited",
      lastActive: "—", mfa: false,
      userUid: `azr-${tenant.id}-${String(nextId).padStart(4, "0")}`,
    }]);
    setShowInvite(false);
  };

  const setRole = (id, role) => {
    setUsers((p) => p.map((u) => (u.id === id ? { ...u, role } : u)));
    setSelectedUser((prev) => (prev?.id === id ? { ...prev, role } : prev));
  };

  const revokeSeat = (id) => {
    setUsers((p) => p.filter((u) => u.id !== id));
    setSelectedUser((prev) => (prev?.id === id ? null : prev));
  };

  const handleGrantAdmin = (user) => setRole(user.id, user.role === "Admin" ? "Editor" : "Admin");

  const handleSuspend = (user) => {
    const newStatus = user.status === "Inactive" ? "Active" : "Inactive";
    setUsers((p) => p.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)));
    setSelectedUser((prev) => (prev?.id === user.id ? { ...prev, status: newStatus } : prev));
  };

  const isActiveToday = (l) => l?.startsWith("Today");
  const isActiveThisWeek = (l) => l && l !== "—" && (l.startsWith("Today") || l.startsWith("Yesterday") || /\d+ days? ago/.test(l));
  const isInactiveLong = (l) => { const m = l?.match(/(\d+)\s+days? ago/); return m ? parseInt(m[1]) >= 30 : false; };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (activeTab === "admin" && u.role !== "Admin") return false;
      if (activeTab === "pending" && u.status !== "Invited") return false;
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.userUid?.toLowerCase().includes(q);
      const matchRole = filterRole === "all" || u.role === filterRole;
      const matchStatus = filterStatus === "all" || u.status === filterStatus;
      const matchMfa = filterMfa === "all" || (filterMfa === "enabled" ? u.mfa : !u.mfa);
      let matchActivity = true;
      if (filterActivity === "today") matchActivity = isActiveToday(u.lastActive);
      else if (filterActivity === "week") matchActivity = isActiveThisWeek(u.lastActive);
      else if (filterActivity === "inactive30") matchActivity = isInactiveLong(u.lastActive);
      return matchSearch && matchRole && matchStatus && matchMfa && matchActivity;
    });
  }, [users, search, filterRole, filterStatus, filterMfa, filterActivity, activeTab]);

  const sorted = useMemo(() => {
    const rankRole = (r) => (r === "Admin" ? 0 : r === "Editor" ? 1 : 2);
    const rankStatus = (s) => (s === "Active" ? 0 : s === "Invited" ? 1 : 2);
    return [...filtered].sort((a, b) => {
      if (rankRole(a.role) !== rankRole(b.role)) return rankRole(a.role) - rankRole(b.role);
      if (rankStatus(a.status) !== rankStatus(b.status)) return rankStatus(a.status) - rankStatus(b.status);
      return a.name.localeCompare(b.name);
    });
  }, [filtered]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const domainHint = tenant.domain ? `name@${tenant.domain}` : "colleague@company.com";
  const tierLine = tierDef ? `${tierDef.label} plan${tierDef.seatRange ? ` · ${tierDef.seatRange}` : ""}` : null;

  const statItems = useMemo(() => [
    { label: "Total", value: users.length },
    { label: "Active", value: users.filter((u) => u.status === "Active").length },
    { label: "Pending invites", value: pendingCount },
    { label: "Inactive", value: users.filter((u) => u.status === "Inactive").length },
  ], [users, pendingCount]);

  const tabCounts = { all: users.length, admin: adminCount, pending: pendingCount };

  return (
    <TooltipProvider delay={200}>
      <div
        className={cn(variant === "embedded" && "col-span-12 mx-auto flex w-full max-w-6xl flex-col gap-4")}
        onClick={() => setOpenMenuId(null)}
      >
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {variant === "page"
              ? <h1 className="text-xl font-semibold tracking-tight text-foreground">Members</h1>
              : <h2 className="text-lg font-semibold tracking-tight text-foreground">Members</h2>}
            <p className="mt-1 text-sm text-muted-foreground">
              {variant === "embedded"
                ? (tierLine ?? "Plan details unavailable")
                : <><span className="font-medium text-foreground">{tenant.name}</span>{tierLine ? <> · {tierLine}</> : null}</>}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Button type="button" size="sm" onClick={() => { setShowInvite(true); setOpenMenuId(null); }} disabled={seatsFull}>
              <UserPlus className="size-4" aria-hidden />
              Invite member
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className={variant === "embedded"
          ? "flex flex-wrap divide-y divide-border rounded-lg border border-border bg-muted/15 p-0 sm:divide-x sm:divide-y-0 dark:bg-muted/10"
          : "grid grid-cols-2 gap-3 sm:grid-cols-4"
        }>
          {statItems.map(({ label, value }) => (
            variant === "embedded" ? (
              <div key={label} className="flex min-w-[calc(50%-1px)] flex-1 flex-col px-4 py-2.5 sm:min-w-0 sm:px-5">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
                <span className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{value}</span>
              </div>
            ) : (
              <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
              </div>
            )
          ))}
        </div>

        {/* Seat bar */}
        <SeatBar used={seatsUsed} provisioned={provisionedCap} />

        {/* Main table card */}
        <section
          className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          aria-labelledby="members-directory-heading"
        >
          <h2 id="members-directory-heading" className="sr-only">Members directory</h2>

          {/* Tabs */}
          <TabBar active={activeTab} onChange={setActiveTab} counts={tabCounts} />

          {/* Toolbar */}
          <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <Tooltip>
                <TooltipTrigger type="button" className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Sort order">
                  <Info className="size-3.5" aria-hidden />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
                  Admins → Editors → Viewers. Within each role: Active → Pending → Inactive. Alphabetical within groups.
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
              {/* Search */}
              <div className="relative min-w-0 flex-1 sm:max-w-[200px] sm:flex-initial">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="h-9 pl-9"
                  aria-label="Search members"
                />
              </div>

              {/* Role */}
              <FilterSelect
                value={filterRole}
                onChange={setFilterRole}
                label="Role"
                width="w-[8rem]"
                options={ROLES.map((r) => ({ value: r, label: r }))}
              />

              {/* Status */}
              <FilterSelect
                value={filterStatus}
                onChange={setFilterStatus}
                label="Status"
                width="w-[8.5rem]"
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Invited", label: "Pending" },
                  { value: "Inactive", label: "Inactive" },
                ]}
              />

              {/* MFA */}
              <FilterSelect
                value={filterMfa}
                onChange={setFilterMfa}
                label="MFA"
                width="w-[7.5rem]"
                options={[
                  { value: "enabled", label: "On" },
                  { value: "disabled", label: "Off" },
                ]}
              />

              {/* Activity */}
              <FilterSelect
                value={filterActivity}
                onChange={setFilterActivity}
                label="Activity"
                width="w-[9rem]"
                options={[
                  { value: "today", label: "Today" },
                  { value: "week", label: "This week" },
                  { value: "inactive30", label: "Inactive 30d+" },
                ]}
              />
            </div>
          </div>

          {/* Active filters strip */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2 dark:bg-muted/15">
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{sorted.length}</span> of {users.length} members
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 rounded text-xs font-medium text-primary transition-colors hover:text-primary/80"
              >
                <X className="size-3" />
                Clear filters
              </button>
            </div>
          )}

          {/* Invite panel */}
          {showInvite && (
            <InvitePanel
              inviteFieldId={inviteFieldId}
              domainHint={domainHint}
              onInvite={handleInvite}
              onCancel={() => setShowInvite(false)}
              seatsFull={seatsFull}
            />
          )}

          {/* Clickable-row hint (shown only when no user selected) */}
          {!selectedUser && users.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 border-b border-border/60 bg-muted/20 px-4 py-1.5">
              <MousePointerClick className="size-3 text-muted-foreground/50" />
              <span className="text-[11px] text-muted-foreground/50">Click a row to view member profile</span>
            </div>
          )}

          {/* Split-screen: table + profile drawer */}
          <div className="flex min-h-0 items-start">
            {/* Table */}
            <div className="min-w-0 flex-1 overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30 dark:bg-muted/20">
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>MFA</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-12 text-right"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 && !showInvite ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="py-12 text-center">
                        <Users className="mx-auto mb-3 size-9 text-muted-foreground/50" aria-hidden />
                        <p className="text-sm font-medium text-foreground">No members yet</p>
                        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">Invite colleagues to get started.</p>
                        <Button type="button" size="sm" className="mt-4" onClick={() => setShowInvite(true)} disabled={seatsFull}>
                          <UserPlus className="size-4" aria-hidden />
                          Invite first member
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : pageRows.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="py-14 text-center text-muted-foreground">
                        <Users className="mx-auto mb-2 size-8 opacity-40" aria-hidden />
                        <p className="text-sm">No members match your filters.</p>
                        <button type="button" onClick={clearFilters} className="mt-2 text-xs text-primary hover:underline">
                          Clear filters
                        </button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageRows.map((u) => {
                      const isSelected = selectedUser?.id === u.id;
                      const isAdmin = u.role === "Admin";
                      return (
                        <TableRow
                          key={u.id}
                          onClick={() => setSelectedUser(isSelected ? null : u)}
                          className={cn(
                            "cursor-pointer",
                            isSelected
                              ? "bg-primary/[0.07] hover:bg-primary/[0.09] dark:bg-primary/[0.12]"
                              : isAdmin
                              ? "bg-primary/[0.03] hover:bg-primary/[0.05] dark:bg-primary/[0.06]"
                              : "hover:bg-muted/40",
                          )}
                        >
                          {/* User */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold", avatarColor(u.name))}>
                                {initials(u.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Role */}
                          <TableCell>
                            <Badge variant="outline" className={cn("font-medium", roleBadgeClass(u.role))}>
                              {u.role}
                            </Badge>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge variant="outline" className={cn("font-medium", statusBadgeClass(u.status))}>
                              {statusLabel(u.status)}
                            </Badge>
                          </TableCell>

                          {/* MFA */}
                          <TableCell>
                            {u.mfa ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="flex w-fit items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                                    <Check className="size-3" />Enabled
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">Multi-factor authentication is active</TooltipContent>
                              </Tooltip>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                    <X className="size-3" />Off
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">MFA not configured</TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>

                          {/* Last Active */}
                          <TableCell className="text-xs text-muted-foreground">{u.lastActive}</TableCell>

                          {/* Actions */}
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="relative inline-block text-left">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="size-8"
                                aria-label={`Actions for ${u.name}`}
                                aria-expanded={openMenuId === u.id}
                                onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                              {openMenuId === u.id && (
                                <RowActionsMenu
                                  user={u}
                                  onSetRole={(role) => setRole(u.id, role)}
                                  onRemove={() => revokeSeat(u.id)}
                                  onClose={() => setOpenMenuId(null)}
                                />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Profile drawer — self-start so it doesn't stretch beyond its content */}
            {selectedUser && (
              <UserProfileDrawer
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
                onGrantAdmin={handleGrantAdmin}
                onSuspend={handleSuspend}
              />
            )}
          </div>

          {/* Pagination */}
          {sorted.length > PAGE_SIZE ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
              <span>Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, sorted.length)} of {sorted.length}</span>
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
          ) : (
            <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
              {sorted.length} member{sorted.length !== 1 ? "s" : ""}{hasActiveFilters ? " (filtered)" : ""}
            </div>
          )}
        </section>

        <p className={cn("text-center text-xs text-muted-foreground", variant === "embedded" && "pb-1")}>
          Pending invites receive a sign-in link; the seat is held until they accept or you remove them.
        </p>
      </div>
    </TooltipProvider>
  );
}
