import { useState, useRef, useEffect } from "react";
import {
  Building2, Search, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  MoreVertical, Eye, ShieldOff, Shield, Filter, Users, DollarSign,
  TrendingUp, Plus, Trash2, RefreshCw,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import {
  TENANTS, STATUS_CFG, PLAN_CFG, formatMRR,
} from "@/data/adminData";
import { getBaseTierPackage, computePackageMRR } from "@/data/packagesData";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  ["#3b82f6","#1d4ed8"],["#8b5cf6","#6d28d9"],["#ec4899","#be185d"],
  ["#f59e0b","#b45309"],["#10b981","#047857"],["#06b6d4","#0e7490"],
  ["#f97316","#c2410c"],["#6366f1","#4338ca"],["#84cc16","#4d7c0f"],
  ["#14b8a6","#0f766e"],
];
function avatarGrad(id) {
  const [f, t] = AVATAR_COLORS[id % AVATAR_COLORS.length];
  return `linear-gradient(135deg,${f},${t})`;
}

// ─── Stats card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = "#2563eb" }) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4 flex-1 min-w-0">
      <div className="size-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#64748b] dark:text-[#94a3b8] font-medium leading-none mb-1">{label}</p>
        <p className="text-xl font-bold text-[#0f172a] dark:text-[#f1f5f9] leading-none">{value}</p>
        {sub && <p className="text-xs text-[#94a3b8] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────
function SortIcon({ col, sortKey, sortDir }) {
  if (sortKey !== col) return <ChevronUp size={12} className="text-[#cbd5e1] opacity-60" />;
  return sortDir === "asc"
    ? <ChevronUp size={12} className="text-[#2563eb]" />
    : <ChevronDown size={12} className="text-[#2563eb]" />;
}

// ─── Row menu ─────────────────────────────────────────────────────────────────
function RowMenu({ tenant, onView, onToggleSuspend, onDelete }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = e => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          btnRef.current  && !btnRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setMenuStyle({ position: "fixed", top: r.bottom + 4, right: window.innerWidth - r.right, width: 180, zIndex: 9999 });
    }
    setOpen(v => !v);
  };

  const isDeleted = tenant.status === "deleted";

  return (
    <>
      <button ref={btnRef} onClick={e => { e.stopPropagation(); toggle(); }}
        className="size-7 flex items-center justify-center rounded-[6px] text-[#64748b] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] transition-colors">
        <MoreVertical size={14} />
      </button>
      {open && (
        <div ref={menuRef}
          className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] overflow-hidden py-1"
          style={{ ...menuStyle, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
          <button onClick={e => { e.stopPropagation(); setOpen(false); onView(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#0f172a] dark:text-[#f1f5f9] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors">
            <Eye size={13} /> View Details
          </button>
          {!isDeleted && (
            <button onClick={e => { e.stopPropagation(); setOpen(false); onToggleSuspend(); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                tenant.status === "suspended"
                  ? "text-[#16a34a] hover:bg-[#f0fdf4] dark:hover:bg-[#052e16]"
                  : "text-[#f59e0b] hover:bg-[#fffbeb] dark:hover:bg-[#451a03]"
              }`}>
              {tenant.status === "suspended"
                ? <><RefreshCw size={13} /> Reactivate</>
                : <><ShieldOff size={13} /> Suspend</>
              }
            </button>
          )}
          <div className="border-t border-[#f1f5f9] dark:border-[#334155] my-1" />
          {isDeleted ? (
            <button onClick={e => { e.stopPropagation(); setOpen(false); onToggleSuspend(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#16a34a] hover:bg-[#f0fdf4] dark:hover:bg-[#052e16] transition-colors">
              <RefreshCw size={13} /> Restore Tenant
            </button>
          ) : (
            <button onClick={e => { e.stopPropagation(); setOpen(false); onDelete(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#dc2626] hover:bg-[#fef2f2] dark:hover:bg-[#450a0a] transition-colors">
              <Trash2 size={13} /> Delete Tenant
            </button>
          )}
        </div>
      )}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TenantListPage({ onNavigate, onViewTenant, onCreateTenant }) {
  const [tenants, setTenants] = useState(TENANTS);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const PER_PAGE = 8;

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalMRR = TENANTS.reduce((s, t) => s + computePackageMRR(t.id, t.usage?.tokensConsumed ?? 0), 0);
  const activeSaasSeats = TENANTS.filter(t => t.status === "active")
    .reduce((s, t) => s + (getBaseTierPackage(t.id)?.assignment?.seats || t.seats || 0), 0);
  const activeCount = TENANTS.filter(t => t.status === "active").length;

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const filtered = tenants
    .filter(t => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) &&
          !t.domain.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterTier   !== "all" && t.tier !== filterTier) return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      let av, bv;
      if (sortKey === "name")    { av = a.name; bv = b.name; }
      else if (sortKey === "mrr"){ av = computePackageMRR(a.id, a.usage?.tokensConsumed ?? 0); bv = computePackageMRR(b.id, b.usage?.tokensConsumed ?? 0); }
      else if (sortKey === "seats") { av = getBaseTierPackage(a.id)?.assignment?.seats ?? a.seats ?? 0; bv = getBaseTierPackage(b.id)?.assignment?.seats ?? b.seats ?? 0; }
      else if (sortKey === "tier")  { const o={lite:0,growth:1,scale:2}; av=o[a.tier??""]; bv=o[b.tier??""]; }
      else                       { av = a.status; bv = b.status; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const sort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const toggleSuspend = (id) => {
    setTenants(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (t.status === "deleted") return { ...t, status: "active" };
      return { ...t, status: t.status === "suspended" ? "active" : "suspended" };
    }));
  };

  const deleteTenant = (id) => {
    setTenants(prev => prev.map(t =>
      t.id === id ? { ...t, status: "deleted" } : t
    ));
  };

  const COL = [
    { key: "name",   label: "Tenant",     sortable: true  },
    { key: "tier",   label: "Tier",       sortable: true  },
    { key: "seats",  label: "Seats",      sortable: true  },
    { key: "mrr",    label: "MRR",        sortable: true  },
    { key: "status", label: "Status",     sortable: true  },
    { key: null,     label: "",           sortable: false  },
  ];

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
      <Sidebar activePage="tenants" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-px h-6 bg-[#e2e8f0] dark:bg-[#334155]" />
            <span className="text-sm text-[#64748b] dark:text-[#94a3b8]">Admin</span>
            <ChevronRight size={14} className="text-[#94a3b8]" />
            <span className="text-sm text-[#0f172a] dark:text-[#f1f5f9] font-medium">Tenants</span>
          </div>
        </AppHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Page header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0f172a] dark:text-[#f1f5f9] tracking-tight">Tenants</h1>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-0.5">
                Manage all customer organisations, subscriptions, and overrides.
              </p>
            </div>
            <button onClick={() => onNavigate?.("tenant-create")}
              className="flex items-center gap-2 h-9 px-4 rounded-[8px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold transition-colors flex-shrink-0">
              <Plus size={15} /> New Tenant
            </button>
          </div>

          {/* Stats row */}
          <div className="flex gap-3 flex-wrap">
            <StatCard icon={Building2}  label="Total Tenants"     value={TENANTS.length} sub={`${activeCount} active`} color="#2563eb" />
            <StatCard icon={Users}      label="Active Seats"      value={activeSaasSeats.toLocaleString()} sub="across active tenants" color="#0ea5e9" />
            <StatCard icon={DollarSign} label="Total MRR"         value={`$${(totalMRR / 1000).toFixed(0)}k`} sub="platform fees only" color="#7c3aed" />
          </div>

          {/* Filter bar */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search tenants…"
                  className="w-full pl-8 pr-8 h-9 text-sm rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#0f172a] dark:text-[#f1f5f9] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Filter toggle */}
              <button onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-1.5 h-9 px-3 rounded-[8px] border text-sm font-medium transition-colors ${
                  showFilters || filterTier !== "all" || filterStatus !== "all"
                    ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb] dark:bg-[#1e3a8a] dark:text-[#93c5fd] dark:border-[#1e3a8a]"
                    : "border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#475569] dark:text-[#94a3b8]"
                }`}>
                <Filter size={13} /> Filters
                {(filterTier !== "all" || filterStatus !== "all") && (
                  <span className="size-4 rounded-full bg-[#2563eb] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                    {[filterTier, filterStatus].filter(f => f !== "all").length}
                  </span>
                )}
              </button>
            </div>

            {/* Filter pills */}
            {showFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: "Tier",       state: filterTier,   set: setFilterTier,   opts: [["all","All"], ["lite","Lite"], ["growth","Growth"], ["scale","Scale"]] },
                  { label: "Status",     state: filterStatus, set: setFilterStatus, opts: [["all","All"], ["active","Active"], ["trial","Trial"], ["suspended","Suspended"], ["deleted","Deleted"]] },
                ].map(({ label, state, set, opts }) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className="text-xs text-[#94a3b8] font-medium">{label}:</span>
                    <div className="flex gap-1">
                      {opts.map(([val, lbl]) => (
                        <button key={val} onClick={() => { set(val); setPage(1); }}
                          className={`h-6 px-2.5 rounded-full text-xs font-medium transition-colors ${
                            state === val
                              ? "bg-[#2563eb] text-white"
                              : "bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] text-[#475569] dark:text-[#94a3b8] hover:border-[#2563eb]"
                          }`}>{lbl}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f1f5f9] dark:border-[#334155]">
                    {COL.map((col, i) => (
                      <th key={i}
                        className={`px-4 py-3 text-left text-xs font-semibold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-wide whitespace-nowrap ${col.sortable ? "cursor-pointer select-none hover:text-[#0f172a] dark:hover:text-[#f1f5f9]" : ""}`}
                        onClick={() => col.sortable && col.key && sort(col.key)}>
                        <div className="flex items-center gap-1">
                          {col.label}
                          {col.sortable && col.key && <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-sm text-[#94a3b8]">
                        No tenants match your filters.
                      </td>
                    </tr>
                  ) : paged.map(t => {
                    const baseTier = getBaseTierPackage(t.id);
                    const mrr = computePackageMRR(t.id, t.usage?.tokensConsumed ?? 0);
                    const seats = baseTier?.assignment?.seats ?? t.seats;
                    const statusCfg = STATUS_CFG[t.status] || STATUS_CFG.active;
                    const planCfg = PLAN_CFG[t.plan];
                    const isDeleted = t.status === "deleted";
                    return (
                      <tr key={t.id}
                        onClick={() => !isDeleted && onViewTenant?.(t)}
                        className={`border-b border-[#f8fafc] dark:border-[#1e293b] transition-colors ${
                          isDeleted
                            ? "opacity-50 bg-[#f8fafc] dark:bg-[#0f172a]"
                            : "hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] cursor-pointer"
                        }`}>
                        {/* Tenant name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                              style={{ background: avatarGrad(t.id) }}>
                              {initials(t.name)}
                            </div>
                            <div>
                              <p className="font-medium text-[#0f172a] dark:text-[#f1f5f9] leading-none">{t.name}</p>
                              <p className="text-xs text-[#94a3b8] mt-0.5">
                                {t.slug && <span className="font-mono">{t.slug}</span>}
                                {t.slug && " · "}
                                {t.domain}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* Plan + Tier */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {planCfg && (
                              <span className="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold w-fit"
                                style={{ background: planCfg.bg, color: planCfg.text }}>
                                {planCfg.label}
                              </span>
                            )}
                            {baseTier ? (
                              <span className="inline-flex items-center h-4 px-1.5 rounded text-[10px] font-semibold text-white w-fit"
                                style={{ background: baseTier.pkg.color }}>
                                {baseTier.pkg.name.replace("SaaS ", "").replace("On-Prem ", "")}
                              </span>
                            ) : !planCfg && (
                              <span className="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold bg-[#f1f5f9] dark:bg-[#334155] text-[#94a3b8]">
                                No package
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Seats / max_users */}
                        <td className="px-4 py-3 text-[#475569] dark:text-[#94a3b8] tabular-nums">
                          {t.max_users
                            ? `${seats?.toLocaleString() ?? "—"} / ${t.max_users.toLocaleString()}`
                            : (seats?.toLocaleString() ?? "—")
                          }
                        </td>
                        {/* MRR */}
                        <td className="px-4 py-3 font-semibold text-[#0f172a] dark:text-[#f1f5f9] tabular-nums">
                          {isDeleted
                            ? <span className="text-[#94a3b8] font-normal text-xs">—</span>
                            : mrr > 0 ? formatMRR(mrr) : <span className="text-[#94a3b8] font-normal">—</span>
                          }
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 h-5 px-2 rounded-full text-xs font-semibold"
                            style={{ background: statusCfg.bg, color: statusCfg.badgeText ?? statusCfg.text }}>
                            <span className="size-1.5 rounded-full flex-shrink-0"
                              style={{ background: statusCfg.dot }} />
                            {statusCfg.label}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                          <RowMenu
                            tenant={t}
                            onView={() => onViewTenant?.(t)}
                            onToggleSuspend={() => toggleSuspend(t.id)}
                            onDelete={() => deleteTenant(t.id)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#f1f5f9] dark:border-[#334155]">
              <span className="text-xs text-[#94a3b8]">
                {filtered.length} tenant{filtered.length !== 1 ? "s" : ""}
                {filtered.length !== TENANTS.length && <span className="text-[#2563eb] font-medium"> (filtered)</span>}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="size-7 flex items-center justify-center rounded-[6px] border border-[#e2e8f0] dark:border-[#334155] text-[#64748b] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft size={13} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`size-7 flex items-center justify-center rounded-[6px] text-xs font-medium transition-colors ${
                      p === page
                        ? "bg-[#2563eb] text-white"
                        : "text-[#64748b] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a]"
                    }`}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="size-7 flex items-center justify-center rounded-[6px] border border-[#e2e8f0] dark:border-[#334155] text-[#64748b] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
