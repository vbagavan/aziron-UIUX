import { useEffect, useRef, useState } from "react";
import {
  Check, ChevronDown, ChevronRight, ChevronUp, MoreVertical,
  Pencil, Plus, Search, Settings, Trash2, UserPlus, Users, X,
} from "lucide-react";

import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";

const GROUP_STATUS = {
  Active: { dot: "var(--success)", text: "var(--success)" },
  Draft: { dot: "var(--warning)", text: "var(--warning)" },
  Archived: { dot: "var(--muted-foreground)", text: "var(--muted-foreground)" },
};

const INIT_GROUPS = [
  { id: 1, name: "Finance Team", description: "Billing operations, approvals, and reporting.", members: 12, owner: "Jane Cooper", status: "Active", updatedAt: "23 Feb 2025 12:00 PM" },
  { id: 2, name: "AI Dev Team", description: "Model development, prompt systems, and evaluation.", members: 8, owner: "Kristin Watson", status: "Active", updatedAt: "22 Feb 2025 09:20 AM" },
  { id: 3, name: "Support Team", description: "Customer escalations, SLAs, and service workflows.", members: 15, owner: "Ralph Edwards", status: "Active", updatedAt: "20 Feb 2025 04:45 PM" },
  { id: 4, name: "Leadership", description: "Cross-functional approvals and org-wide planning.", members: 6, owner: "Savannah Nguyen", status: "Draft", updatedAt: "18 Feb 2025 02:10 PM" },
  { id: 5, name: "Contractors", description: "Temporary access for external collaborators.", members: 11, owner: "Robert Fox", status: "Archived", updatedAt: "14 Feb 2025 10:15 AM" },
];

const ALL_COLS = [
  { key: "name", label: "Group Name" },
  { key: "description", label: "Description" },
  { key: "members", label: "Members" },
  { key: "owner", label: "Owner" },
  { key: "status", label: "Status" },
  { key: "updatedAt", label: "Updated" },
];

function Popover({ open, onClose, anchor, width = "w-48", children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target) && anchor?.current && !anchor.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose, anchor]);

  if (!open) return null;

  return (
    <div ref={ref} className={`absolute z-50 top-full mt-1 ${width} overflow-hidden rounded-[10px] border border-border bg-card shadow-elevation-md dark:border-border dark:bg-card`}>
      {children}
    </div>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const timeout = setTimeout(onDone, 2800);
    return () => clearTimeout(timeout);
  }, [message, onDone]);

  return (
    <div className="fixed bottom-5 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-2 rounded-[8px] bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-xl">
      <Check size={14} className="shrink-0 text-foreground" />
      {message}
    </div>
  );
}

function SortIcon({ sortKey, col, sortDir }) {
  if (sortKey !== col) return <ChevronUp size={11} className="text-foreground dark:text-muted-foreground" />;
  return sortDir === "asc"
    ? <ChevronUp size={11} className="text-primary" />
    : <ChevronDown size={11} className="text-primary" />;
}

export default function UserGroupsPage({ onNavigate }) {
  const [rows, setRows] = useState(INIT_GROUPS);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rpp, setRpp] = useState(10);
  const [sortKey, setSortKey] = useState("updatedAt");
  const [sortDir, setSortDir] = useState("asc");
  const [visCols, setVisCols] = useState(new Set(ALL_COLS.map((col) => col.key)));
  const [statusFilter, setStatusFilter] = useState(null);
  const [toast, setToast] = useState(null);
  const [showStatusPop, setShowStatusPop] = useState(false);
  const [showColsPop, setShowColsPop] = useState(false);
  const [rowMenu, setRowMenu] = useState(null);

  const statusRef = useRef(null);
  const colsRef = useRef(null);

  const filtered = rows.filter((group) => {
    const q = search.toLowerCase();
    if (q && !group.name.toLowerCase().includes(q) && !group.description.toLowerCase().includes(q) && !group.owner.toLowerCase().includes(q)) return false;
    if (statusFilter && group.status !== statusFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const factor = sortDir === "asc" ? 1 : -1;
    if (sortKey === "name") return a.name.localeCompare(b.name) * factor;
    if (sortKey === "members") return (a.members - b.members) * factor;
    return a.updatedAt.localeCompare(b.updatedAt) * factor;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / rpp));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * rpp, safePage * rpp);

  const notify = (message) => setToast(message);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleCol = (key) => {
    setVisCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const archiveGroup = (id) => {
    setRows((prev) => prev.map((group) => (group.id === id ? { ...group, status: "Archived" } : group)));
    setRowMenu(null);
    notify("Group archived");
  };

  const deleteGroup = (id) => {
    setRows((prev) => prev.filter((group) => group.id !== id));
    setRowMenu(null);
    notify("Group removed");
  };

  return (
    <>
      {rowMenu && <div className="fixed inset-0 z-30" onClick={() => setRowMenu(null)} />}

      <main className="flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
        <Sidebar activePage="user-groups" onNavigate={onNavigate} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader onNavigate={onNavigate} />

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="mx-auto flex min-h-0 max-w-[1400px] flex-1 flex-col gap-4 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="type-page-title">User Groups</h1>
                  <p className="mt-0.5 text-sm text-muted-foreground dark:text-muted-foreground">Organize people into reusable teams and access cohorts.</p>
                </div>
                <Button className="h-9 gap-1.5 rounded-[7px] bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary">
                  <Plus size={15} /> Create Group
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-9 w-72 items-center gap-2 rounded-[7px] border border-border bg-card px-3 shadow-elevation-sm dark:border-border dark:bg-card">
                  <Search size={14} className="shrink-0 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search groups"
                    className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground dark:text-foreground"
                  />
                  {search && (
                    <Button variant="ghost" size="icon-xs" onClick={() => setSearch("")} className="size-5 rounded-full text-muted-foreground hover:bg-transparent hover:text-muted-foreground">
                      <X size={13} />
                    </Button>
                  )}
                </div>

                <div className="relative">
                  <Button
                    ref={statusRef}
                    variant="outline"
                    onClick={() => { setShowColsPop(false); setShowStatusPop((v) => !v); }}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-[7px] border px-3 text-sm font-medium shadow-elevation-sm transition-colors ${statusFilter ? "border-border bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted dark:border-border dark:bg-card dark:text-muted-foreground dark:hover:bg-muted"}`}
                  >
                    <Users size={12} /> Status {statusFilter && <span className="font-semibold">: {statusFilter}</span>}
                    <ChevronDown size={11} className={`text-muted-foreground transition-transform ${showStatusPop ? "rotate-180" : ""}`} />
                  </Button>
                  <Popover open={showStatusPop} onClose={() => setShowStatusPop(false)} anchor={statusRef} width="w-44">
                    <div className="py-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setStatusFilter(null); setShowStatusPop(false); setPage(1); }} className={`flex h-auto w-full items-center justify-between gap-2 rounded-none px-3 py-2 text-sm transition-colors ${!statusFilter ? "bg-primary/10 text-primary dark:bg-primary/20/30" : "text-muted-foreground hover:bg-muted dark:text-muted-foreground dark:hover:bg-muted"}`}>
                        All Statuses {!statusFilter && <Check size={13} className="text-primary" />}
                      </Button>
                      {Object.keys(GROUP_STATUS).map((status) => {
                        const active = statusFilter === status;
                        const cfg = GROUP_STATUS[status];
                        return (
                          <Button key={status} type="button" variant="ghost" size="sm" onClick={() => { setStatusFilter(status); setShowStatusPop(false); setPage(1); }} className={`flex h-auto w-full items-center justify-between gap-2 rounded-none px-3 py-2 text-sm transition-colors ${active ? "bg-primary/10 dark:bg-primary/20/30" : "hover:bg-muted dark:hover:bg-muted"}`}>
                            <span className={`flex items-center gap-2 ${active ? "font-semibold text-primary" : "text-muted-foreground dark:text-muted-foreground"}`}>
                              <span className="size-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                              {status}
                            </span>
                            {active && <Check size={13} className="text-primary" />}
                          </Button>
                        );
                      })}
                    </div>
                  </Popover>
                </div>

                <div className="relative ml-auto">
                  <Button
                    ref={colsRef}
                    variant="outline"
                    onClick={() => { setShowStatusPop(false); setShowColsPop((v) => !v); }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[7px] border border-border bg-card px-3 text-sm font-medium text-muted-foreground shadow-elevation-sm transition-colors hover:bg-muted dark:border-border dark:bg-card dark:text-muted-foreground dark:hover:bg-muted"
                  >
                    <Settings size={13} /> Columns
                    <ChevronDown size={12} className={`text-muted-foreground transition-transform ${showColsPop ? "rotate-180" : ""}`} />
                  </Button>
                  <Popover open={showColsPop} onClose={() => setShowColsPop(false)} anchor={colsRef} width="w-48">
                    <div className="py-1">
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Toggle Columns</p>
                      {ALL_COLS.map((col) => (
                        <Button key={col.key} type="button" variant="ghost" size="sm" onClick={() => toggleCol(col.key)} className="flex h-auto w-full items-center gap-2.5 rounded-none px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted dark:text-muted-foreground dark:hover:bg-muted">
                          <span className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${visCols.has(col.key) ? "border-border bg-primary" : "border-border dark:border-border"}`}>
                            {visCols.has(col.key) && <Check size={10} className="text-white" />}
                          </span>
                          {col.label}
                        </Button>
                      ))}
                    </div>
                  </Popover>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-border bg-card shadow-elevation-sm dark:border-border dark:bg-card">
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted dark:border-border dark:bg-background/40">
                        {visCols.has("name") && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground dark:text-muted-foreground">Group Name</th>}
                        {visCols.has("description") && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground dark:text-muted-foreground">Description</th>}
                        {visCols.has("members") && <th className="px-4 py-3 text-left"><Button variant="ghost" size="sm" onClick={() => toggleSort("members")} className="inline-flex h-auto px-0 text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground hover:bg-transparent hover:text-foreground dark:text-muted-foreground dark:hover:bg-transparent dark:hover:text-foreground">Members <SortIcon sortKey={sortKey} col="members" sortDir={sortDir} /></Button></th>}
                        {visCols.has("owner") && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground dark:text-muted-foreground">Owner</th>}
                        {visCols.has("status") && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground dark:text-muted-foreground">Status</th>}
                        {visCols.has("updatedAt") && <th className="px-4 py-3 text-left"><Button variant="ghost" size="sm" onClick={() => toggleSort("updatedAt")} className="inline-flex h-auto px-0 text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground hover:bg-transparent hover:text-foreground dark:text-muted-foreground dark:hover:bg-transparent dark:hover:text-foreground">Updated <SortIcon sortKey={sortKey} col="updatedAt" sortDir={sortDir} /></Button></th>}
                        <th className="w-10 px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.length > 0 ? pageRows.map((group) => {
                        const statusCfg = GROUP_STATUS[group.status] || GROUP_STATUS.Active;
                        return (
                          <tr key={group.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted dark:border-border dark:hover:bg-muted/30">
                            {visCols.has("name") && (
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">
                                    <Users size={14} />
                                  </div>
                                  <span className="whitespace-nowrap font-medium text-foreground dark:text-foreground">{group.name}</span>
                                </div>
                              </td>
                            )}
                            {visCols.has("description") && <td className="px-4 py-3.5 text-muted-foreground dark:text-muted-foreground">{group.description}</td>}
                            {visCols.has("members") && <td className="px-4 py-3.5"><span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground dark:bg-border dark:text-muted-foreground">{group.members} members</span></td>}
                            {visCols.has("owner") && <td className="px-4 py-3.5 text-foreground dark:text-foreground">{group.owner}</td>}
                            {visCols.has("status") && (
                              <td className="px-4 py-3.5">
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: statusCfg.text }}>
                                  <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: statusCfg.dot }} />
                                  {group.status}
                                </span>
                              </td>
                            )}
                            {visCols.has("updatedAt") && <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground dark:text-muted-foreground">{group.updatedAt}</td>}
                            <td className="relative px-4 py-3.5">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setRowMenu((prev) => prev?.id === group.id ? null : { id: group.id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                }}
                                aria-label={`Actions for ${group.name}`}
                                aria-haspopup="menu"
                                aria-expanded={rowMenu?.id === group.id}
                                className="flex size-7 items-center justify-center rounded-[5px] text-muted-foreground transition-colors hover:bg-muted dark:hover:bg-muted"
                              >
                                <MoreVertical size={14} />
                              </Button>

                              {rowMenu?.id === group.id && (
                                <div className="fixed z-50 w-48 overflow-hidden rounded-[10px] border border-border bg-card py-1 shadow-elevation-md dark:border-border dark:bg-card" style={{ top: rowMenu.top, right: rowMenu.right }}>
                                  <Button type="button" variant="ghost" size="sm" onClick={() => { setRowMenu(null); notify("Group editor coming next"); }} className="flex h-auto w-full items-center gap-2 rounded-none px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted dark:text-muted-foreground dark:hover:bg-muted">
                                    <Pencil size={14} /> Edit group
                                  </Button>
                                  <Button type="button" variant="ghost" size="sm" onClick={() => archiveGroup(group.id)} className="flex h-auto w-full items-center gap-2 rounded-none px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted dark:text-muted-foreground dark:hover:bg-muted">
                                    <UserPlus size={14} /> Archive group
                                  </Button>
                                  <Button type="button" variant="ghost" size="sm" onClick={() => deleteGroup(group.id)} className="flex h-auto w-full items-center gap-2 rounded-none px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 dark:hover:bg-muted">
                                    <Trash2 size={14} /> Delete group
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={ALL_COLS.length + 1} className="px-4 py-16 text-center">
                            <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">
                                <Users size={20} />
                              </div>
                              <p className="font-medium text-foreground dark:text-foreground">No groups found</p>
                              <p className="text-sm text-muted-foreground dark:text-muted-foreground">Try adjusting your search or create a new group.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between border-t border-border px-4 py-3 dark:border-border">
                  <p className="text-xs text-muted-foreground">Showing {(safePage - 1) * rpp + (pageRows.length ? 1 : 0)}-{(safePage - 1) * rpp + pageRows.length} of {sorted.length} groups</p>
                  <div className="flex items-center gap-2">
                    <select value={rpp} onChange={(e) => { setRpp(Number(e.target.value)); setPage(1); }} className="h-8 rounded-[6px] border border-border bg-card px-2 text-xs text-muted-foreground outline-none dark:border-border dark:bg-card dark:text-muted-foreground">
                      {[10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
                    </select>
                    <Button variant="outline" size="xs" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-[6px] border border-border px-2 py-1 text-xs text-muted-foreground transition-colors enabled:hover:bg-muted dark:border-border dark:text-muted-foreground dark:enabled:hover:bg-muted">Prev</Button>
                    <span className="text-xs text-muted-foreground dark:text-muted-foreground">Page {safePage} of {totalPages}</span>
                    <Button variant="outline" size="xs" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-[6px] border border-border px-2 py-1 text-xs text-muted-foreground transition-colors enabled:hover:bg-muted dark:border-border dark:text-muted-foreground dark:enabled:hover:bg-muted">Next</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}
