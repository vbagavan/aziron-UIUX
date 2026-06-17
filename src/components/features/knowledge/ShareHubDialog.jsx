import { useMemo, useState } from "react";
import { Building2, Check, Search, Settings2, User, Users, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import { createHubMember } from "@/data/knowledgeHubs";
import { ASSIGNABLE_HUB_ROLES, HUB_ROLE_META } from "@/lib/hubRoles";

/** Directory the picker searches over (prototype — would be the org graph). */
const DIRECTORY = {
  user: [
    { name: "Sarah Chen", email: "sarah.chen@aziro.com" },
    { name: "Marcus Reid", email: "marcus.reid@aziro.com" },
    { name: "Priya Nair", email: "priya.nair@aziro.com" },
    { name: "Tom Alvarez", email: "tom.alvarez@aziro.com" },
    { name: "Lena Brooks", email: "lena.brooks@aziro.com" },
    { name: "Dev Patel", email: "dev.patel@aziro.com" },
    { name: "Mei Tan", email: "mei.tan@aziro.com" },
    { name: "Noah Kim", email: "noah.kim@aziro.com" },
  ],
  team: [
    { name: "Platform Engineering", memberCount: 9 },
    { name: "Data Science", memberCount: 6 },
    { name: "Customer Success", memberCount: 11 },
    { name: "Marketing Ops", memberCount: 5 },
    { name: "Security", memberCount: 4 },
  ],
  department: [
    { name: "Engineering", memberCount: 48 },
    { name: "Operations", memberCount: 22 },
    { name: "Revenue", memberCount: 31 },
    { name: "People", memberCount: 14 },
  ],
};

const PRINCIPAL_TABS = [
  { id: "user", label: "People", icon: User },
  { id: "team", label: "Teams", icon: Users },
  { id: "department", label: "Departments", icon: Building2 },
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

function PrincipalIcon({ type, name }) {
  if (type === "user") {
    return (
      <Avatar className="size-7">
        <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
      </Avatar>
    );
  }
  const Icon = type === "team" ? Users : Building2;
  return (
    <span className="flex size-7 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground">
      <Icon className="size-3.5" />
    </span>
  );
}

export function ShareHubDialog({
  open,
  onOpenChange,
  hub,
  members = [],
  actor,
  onShare,
  onManageMembers,
}) {
  const [tab, setTab] = useState("user");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]); // {principalType,name,email,memberCount}
  const [role, setRole] = useState("viewer");

  const existingKeys = useMemo(() => {
    const set = new Set();
    for (const m of members) {
      set.add(
        m.principalType === "user"
          ? `user:${(m.email ?? "").toLowerCase()}`
          : `${m.principalType}:${(m.name ?? "").toLowerCase()}`,
      );
    }
    return set;
  }, [members]);

  const selectedKeys = useMemo(
    () =>
      new Set(
        selected.map((s) =>
          s.principalType === "user"
            ? `user:${(s.email ?? "").toLowerCase()}`
            : `${s.principalType}:${(s.name ?? "").toLowerCase()}`,
        ),
      ),
    [selected],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DIRECTORY[tab]
      .map((entry) => ({ ...entry, principalType: tab }))
      .filter((entry) => {
        const key =
          tab === "user"
            ? `user:${(entry.email ?? "").toLowerCase()}`
            : `${tab}:${entry.name.toLowerCase()}`;
        if (existingKeys.has(key) || selectedKeys.has(key)) return false;
        if (!q) return true;
        return (
          entry.name.toLowerCase().includes(q) ||
          (entry.email ?? "").toLowerCase().includes(q)
        );
      });
  }, [tab, query, existingKeys, selectedKeys]);

  function reset() {
    setSelected([]);
    setQuery("");
    setRole("viewer");
    setTab("user");
  }

  function handleClose(next) {
    if (!next) reset();
    onOpenChange(next);
  }

  function addPrincipal(entry) {
    setSelected((prev) => [...prev, entry]);
    setQuery("");
  }

  function removePrincipal(entry) {
    setSelected((prev) => prev.filter((s) => s !== entry));
  }

  function handleShare() {
    if (selected.length === 0) return;
    const newMembers = selected.map((s) =>
      createHubMember({
        principalType: s.principalType,
        name: s.name,
        email: s.email ?? null,
        role,
        memberCount: s.memberCount ?? null,
        actor,
      }),
    );
    onShare?.(newMembers);
    reset();
    onOpenChange(false);
  }

  const reach = members.reduce(
    (sum, m) => sum + (m.principalType === "user" ? 1 : m.memberCount ?? 0),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share {hub?.name ?? "hub"}</DialogTitle>
          <DialogDescription>
            Sharing happens at the hub level. Anyone you add can access every source
            and generated asset inside it.
          </DialogDescription>
        </DialogHeader>

        {/* Principal type switch */}
        <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
          {PRINCIPAL_TABS.map(({ id, label, icon }) => {
            const Icon = icon;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTab(id);
                  setQuery("");
                }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  tab === id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Selected chips */}
        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((s, i) => (
              <span
                key={`${s.name}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 py-0.5 pl-1 pr-1.5 text-xs"
              >
                <PrincipalIcon type={s.principalType} name={s.name} />
                <span className="max-w-[140px] truncate font-medium">{s.name}</span>
                <button
                  type="button"
                  onClick={() => removePrincipal(s)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${s.name}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${PRINCIPAL_TABS.find((t) => t.id === tab)?.label.toLowerCase()}…`}
            className="h-9 pl-8"
          />
        </div>

        {/* Results */}
        <div className="max-h-52 min-h-[6rem] overflow-y-auto rounded-lg border border-border">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No matches. Everyone found is already a member.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((entry) => (
                <li key={entry.email ?? entry.name}>
                  <button
                    type="button"
                    onClick={() => addPrincipal(entry)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-muted/50"
                  >
                    <PrincipalIcon type={entry.principalType} name={entry.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{entry.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {entry.principalType === "user"
                          ? entry.email
                          : `${entry.memberCount} member${entry.memberCount === 1 ? "" : "s"}`}
                      </span>
                    </span>
                    <Check className="size-4 shrink-0 text-muted-foreground opacity-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Role</span>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-8 w-[150px]">
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
          </div>
          <div className="flex items-center gap-2">
            {onManageMembers ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  handleClose(false);
                  onManageMembers();
                }}
              >
                <Settings2 className="size-3.5" />
                Manage members
              </Button>
            ) : null}
            <Button type="button" size="sm" disabled={selected.length === 0} onClick={handleShare}>
              {selected.length > 0 ? `Share with ${selected.length}` : "Share"}
            </Button>
          </div>
        </DialogFooter>

        <p className="-mt-1 text-center text-[11px] text-muted-foreground">
          <Badge variant="secondary" className="mr-1 align-middle">
            {members.length}
          </Badge>
          {members.length === 1 ? "principal" : "principals"} with access
          {reach > 0 ? ` · ~${reach} ${reach === 1 ? "person" : "people"} reached` : ""}
        </p>
      </DialogContent>
    </Dialog>
  );
}
