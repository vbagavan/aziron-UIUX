import { useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import { formatDisplayDate } from "@/data/knowledgeHubs";
import {
  ASSIGNABLE_HUB_ROLES,
  HUB_ROLE_META,
  hubRoleCan,
  hubRoleLabel,
} from "@/lib/hubRoles";

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
  const [pendingRemove, setPendingRemove] = useState(null);

  const members = useMemo(() => hub?.members ?? [], [hub?.members]);
  const canManage = hubRoleCan(hubRole, "members.manage");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const ranked = [...members].sort(
      (a, b) => (HUB_ROLE_META[b.role]?.rank ?? 0) - (HUB_ROLE_META[a.role]?.rank ?? 0),
    );
    if (!q) return ranked;
    return ranked.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q),
    );
  }, [members, search]);

  const counts = useMemo(() => {
    const reach = members.reduce(
      (sum, m) => sum + (m.principalType === "user" ? 1 : m.memberCount ?? 0),
      0,
    );
    return { principals: members.length, reach };
  }, [members]);

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
          onChange={(e) => setSearch(e.target.value)}
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
            {filtered.map((member) => {
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
                        onValueChange={(role) => updateHubMemberRole(hub.id, member.id, role)}
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
                {ASSIGNABLE_HUB_ROLES.map((r) => (
                  <TableCell key={r} className="text-center">
                    {hubRoleCan(r, row.action) ? (
                      <Check className="mx-auto size-4 text-primary" />
                    ) : (
                      <Minus className="mx-auto size-4 text-muted-foreground/40" />
                    )}
                  </TableCell>
                ))}
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
            setPendingRemove(null);
          }}
          onCancel={() => setPendingRemove(null)}
        />
      ) : null}
    </div>
  );
}
