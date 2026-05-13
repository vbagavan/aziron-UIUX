import { useEffect, useId, useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight, ExternalLink, Info, MoreVertical, Search, Shield, UserPlus, Users,
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

function initials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
  if (role === "Admin") {
    return "border-primary/35 bg-primary/10 text-primary dark:bg-primary/15";
  }
  if (role === "Editor") {
    return "border-border bg-muted/40 text-foreground";
  }
  return "border-border/80 bg-background text-muted-foreground";
}

function statusBadgeClass(status) {
  if (status === "Active") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
  }
  if (status === "Invited") {
    return "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-100";
  }
  return "border-border bg-muted/50 text-muted-foreground";
}

function SeatBar({ used, provisioned, compact }) {
  if (provisioned == null || provisioned === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card shadow-sm dark:border-border",
          compact ? "p-4" : "p-5",
        )}
      >
        <p className="text-sm font-semibold text-foreground">Seat usage</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {used} seat{used !== 1 ? "s" : ""} in use. This deployment is not metered on a fixed seat cap in the demo data.
        </p>
      </div>
    );
  }
  const pct = Math.min(100, (used / provisioned) * 100);
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm dark:border-border",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Seat usage</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Active seats and pending invites count toward your plan.
          </p>
        </div>
        <div className="text-right">
          <p className={cn("text-xl font-bold tabular-nums text-foreground", pct >= 100 && "text-destructive")}>
            {used}{" "}
            <span className="text-sm font-normal text-muted-foreground">/ {provisioned}</span>
          </p>
          <p className="text-xs text-muted-foreground">{Math.max(0, provisioned - used)} seats available</p>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 90 ? "bg-destructive" : pct >= 75 ? "bg-amber-500" : "bg-primary",
          )}
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
          <label htmlFor={inviteFieldId} className="text-xs font-medium text-muted-foreground">
            Work email
          </label>
          <Input
            id={inviteFieldId}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
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
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={submit} disabled={seatsFull}>
            Send invite
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
      {error && !seatsFull ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      {seatsFull ? (
        <p className="mt-2 text-xs text-destructive">No seats available. Expand your plan to invite more members.</p>
      ) : null}
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
          onClick={() => {
            onSetRole(r);
            onClose();
          }}
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
        onClick={() => {
          onRemove();
          onClose();
        }}
        className="flex w-full items-center px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
      >
        Remove from workspace
      </button>
    </div>
  );
}

/**
 * Shared members roster: search, filters, pagination, invites, row actions.
 * @param {{ tenant: object; variant?: "page" | "embedded"; onNavigate?: (page: string) => void }} props
 */
export function MembersDirectory({ tenant, variant = "page", onNavigate }) {
  const tierDef = getTierDef(tenant);
  const provisionedCap = tenant.seats ?? tenant.max_users ?? null;
  const inviteFieldId = useId();

  const [users, setUsers] = useState(() => rosterWithIds(tenant.id, TENANT_USERS[tenant.id] ?? []));
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setUsers(rosterWithIds(tenant.id, TENANT_USERS[tenant.id] ?? []));
    setSearch("");
    setShowInvite(false);
    setOpenMenuId(null);
    setFilterStatus("all");
    setFilterRole("all");
    setPage(1);
  }, [tenant.id]);

  const seatsUsed = users.filter((u) => u.status !== "Inactive").length;
  const seatsFull = provisionedCap != null && seatsUsed >= provisionedCap;
  const pendingInvites = users.filter((u) => u.status === "Invited").length;

  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, filterRole]);

  const handleInvite = (email, role, setError) => {
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return setError("This email already has access.");
    }
    const displayName = email
      .split("@")[0]
      .replace(/[._-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const nextId = Math.max(0, ...users.map((u) => u.id)) + 1;
    setUsers((prev) => [
      ...prev,
      {
        id: nextId,
        name: displayName,
        email,
        role,
        status: "Invited",
        lastActive: "—",
        userUid: `azr-${tenant.id}-${String(nextId).padStart(4, "0")}`,
      },
    ]);
    setShowInvite(false);
  };

  const setRole = (id, role) => {
    setUsers((p) => p.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  const revokeSeat = (id) => {
    setUsers((p) => p.filter((u) => u.id !== id));
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.userUid && u.userUid.toLowerCase().includes(q));
      const matchStatus = filterStatus === "all" || u.status === filterStatus;
      const matchRole = filterRole === "all" || u.role === filterRole;
      return matchSearch && matchStatus && matchRole;
    });
  }, [users, search, filterStatus, filterRole]);

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

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const domainHint = tenant.domain ? `name@${tenant.domain}` : "colleague@company.com";
  const tierLine = tierDef
    ? `${tierDef.label} plan${tierDef.seatRange ? ` · ${tierDef.seatRange}` : ""}`
    : null;

  const statItems = useMemo(
    () => [
      { label: "Total", value: users.length },
      { label: "Active", value: users.filter((u) => u.status === "Active").length },
      { label: "Pending invites", value: pendingInvites },
      { label: "Inactive", value: users.filter((u) => u.status === "Inactive").length },
    ],
    [users, pendingInvites],
  );

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        {variant === "page" ? (
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Members</h1>
        ) : (
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Members</h2>
        )}
        {variant === "embedded" ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {tierLine ?? "Plan details unavailable"}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{tenant.name}</span>
            {tierLine ? (
              <>
                {" · "}
                {tierLine}
              </>
            ) : null}
          </p>
        )}
        {variant === "embedded" ? (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Admins sort to the top, then active seats, then pending and inactive.{" "}
            <span className="whitespace-nowrap text-muted-foreground/90">Full tools also on the dedicated page.</span>
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {variant === "embedded" && onNavigate ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => onNavigate("tenant-users")}
          >
            <ExternalLink className="size-4" aria-hidden />
            Dedicated page
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setShowInvite(true);
            setOpenMenuId(null);
          }}
          disabled={seatsFull}
        >
          <UserPlus className="size-4" aria-hidden />
          Invite member
        </Button>
      </div>
    </div>
  );

  const statsBlock =
    variant === "embedded" ? (
      <div className="flex flex-wrap divide-y divide-border rounded-lg border border-border bg-muted/15 p-0 sm:divide-x sm:divide-y-0 dark:bg-muted/10">
        {statItems.map((s) => (
          <div
            key={s.label}
            className="flex min-w-[calc(50%-1px)] flex-1 flex-col px-4 py-2.5 sm:min-w-0 sm:flex-1 sm:px-5"
          >
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</span>
            <span className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{s.value}</span>
          </div>
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statItems.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card p-4 shadow-sm dark:border-border"
          >
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </div>
    );

  const body = (
    <>
      {header}

      {statsBlock}

      <div className={cn(variant === "embedded" && "-mt-1")}>
        <SeatBar used={seatsUsed} provisioned={provisionedCap} compact={variant === "embedded"} />
      </div>

      <section
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm dark:border-border"
        aria-labelledby="members-directory-heading"
      >
        <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <h2 id="members-directory-heading" className="text-sm font-semibold text-foreground">
              All members
            </h2>
            <Tooltip>
              <TooltipTrigger
                type="button"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label="How this list is sorted"
              >
                <Info className="size-3.5" aria-hidden />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
                Order: Admins first, then Editors, then Viewers. Within each role: Active, then pending invites,
                then inactive. Names are alphabetical within the same role and status.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
            <div className="relative min-w-0 flex-1 sm:max-w-xs sm:flex-initial">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, or ID…"
                className="h-9 pl-9"
                aria-label="Search members"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger size="sm" className="w-[9.5rem]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger size="sm" className="w-[10.5rem]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Invited">Pending invite</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {showInvite ? (
          <InvitePanel
            inviteFieldId={inviteFieldId}
            domainHint={domainHint}
            onInvite={handleInvite}
            onCancel={() => setShowInvite(false)}
            seatsFull={seatsFull}
          />
        ) : null}

        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30 dark:bg-muted/20">
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead className="w-12 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && !showInvite ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-12 text-center">
                  <Users className="mx-auto mb-3 size-9 text-muted-foreground/50" aria-hidden />
                  <p className="text-sm font-medium text-foreground">No members in this workspace yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                    Invite colleagues to appear here. Until then, seat usage stays at zero.
                  </p>
                  <Button type="button" size="sm" className="mt-4" onClick={() => setShowInvite(true)} disabled={seatsFull}>
                    <UserPlus className="size-4" aria-hidden />
                    Invite first member
                  </Button>
                </TableCell>
              </TableRow>
            ) : users.length === 0 && showInvite ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                  First member will appear here after you send the invite.
                </TableCell>
              </TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-14 text-center text-muted-foreground">
                  <Users className="mx-auto mb-2 size-8 opacity-40" aria-hidden />
                  <p className="text-sm">No members match your filters.</p>
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((u) => {
                const isAdmin = u.role === "Admin";
                return (
                  <TableRow
                    key={u.id}
                    className={cn(isAdmin && "bg-primary/[0.04] hover:bg-primary/[0.06] dark:bg-primary/[0.07] dark:hover:bg-primary/[0.09]")}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 shrink-0">
                          <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                            {initials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{u.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          <p className="truncate font-mono text-[10px] text-muted-foreground/90">{u.userUid}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-medium", roleBadgeClass(u.role))}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-medium", statusBadgeClass(u.status))}>
                        {statusLabel(u.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.lastActive}</TableCell>
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
                        {openMenuId === u.id ? (
                          <RowActionsMenu
                            user={u}
                            onSetRole={(role) => setRole(u.id, role)}
                            onRemove={() => revokeSeat(u.id)}
                            onClose={() => setOpenMenuId(null)}
                          />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {sorted.length > PAGE_SIZE ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, sorted.length)} of{" "}
              {sorted.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 px-2"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" aria-hidden />
                Prev
              </Button>
              <span className="px-2 tabular-nums">
                Page {safePage} / {pageCount}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 px-2"
                disabled={safePage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                Next
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            {sorted.length} member{sorted.length !== 1 ? "s" : ""}
            {filterStatus !== "all" || filterRole !== "all" || search ? " (filtered)" : ""}
          </div>
        )}
      </section>

      <p
        className={cn(
          "text-center text-xs text-muted-foreground",
          variant === "embedded" && "pb-1",
        )}
      >
        Pending invites receive a sign-in link; the seat is held until they accept or you remove them.
      </p>
    </>
  );

  return (
    <TooltipProvider delay={200}>
      <div
        className={cn(
          variant === "embedded" && "col-span-12 mx-auto flex w-full max-w-6xl flex-col gap-4",
        )}
        onClick={() => setOpenMenuId(null)}
      >
        {body}
      </div>
    </TooltipProvider>
  );
}
