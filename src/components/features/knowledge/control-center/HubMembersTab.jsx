import { useState } from "react";
import {
  Building2,
  Check,
  Minus,
  Shield,
  Trash2,
  User,
  UserPlus,
  Users,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import { formatDisplayDate } from "@/data/knowledgeHubs";
import {
  ASSIGNABLE_HUB_ROLES,
  HUB_ROLE_META,
  hubRoleCan,
  hubRoleLabel,
  hubRoleRank,
} from "@/lib/hubRoles";

const MEMBERS_PAGE_SIZE = 10;

const MATRIX_ROWS = [
  { label: "View sources & assets", action: "sources.view" },
  { label: "Ask AI & generate", action: "ai.generate" },
  { label: "Create notes", action: "notes.create" },
  { label: "Add sources & connections", action: "sources.upload" },
  { label: "Pin assets", action: "assets.pin" },
  { label: "Delete sources", action: "sources.delete" },
  { label: "Archive assets", action: "assets.archive" },
  { label: "Manage members & share", action: "members.manage" },
];

function initials(name) {
  return (name ?? "")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function PrincipalCell({ member }) {
  const { principalType, name, email, memberCount } = member;
  const sub =
    principalType === "user"
      ? email
      : `${principalType === "team" ? "Team" : "Department"} · ${memberCount ?? 0} member${memberCount === 1 ? "" : "s"}`;
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {principalType === "user" ? (
        <Avatar className="size-8">
          <AvatarFallback className="text-[11px]">{initials(name)}</AvatarFallback>
        </Avatar>
      ) : (
        <span className="flex size-8 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground">
          {principalType === "team" ? <Users className="size-4" /> : <Building2 className="size-4" />}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function TypeBadge({ type }) {
  const map = {
    user: { label: "User", icon: User },
    team: { label: "Team", icon: Users },
    department: { label: "Department", icon: Building2 },
  };
  const { label, icon: Icon } = map[type] ?? map.user;
  return (
    <Badge variant="outline" className="gap-1 text-[10px] font-medium text-muted-foreground">
      <Icon className="size-3" />
      {label}
    </Badge>
  );
}

export function HubMembersTab({ hub, hubRole, onShareClick }) {
  const { updateHubMemberRole, removeHubMember } = useKnowledgeHubs();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [pendingDowngrade, setPendingDowngrade] = useState(null);

  // React Compiler memoizes these derived values; manual useMemo isn't needed.
  const members = hub?.members ?? [];
  const canManage = hubRoleCan(hubRole, "members.manage");

  const query = search.trim().toLowerCase();
  const ranked = [...members].sort(
    (a, b) => (HUB_ROLE_META[b.role]?.rank ?? 0) - (HUB_ROLE_META[a.role]?.rank ?? 0),
  );
  const filtered = query
    ? ranked.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          (m.email ?? "").toLowerCase().includes(query),
      )
    : ranked;

  const pageCount = Math.max(1, Math.ceil(filtered.length / MEMBERS_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice(
    (currentPage - 1) * MEMBERS_PAGE_SIZE,
    currentPage * MEMBERS_PAGE_SIZE,
  );

  const reach = members.reduce(
    (sum, m) => sum + (m.principalType === "user" ? 1 : m.memberCount ?? 0),
    0,
  );
  const counts = { principals: members.length, reach };

  function applyRole(member, role) {
    updateHubMemberRole(hub.id, member.id, role);
    toast.success(`${member.name} is now ${hubRoleLabel(role)}`);
  }

  function handleRoleChange(member, role) {
    if (role === member.role) return;
    // Lowering access is consequential — confirm a downgrade before applying.
    if (hubRoleRank(role) < hubRoleRank(member.role)) {
      setPendingDowngrade({ member, role });
      return;
    }
    applyRole(member, role);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">People with access</h3>
          <p className="text-xs text-muted-foreground">
            {counts.principals} {counts.principals === 1 ? "principal" : "principals"}
            {counts.reach > counts.principals
              ? ` · reaches ~${counts.reach} people via teams & departments`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("gap-1", HUB_ROLE_META[hubRole]?.badgeClass)}>
            <Shield className="size-3" />
            Your role: {hubRoleLabel(hubRole)}
          </Badge>
          {canManage && onShareClick ? (
            <Button type="button" size="sm" className="gap-1.5" onClick={onShareClick}>
              <UserPlus className="size-3.5" />
              Share
            </Button>
          ) : null}
        </div>
      </div>

      {!canManage ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          You can see who has access, but only Editors and the Owner can invite, remove,
          or change roles.
        </div>
      ) : null}

      {/* Search */}
      <div className="max-w-xs">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search members…"
          className="h-9"
        />
      </div>

      {/* Members table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((member) => {
              const isOwner = member.role === "owner";
              const editable = canManage && !isOwner;
              return (
                <TableRow key={member.id} className="group">
                  <TableCell>
                    <PrincipalCell member={member} />
                  </TableCell>
                  <TableCell>
                    <TypeBadge type={member.principalType} />
                  </TableCell>
                  <TableCell>
                    {editable ? (
                      <Select
                        value={member.role}
                        onValueChange={(role) => handleRoleChange(member, role)}
                      >
                        <SelectTrigger className="h-8 w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSIGNABLE_HUB_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {HUB_ROLE_META[r].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="outline"
                        className={cn("gap-1 capitalize", HUB_ROLE_META[member.role]?.badgeClass)}
                      >
                        {isOwner ? <Shield className="size-3" /> : null}
                        {hubRoleLabel(member.role)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span title={`Added by ${member.addedByName ?? "—"}`}>
                      {member.addedAt ? formatDisplayDate(member.addedAt) : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {editable ? (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                          aria-label={`Remove ${member.name}`}
                          onClick={() => setPendingRemove(member)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No members match “{search}”.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        {pageCount > 1 ? (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            <span>
              {filtered.length} members · page {currentPage} of {pageCount}
            </span>
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7"
                disabled={currentPage === pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Permission matrix */}
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border bg-muted/20 px-4 py-2.5">
          <h3 className="text-sm font-semibold">Roles &amp; permissions</h3>
          <p className="text-xs text-muted-foreground">
            What each role can do inside this hub. The Owner can do everything, including
            deleting the hub.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Capability</TableHead>
              {ASSIGNABLE_HUB_ROLES.map((r) => (
                <TableHead key={r} className="text-center">
                  {HUB_ROLE_META[r].label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {MATRIX_ROWS.map((row) => (
              <TableRow key={row.action}>
                <TableCell className="text-sm">{row.label}</TableCell>
                {ASSIGNABLE_HUB_ROLES.map((r) => {
                  const allowed = hubRoleCan(r, row.action);
                  return (
                    <TableCell key={r} className="text-center">
                      {allowed ? (
                        <Check className="mx-auto size-4 text-primary" role="img" aria-label="Allowed" />
                      ) : (
                        <Minus className="mx-auto size-4 text-muted-foreground/40" role="img" aria-label="Not allowed" />
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pendingRemove ? (
        <ConfirmDialog
          title={`Remove ${pendingRemove.name}?`}
          message={
            pendingRemove.principalType === "user"
              ? "They will immediately lose access to this hub and all its sources and assets."
              : "Everyone in this group will lose access to this hub and all its sources and assets."
          }
          confirmLabel="Remove"
          onConfirm={() => {
            removeHubMember(hub.id, pendingRemove.id);
            toast.success(`${pendingRemove.name} removed from this hub`);
            setPendingRemove(null);
          }}
          onCancel={() => setPendingRemove(null)}
        />
      ) : null}

      {pendingDowngrade ? (
        <ConfirmDialog
          title={`Lower ${pendingDowngrade.member.name} to ${hubRoleLabel(pendingDowngrade.role)}?`}
          message={`They will lose the abilities of ${hubRoleLabel(pendingDowngrade.member.role)} immediately. You can raise their role again at any time.`}
          confirmLabel="Change role"
          confirmVariant="default"
          onConfirm={() => {
            applyRole(pendingDowngrade.member, pendingDowngrade.role);
            setPendingDowngrade(null);
          }}
          onCancel={() => setPendingDowngrade(null)}
        />
      ) : null}
    </div>
  );
}
