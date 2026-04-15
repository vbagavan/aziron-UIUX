import { useState } from "react";
import {
  UserPlus, UserMinus, UserX, UserCheck, ShieldCheck,
  Search, MoreVertical, AlertCircle, Users,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { TENANTS, TENANT_USERS, SAAS_TIERS } from "@/data/adminData";

// ─── Constants ────────────────────────────────────────────────────────────────
// Tenant-admin perspective: scoped to Vanta Logistics (id = 3)
const MY_TENANT = TENANTS.find(t => t.id === 3);

const AVATAR_COLORS = [
  ["#3b82f6","#1d4ed8"],["#8b5cf6","#6d28d9"],["#ec4899","#be185d"],
  ["#f59e0b","#b45309"],["#10b981","#047857"],["#06b6d4","#0e7490"],
  ["#f97316","#c2410c"],["#6366f1","#4338ca"],["#84cc16","#4d7c0f"],
  ["#14b8a6","#0f766e"],
];

const STATUS_CFG = {
  Active:   { bg: "#dcfce7", text: "#16a34a" },
  Inactive: { bg: "#f1f5f9", text: "#64748b" },
  Invited:  { bg: "#fef9c3", text: "#ca8a04" },
};
const ROLE_CFG = {
  Admin:  { bg: "#2563eb", text: "#fff" },
  Member: { bg: "#334155", text: "#fff" },
};

function initials(name) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Seat bar ─────────────────────────────────────────────────────────────────
function SeatBar({ used, provisioned }) {
  const pct = Math.min(100, (used / provisioned) * 100);
  const barColor = pct >= 90 ? "#ef4444" : pct >= 75 ? "#f59e0b" : "#0ea5e9";
  return (
    <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">Seat Usage</p>
          <p className="text-xs text-[#94a3b8] mt-0.5">Active + Invited seats count toward your plan limit.</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold tabular-nums" style={{ color: pct >= 100 ? "#ef4444" : "#0f172a" }}>
            {used} <span className="text-sm font-normal text-[#64748b]">/ {provisioned}</span>
          </p>
          <p className="text-xs text-[#94a3b8]">{Math.max(0, provisioned - used)} seats available</p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-[#f1f5f9] dark:bg-[#334155] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      {pct >= 100 && (
        <p className="text-xs text-[#dc2626] mt-2 flex items-center gap-1.5">
          <AlertCircle size={12} /> All seats are in use. Contact your Aziron account manager to increase your seat count.
        </p>
      )}
      {pct >= 75 && pct < 100 && (
        <p className="text-xs text-[#d97706] mt-2 flex items-center gap-1.5">
          <AlertCircle size={12} /> You're nearing your seat limit. Consider upgrading your plan.
        </p>
      )}
    </div>
  );
}

// ─── Invite panel ─────────────────────────────────────────────────────────────
function InvitePanel({ onInvite, onCancel, seatsFull }) {
  const [email, setEmail] = useState("");
  const [role,  setRole]  = useState("Member");
  const [error, setError] = useState("");

  const submit = () => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim())      return setError("Email is required.");
    if (!re.test(email.trim())) return setError("Enter a valid email address.");
    onInvite(email.trim(), role, setError);
  };

  return (
    <div className="px-5 py-4 border-b border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a]">
      <p className="text-xs font-semibold text-[#0f172a] dark:text-[#f1f5f9] mb-3">Invite a team member</p>
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-[#475569] dark:text-[#94a3b8]">Work email</label>
          <input type="email" value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            placeholder="teammate@vantalog.co"
            className="h-8 px-3 text-xs rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#0f172a] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[#475569] dark:text-[#94a3b8]">Role</label>
          <select value={role} onChange={e => setRole(e.target.value)}
            className="h-8 px-2 text-xs rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#0f172a] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30">
            <option>Member</option>
            <option>Admin</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={submit} disabled={seatsFull}
            className="h-8 px-3 rounded-[8px] bg-[#2563eb] text-white text-xs font-medium hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Send Invite
          </button>
          <button onClick={onCancel}
            className="h-8 px-3 rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] text-xs font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-colors">
            Cancel
          </button>
        </div>
      </div>
      {seatsFull && (
        <p className="text-xs text-[#dc2626] mt-2 flex items-center gap-1.5">
          <AlertCircle size={11} /> No seats available. Contact your account manager to expand your plan.
        </p>
      )}
      {error && !seatsFull && (
        <p className="text-xs text-[#dc2626] mt-2 flex items-center gap-1.5">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ─── User row menu ────────────────────────────────────────────────────────────
function RowMenu({ user, onChangeRole, onToggleStatus, onRevoke, onClose }) {
  return (
    <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] shadow-lg z-20 py-1"
      onClick={e => e.stopPropagation()}>
      <button onClick={onChangeRole}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#475569] dark:text-[#94a3b8] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors">
        <ShieldCheck size={12} /> Change to {user.role === "Admin" ? "Member" : "Admin"}
      </button>
      {user.status !== "Invited" && (
        <button onClick={onToggleStatus}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#475569] dark:text-[#94a3b8] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors">
          {user.status === "Active" ? <UserX size={12} /> : <UserCheck size={12} />}
          {user.status === "Active" ? "Deactivate user" : "Reactivate user"}
        </button>
      )}
      <div className="border-t border-[#f1f5f9] dark:border-[#334155] my-1" />
      <button onClick={onRevoke}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#dc2626] hover:bg-[#fef2f2] dark:hover:bg-[#450a0a] transition-colors">
        <UserMinus size={12} /> Remove from team
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TenantUsersPage({ onNavigate }) {
  const tenant   = MY_TENANT;
  const tierDef  = SAAS_TIERS[tenant.tier];
  const provisioned = tenant.seats;

  const [users,       setUsers]       = useState(() => TENANT_USERS[tenant.id] ?? []);
  const [search,      setSearch]      = useState("");
  const [showInvite,  setShowInvite]  = useState(false);
  const [openMenuId,  setOpenMenuId]  = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");

  const seatsUsed = users.filter(u => u.status !== "Inactive").length;
  const seatsFull = seatsUsed >= provisioned;

  const handleInvite = (email, role, setError) => {
    if (users.find(u => u.email === email)) return setError("This email already has access.");
    const displayName = email.split("@")[0]
      .replace(/[._-]/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
    setUsers(prev => [...prev, {
      id: Date.now(), name: displayName, email,
      role, status: "Invited", lastActive: "—",
    }]);
    setShowInvite(false);
  };

  const changeRole   = (id) => setUsers(p => p.map(u => u.id === id ? { ...u, role: u.role === "Admin" ? "Member" : "Admin" } : u));
  const toggleStatus = (id) => setUsers(p => p.map(u => u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u));
  const revokeSeat   = (id) => setUsers(p => p.filter(u => u.id !== id));

  const STATUS_FILTERS = ["All", "Active", "Invited", "Inactive"];
  const pending = users.filter(u => u.status === "Invited").length;

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]"
      onClick={() => setOpenMenuId(null)}>
      <Sidebar activePage="tenant-users" onNavigate={onNavigate} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader onNavigate={onNavigate} />

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Page header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-[#0f172a] dark:text-[#f1f5f9]">User Management</h1>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-0.5">
                Manage team access for <span className="font-medium text-[#0f172a] dark:text-[#f1f5f9]">Vanta Logistics</span>
                {" "}· {tierDef?.label} plan · {tierDef?.seatRange}
              </p>
            </div>
            <button onClick={() => { setShowInvite(true); setOpenMenuId(null); }}
              disabled={seatsFull}
              className="flex items-center gap-1.5 h-9 px-4 rounded-[10px] bg-[#2563eb] text-white text-sm font-medium hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
              <UserPlus size={15} /> Invite User
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Users",    value: users.length,                                          color: "#2563eb" },
              { label: "Active",         value: users.filter(u => u.status === "Active").length,       color: "#16a34a" },
              { label: "Pending Invites",value: pending,                                               color: "#d97706" },
              { label: "Inactive",       value: users.filter(u => u.status === "Inactive").length,     color: "#94a3b8" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4 flex items-start gap-3">
                <div className="size-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                  <Users size={14} style={{ color }} />
                </div>
                <div>
                  <p className="text-xs text-[#64748b] dark:text-[#94a3b8] font-medium leading-none mb-1">{label}</p>
                  <p className="text-lg font-bold text-[#0f172a] dark:text-[#f1f5f9] leading-none">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Seat bar */}
          <SeatBar used={seatsUsed} provisioned={provisioned} />

          {/* Users table card */}
          <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-xl overflow-hidden">

            {/* Table header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f1f5f9] dark:border-[#334155] flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
                    className="h-8 pl-7 pr-3 text-xs rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] text-[#0f172a] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 w-52" />
                </div>
                {/* Status filters */}
                <div className="flex items-center gap-1">
                  {STATUS_FILTERS.map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`h-7 px-2.5 rounded-[6px] text-xs font-medium transition-colors ${
                        filterStatus === s
                          ? "bg-[#2563eb] text-white"
                          : "bg-[#f1f5f9] dark:bg-[#334155] text-[#475569] dark:text-[#94a3b8] hover:bg-[#e2e8f0] dark:hover:bg-[#475569]"
                      }`}>
                      {s}{s !== "All" && ` (${users.filter(u => u.status === s).length})`}
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-xs text-[#94a3b8]">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Invite panel */}
            {showInvite && (
              <InvitePanel
                onInvite={handleInvite}
                onCancel={() => setShowInvite(false)}
                seatsFull={seatsFull}
              />
            )}

            {/* Table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f1f5f9] dark:border-[#334155]">
                  {["User", "Role", "Status", "Last Active", ""].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <Users size={28} className="text-[#cbd5e1] mx-auto mb-2" />
                      <p className="text-sm text-[#94a3b8]">No users match your filters.</p>
                    </td>
                  </tr>
                ) : filtered.map(u => {
                  const sc = STATUS_CFG[u.status] ?? STATUS_CFG.Inactive;
                  const rc = ROLE_CFG[u.role]     ?? ROLE_CFG.Member;
                  const [av1, av2] = AVATAR_COLORS[u.id % AVATAR_COLORS.length];
                  return (
                    <tr key={u.id}
                      className="border-b border-[#f8fafc] dark:border-[#1e293b] last:border-0 hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] transition-colors"
                      onClick={() => setOpenMenuId(null)}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: `linear-gradient(135deg,${av1},${av2})` }}>
                            {initials(u.name)}
                          </div>
                          <div>
                            <p className="font-medium text-[#0f172a] dark:text-[#f1f5f9]">{u.name}</p>
                            <p className="text-xs text-[#94a3b8]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold"
                          style={{ background: rc.bg, color: rc.text }}>{u.role}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center h-5 px-2.5 rounded-full text-xs font-semibold"
                          style={{ background: sc.bg, color: sc.text }}>{u.status}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-[#64748b] dark:text-[#94a3b8]">{u.lastActive}</td>
                      <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                            className="size-8 rounded-[6px] flex items-center justify-center text-[#94a3b8] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] transition-colors">
                            <MoreVertical size={15} />
                          </button>
                          {openMenuId === u.id && (
                            <RowMenu
                              user={u}
                              onChangeRole={() => { changeRole(u.id); setOpenMenuId(null); }}
                              onToggleStatus={() => { toggleStatus(u.id); setOpenMenuId(null); }}
                              onRevoke={() => { revokeSeat(u.id); setOpenMenuId(null); }}
                              onClose={() => setOpenMenuId(null)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Info footer */}
          <p className="text-xs text-[#94a3b8] text-center pb-2">
            Invited users receive an email with a sign-in link. Their seat is held until they accept or are removed.
            To increase your seat count, contact <span className="text-[#2563eb]">support@aziron.com</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
