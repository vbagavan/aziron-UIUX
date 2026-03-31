import { useState, useRef, useEffect } from "react";
import {
  MoreVertical, Plus, Search, X, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, Settings, ShieldCheck, Users,
  UserX, UserCheck, Trash2, Eye, Check, Filter, Pencil,
  UserPlus, UserMinus,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ─── data ─────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  ["#3b82f6","#1d4ed8"],["#8b5cf6","#6d28d9"],["#ec4899","#be185d"],
  ["#f59e0b","#b45309"],["#10b981","#047857"],["#06b6d4","#0e7490"],
  ["#f97316","#c2410c"],["#6366f1","#4338ca"],["#84cc16","#4d7c0f"],
  ["#14b8a6","#0f766e"],
];

const INIT_USERS = [
  { id:0, name:"Jane Cooper",        email:"cooper@aziro.com",   role:"Admin",       groups:[1],    status:"Active",   lastLogin:"23 Feb 2025 12:00 PM", checked:true  },
  { id:1, name:"Wade Warren",        email:"wadew@aziro.com",    role:"Member",      groups:[2],    status:"Active",   lastLogin:"23 Feb 2025 12:00 PM", checked:true  },
  { id:2, name:"Kristin Watson",     email:"wkrstin@aziro.com",  role:"Super Admin", groups:[2],    status:"Active",   lastLogin:"23 Feb 2025 12:00 PM", checked:true  },
  { id:3, name:"Cameron Williamson", email:"wcameron@aziro.com", role:"Member",      groups:[2],    status:"Active",   lastLogin:"23 Feb 2025 12:00 PM", checked:true  },
  { id:4, name:"Ralph Edwards",      email:"redwards@aziro.com", role:"Member",      groups:[2],    status:"Active",   lastLogin:"23 Feb 2025 12:00 PM", checked:true  },
  { id:5, name:"Robert Fox",         email:"rfox@aziro.com",     role:"Member",      groups:[3],    status:"Active",   lastLogin:"21 Feb 2025 09:15 AM", checked:false },
  { id:6, name:"Esther Howard",      email:"ehoward@aziro.com",  role:"Admin",       groups:[1],    status:"Active",   lastLogin:"20 Feb 2025 03:45 PM", checked:false },
  { id:7, name:"Jenny Wilson",       email:"jwilson@aziro.com",  role:"Member",      groups:[2],    status:"Inactive", lastLogin:"15 Feb 2025 11:00 AM", checked:false },
  { id:8, name:"Savannah Nguyen",    email:"snguyen@aziro.com",  role:"Super Admin", groups:[1,2],  status:"Active",   lastLogin:"19 Feb 2025 08:30 AM", checked:false },
  { id:9, name:"Courtney Henry",     email:"chenry@aziro.com",   role:"Member",      groups:[3],    status:"Pending",  lastLogin:"18 Feb 2025 02:00 PM", checked:false },
];

const ALL_GROUPS = [
  { id:1, name:"Finance Team",  members:12, desc:"Financial operations and reporting" },
  { id:2, name:"AI Dev Team",   members:8,  desc:"AI product development team"        },
  { id:3, name:"Support Team",  members:15, desc:"Customer support and success"       },
];

const ROLES   = ["Super Admin","Admin","Member"];
const STATUSES = ["Active","Inactive","Pending"];

// Solid-fill role badges (Aziron design system)
const ROLE_CFG = {
  "Admin":       { bg:"#2563eb", text:"#ffffff" },
  "Member":      { bg:"#334155", text:"#ffffff" },
  "Super Admin": { bg:"#7c3aed", text:"#ffffff" },
};

// Status: just colored text + dot, no pill bg (Aziron style)
const STATUS_CFG = {
  Active:   { dot:"#16a34a", text:"#16a34a" },
  Inactive: { dot:"#94a3b8", text:"#64748b" },
  Pending:  { dot:"#f59e0b", text:"#d97706" },
};

const ALL_COLS = [
  { key:"name",      label:"Name"       },
  { key:"email",     label:"Email"      },
  { key:"role",      label:"Role"       },
  { key:"groups",    label:"Groups"     },
  { key:"status",    label:"Status"     },
  { key:"lastLogin", label:"Last Login" },
];

function initials(name){ return name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2); }
function groupNames(ids){ return ids.map(id=>ALL_GROUPS.find(g=>g.id===id)?.name).filter(Boolean); }
function avatarGrad(id){ const [f,t]=AVATAR_COLORS[id%AVATAR_COLORS.length]; return `linear-gradient(135deg,${f},${t})`; }

// ─── Popover ──────────────────────────────────────────────────────────────────

function Popover({ open, onClose, anchor, width="w-48", children }){
  const ref = useRef(null);
  useEffect(()=>{
    if(!open) return;
    const h = e => {
      if(ref.current && !ref.current.contains(e.target) && anchor?.current && !anchor.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[open,onClose,anchor]);
  if(!open) return null;
  return(
    <div ref={ref} className={`absolute z-50 top-full mt-1 ${width} bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden`}>
      {children}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }){
  useEffect(()=>{ const t=setTimeout(onDone,2800); return()=>clearTimeout(t); },[onDone]);
  return(
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-4 py-2.5 bg-[#0f172a] dark:bg-[#f1f5f9] text-white dark:text-[#0f172a] rounded-[8px] shadow-xl text-sm font-medium">
      <Check size={14} className="text-[#22c55e] flex-shrink-0" />{message}
    </div>
  );
}

// ─── SortIcon ─────────────────────────────────────────────────────────────────

function SortIcon({ sortKey, col, sortDir }){
  if(sortKey!==col) return <ChevronUp size={11} className="text-[#cbd5e1] dark:text-[#475569]"/>;
  return sortDir==="asc"
    ? <ChevronUp   size={11} className="text-[#2563eb]"/>
    : <ChevronDown size={11} className="text-[#2563eb]"/>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function UsersListPage({ onNavigate, onViewUser }){
  const [rows,      setRows]      = useState(INIT_USERS);
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const [rpp,       setRpp]       = useState(10);
  const [sortKey,   setSortKey]   = useState("lastLogin");
  const [sortDir,   setSortDir]   = useState("asc");
  const [visCols,   setVisCols]   = useState(new Set(ALL_COLS.map(c=>c.key)));
  const [toast,     setToast]     = useState(null);

  // filters
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterRole,   setFilterRole]   = useState(null);
  const [filterGroup,  setFilterGroup]  = useState(null);

  // popovers (action bar)
  const [showRolePop,   setShowRolePop]   = useState(false);
  const [showColPop,    setShowColPop]    = useState(false);
  // filter popovers
  const [showStatusFilt, setShowStatusFilt] = useState(false);
  const [showRoleFilt,   setShowRoleFilt]   = useState(false);
  const [showGroupFilt,  setShowGroupFilt]  = useState(false);

  // per-row menu
  const [rowMenu,   setRowMenu]   = useState(null);
  const [rowSubMenu, setRowSubMenu] = useState(null); // "role" | "add-group" | null

  // modals
  const [deactivateModal, setDeactivateModal] = useState(false);
  const [activateModal,   setActivateModal]   = useState(false);
  const [removeModal,     setRemoveModal]     = useState(null);
  const [editModal,       setEditModal]       = useState(null);
  const [addGroupModal,   setAddGroupModal]   = useState(null); // { count, groupChecks }

  // refs
  const roleRef    = useRef(null);
  const colRef     = useRef(null);
  const statusFRef = useRef(null);
  const roleFRef   = useRef(null);
  const groupFRef  = useRef(null);

  // ── derived ────────────────────────────────────────────────────────────────

  const filtered = rows.filter(u=>{
    if(search      && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if(filterStatus && u.status !== filterStatus) return false;
    if(filterRole   && u.role   !== filterRole)   return false;
    if(filterGroup  && !u.groups.includes(filterGroup)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a,b)=>{
    const v = sortDir==="asc"?1:-1;
    if(sortKey==="email")     return a.email.localeCompare(b.email)*v;
    if(sortKey==="lastLogin") return a.lastLogin.localeCompare(b.lastLogin)*v;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length/rpp));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = sorted.slice((safePage-1)*rpp, safePage*rpp);
  const selected   = filtered.filter(u=>u.checked);
  const selActive  = selected.filter(u=>u.status==="Active");
  const selInactive= selected.filter(u=>u.status!=="Active");
  const allChecked = filtered.length>0 && filtered.every(u=>u.checked);

  const activeFilters = [
    filterStatus && { key:"status", label:`Status: ${filterStatus}`, clear:()=>setFilterStatus(null) },
    filterRole   && { key:"role",   label:`Role: ${filterRole}`,     clear:()=>setFilterRole(null)   },
    filterGroup  && { key:"group",  label:`Group: ${ALL_GROUPS.find(g=>g.id===filterGroup)?.name}`, clear:()=>setFilterGroup(null) },
  ].filter(Boolean);

  // ── helpers ────────────────────────────────────────────────────────────────

  const notify = msg => setToast(msg);

  function closeAllPops(){
    setShowRolePop(false); setShowColPop(false);
    setShowStatusFilt(false); setShowRoleFilt(false); setShowGroupFilt(false);
  }

  function toggleSort(key){
    if(sortKey===key) setSortDir(d=>d==="asc"?"desc":"asc");
    else{ setSortKey(key); setSortDir("asc"); }
  }

  function toggleRow(id){ setRows(prev=>prev.map(u=>u.id===id?{...u,checked:!u.checked}:u)); }
  function toggleAll(){
    const ids=new Set(filtered.map(u=>u.id));
    setRows(prev=>prev.map(u=>ids.has(u.id)?{...u,checked:!allChecked}:u));
  }
  function clearSelection(){ setRows(prev=>prev.map(u=>({...u,checked:false}))); }

  function applyBulkRole(r){
    const ids=new Set(selected.map(u=>u.id));
    setRows(prev=>prev.map(u=>ids.has(u.id)?{...u,role:r}:u));
    setShowRolePop(false);
    notify(`Role changed to "${r}" for ${ids.size} user${ids.size>1?"s":""}`);
  }

  function openAddGroupModal(){
    const checks = {};
    ALL_GROUPS.forEach(g=>{ checks[g.id]=false; });
    setAddGroupModal({ count: selected.length, groupChecks: checks });
  }

  function confirmAddToGroup(){
    const gids = Object.entries(addGroupModal.groupChecks).filter(([,v])=>v).map(([k])=>Number(k));
    if(gids.length===0){ setAddGroupModal(null); return; }
    const ids=new Set(selected.map(u=>u.id));
    setRows(prev=>prev.map(u=>{
      if(!ids.has(u.id)) return u;
      const newGroups=[...u.groups];
      gids.forEach(gid=>{ if(!newGroups.includes(gid)) newGroups.push(gid); });
      return {...u,groups:newGroups};
    }));
    setAddGroupModal(null);
    notify(`Added ${ids.size} user${ids.size>1?"s":""} to ${gids.length} group${gids.length>1?"s":""}`);
  }

  function confirmDeactivate(){
    const ids=new Set(selected.map(u=>u.id));
    setRows(prev=>prev.map(u=>ids.has(u.id)?{...u,status:"Inactive",checked:false}:u));
    setDeactivateModal(false);
    notify(`${ids.size} user${ids.size>1?"s":""} deactivated`);
  }

  function confirmActivate(){
    const ids=new Set(selected.map(u=>u.id));
    setRows(prev=>prev.map(u=>ids.has(u.id)?{...u,status:"Active",checked:false}:u));
    setActivateModal(false);
    notify(`${ids.size} user${ids.size>1?"s":""} activated`);
  }

  function rowToggleStatus(userId){
    const user=rows.find(u=>u.id===userId);
    const next=user.status==="Active"?"Inactive":"Active";
    setRows(prev=>prev.map(u=>u.id===userId?{...u,status:next}:u));
    setRowMenu(null); setRowSubMenu(null);
    notify(`${user.name} ${next==="Active"?"activated":"deactivated"}`);
  }

  function rowChangeRole(userId, r){
    setRows(prev=>prev.map(u=>u.id===userId?{...u,role:r}:u));
    setRowMenu(null); setRowSubMenu(null);
    notify(`Role changed to "${r}"`);
  }

  function rowAddToGroup(userId, gid){
    setRows(prev=>prev.map(u=>u.id===userId&&!u.groups.includes(gid)?{...u,groups:[...u.groups,gid]}:u));
    setRowMenu(null); setRowSubMenu(null);
    notify(`Added to "${ALL_GROUPS.find(g=>g.id===gid)?.name}"`);
  }

  function confirmRemove(userId){
    setRows(prev=>prev.filter(u=>u.id!==userId));
    setRemoveModal(null);
    notify("User removed");
  }

  function toggleCol(key){
    setVisCols(prev=>{
      const next=new Set(prev);
      if(next.has(key)){ if(next.size===1) return prev; next.delete(key); } else next.add(key);
      return next;
    });
  }

  function saveEdit(){
    const { user, draft } = editModal;
    setRows(prev=>prev.map(u=>u.id===user.id?{...u,...draft}:u));
    setEditModal(null);
    notify(`${draft.name || user.name} updated`);
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return(
    <>
      {rowMenu && <div className="fixed inset-0 z-30" onClick={()=>{ setRowMenu(null); setRowSubMenu(null); }}/>}

      <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
        <Sidebar activePage="users-list" onNavigate={onNavigate}/>

        <div className="flex flex-col flex-1 min-w-0">
          <AppHeader onNavigate={onNavigate}>
            <nav className="flex items-center gap-1.5 text-sm ml-1">
              <Button variant="ghost" size="sm" onClick={()=>onNavigate("users")} className="h-auto px-0 text-[#64748b] dark:text-[#94a3b8] hover:bg-transparent hover:text-[#0f172a] dark:hover:bg-transparent dark:hover:text-[#f1f5f9] transition-colors">
                User Management
              </Button>
              <ChevronRight size={13} className="text-[#cbd5e1] dark:text-[#475569]"/>
              <span className="text-[#0f172a] dark:text-[#f1f5f9] font-medium">Users</span>
            </nav>
          </AppHeader>

          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
            <div className="px-6 py-5 flex flex-col gap-4 max-w-[1400px] mx-auto flex-1 min-h-0">

              {/* heading */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-[22px] font-semibold text-[#0f172a] dark:text-[#f1f5f9] leading-8 tracking-[-0.4px]">Users</h1>
                  <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-0.5">Manage user accounts and their access permissions.</p>
                </div>
                <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white gap-1.5 h-9 px-4 text-sm font-medium rounded-[7px] shadow-sm">
                  <Plus size={15}/> Invite User
                </Button>
              </div>

              {/* ── toolbar row ── */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="flex items-center gap-2 h-9 px-3 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[7px] w-64 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <Search size={14} className="text-[#94a3b8] flex-shrink-0"/>
                  <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
                    placeholder="Search by name or email"
                    className="flex-1 text-sm text-[#0f172a] dark:text-[#f1f5f9] placeholder:text-[#94a3b8] outline-none bg-transparent"/>
                  {search && (
                    <Button variant="ghost" size="icon-xs" onClick={()=>setSearch("")} className="size-5 rounded-full text-[#94a3b8] hover:bg-transparent hover:text-[#475569]">
                      <X size={13} />
                    </Button>
                  )}
                </div>

                {/* Status filter */}
                <div className="relative">
                  <Button ref={statusFRef} variant="outline" onClick={()=>{ closeAllPops(); setShowStatusFilt(v=>!v); }}
                    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-[7px] border text-sm font-medium transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${filterStatus?"border-[#2563eb] bg-[#eff6ff] text-[#2563eb]":"border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155]"}`}>
                    <Filter size={12}/> Status {filterStatus && <span className="font-semibold">: {filterStatus}</span>}
                    <ChevronDown size={11} className={`text-[#94a3b8] transition-transform ${showStatusFilt?"rotate-180":""}`}/>
                  </Button>
                  <Popover open={showStatusFilt} onClose={()=>setShowStatusFilt(false)} anchor={statusFRef} width="w-44">
                    <div className="py-1">
                      <Button type="button" variant="ghost" size="sm" onClick={()=>{setFilterStatus(null);setShowStatusFilt(false);setPage(1);}}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors ${!filterStatus?"bg-[#eff6ff] dark:bg-[#1e3a8a]/30 text-[#2563eb]":"text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155]"}`}>
                        All Statuses {!filterStatus && <Check size={13} className="text-[#2563eb]"/>}
                      </Button>
                      {STATUSES.map(s=>{
                        const cfg=STATUS_CFG[s]; const active=filterStatus===s;
                        return(
                          <Button key={s} type="button" variant="ghost" size="sm" onClick={()=>{setFilterStatus(s);setShowStatusFilt(false);setPage(1);}}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors ${active?"bg-[#eff6ff] dark:bg-[#1e3a8a]/30":"hover:bg-[#f8fafc] dark:hover:bg-[#334155]"}`}>
                            <span className="flex items-center gap-2">
                              <span className="size-2 rounded-full flex-shrink-0" style={{backgroundColor:cfg.dot}}/>
                              <span className={active?"text-[#2563eb] font-semibold":"text-[#374151] dark:text-[#cbd5e1]"}>{s}</span>
                            </span>
                            {active && <Check size={13} className="text-[#2563eb]"/>}
                          </Button>
                        );
                      })}
                    </div>
                  </Popover>
                </div>

                {/* Role filter */}
                <div className="relative">
                  <Button ref={roleFRef} variant="outline" onClick={()=>{ closeAllPops(); setShowRoleFilt(v=>!v); }}
                    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-[7px] border text-sm font-medium transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${filterRole?"border-[#2563eb] bg-[#eff6ff] text-[#2563eb]":"border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155]"}`}>
                    <ShieldCheck size={12}/> Role {filterRole && <span className="font-semibold">: {filterRole}</span>}
                    <ChevronDown size={11} className={`text-[#94a3b8] transition-transform ${showRoleFilt?"rotate-180":""}`}/>
                  </Button>
                  <Popover open={showRoleFilt} onClose={()=>setShowRoleFilt(false)} anchor={roleFRef} width="w-44">
                    <div className="py-1">
                      <Button type="button" variant="ghost" size="sm" onClick={()=>{setFilterRole(null);setShowRoleFilt(false);setPage(1);}}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors ${!filterRole?"bg-[#eff6ff] dark:bg-[#1e3a8a]/30 text-[#2563eb]":"text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155]"}`}>
                        All Roles {!filterRole && <Check size={13} className="text-[#2563eb]"/>}
                      </Button>
                      {ROLES.map(r=>{
                        const cfg=ROLE_CFG[r]; const active=filterRole===r;
                        return(
                          <Button key={r} type="button" variant="ghost" size="sm" onClick={()=>{setFilterRole(r);setShowRoleFilt(false);setPage(1);}}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors ${active?"bg-[#eff6ff] dark:bg-[#1e3a8a]/30":"hover:bg-[#f8fafc] dark:hover:bg-[#334155]"}`}>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{color:cfg.text,backgroundColor:cfg.bg}}>{r}</span>
                            {active && <Check size={13} className="text-[#2563eb]"/>}
                          </Button>
                        );
                      })}
                    </div>
                  </Popover>
                </div>

                {/* Group filter */}
                <div className="relative">
                  <Button ref={groupFRef} variant="outline" onClick={()=>{ closeAllPops(); setShowGroupFilt(v=>!v); }}
                    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-[7px] border text-sm font-medium transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${filterGroup?"border-[#2563eb] bg-[#eff6ff] text-[#2563eb]":"border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155]"}`}>
                    <Users size={12}/> Group {filterGroup && <span className="font-semibold">: {ALL_GROUPS.find(g=>g.id===filterGroup)?.name}</span>}
                    <ChevronDown size={11} className={`text-[#94a3b8] transition-transform ${showGroupFilt?"rotate-180":""}`}/>
                  </Button>
                  <Popover open={showGroupFilt} onClose={()=>setShowGroupFilt(false)} anchor={groupFRef} width="w-48">
                    <div className="py-1">
                      <Button type="button" variant="ghost" size="sm" onClick={()=>{setFilterGroup(null);setShowGroupFilt(false);setPage(1);}}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors ${!filterGroup?"bg-[#eff6ff] dark:bg-[#1e3a8a]/30 text-[#2563eb]":"text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155]"}`}>
                        All Groups {!filterGroup && <Check size={13} className="text-[#2563eb]"/>}
                      </Button>
                      {ALL_GROUPS.map(g=>{
                        const active=filterGroup===g.id;
                        return(
                          <Button key={g.id} type="button" variant="ghost" size="sm" onClick={()=>{setFilterGroup(g.id);setShowGroupFilt(false);setPage(1);}}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors ${active?"bg-[#eff6ff] dark:bg-[#1e3a8a]/30":"hover:bg-[#f8fafc] dark:hover:bg-[#334155]"}`}>
                            <span className={`flex items-center gap-2 ${active?"text-[#2563eb] font-semibold":"text-[#374151] dark:text-[#cbd5e1]"}`}>
                              <span className="size-2 rounded-full bg-[#3b82f6] flex-shrink-0"/>
                              {g.name}
                            </span>
                            {active && <Check size={13} className="text-[#2563eb]"/>}
                          </Button>
                        );
                      })}
                    </div>
                  </Popover>
                </div>

                {/* Columns toggle */}
                <div className="relative ml-auto">
                  <Button ref={colRef} variant="outline" onClick={()=>{ closeAllPops(); setShowColPop(v=>!v); }}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[7px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-sm font-medium text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <Settings size={13}/> Columns
                    <ChevronDown size={12} className={`text-[#94a3b8] transition-transform ${showColPop?"rotate-180":""}`}/>
                  </Button>
                  <Popover open={showColPop} onClose={()=>setShowColPop(false)} anchor={colRef} width="w-44">
                    <div className="py-1">
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">Toggle Columns</p>
                      {ALL_COLS.map(col=>(
                        <Button key={col.key} type="button" variant="ghost" size="sm" onClick={()=>toggleCol(col.key)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors">
                          <span className={`size-4 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${visCols.has(col.key)?"bg-[#2563eb] border-[#2563eb]":"border-[#cbd5e1] dark:border-[#475569]"}`}>
                            {visCols.has(col.key) && <Check size={10} className="text-white"/>}
                          </span>
                          {col.label}
                        </Button>
                      ))}
                    </div>
                  </Popover>
                </div>
              </div>

              {/* active filter chips */}
              {activeFilters.length>0 && (
                <div className="flex items-center gap-2 flex-wrap -mt-1">
                  <span className="text-xs text-[#94a3b8]">Filters:</span>
                  {activeFilters.map(f=>(
                    <span key={f.key} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-[#eff6ff] dark:bg-[#1e3a8a]/30 text-[#2563eb] border border-[#bfdbfe] dark:border-[#1e3a8a]">
                      {f.label}
                      <Button variant="ghost" size="icon-xs" onClick={f.clear} className="ml-0.5 size-4 rounded-full hover:bg-transparent hover:text-[#1d4ed8]"><X size={11}/></Button>
                    </span>
                  ))}
                  <Button variant="ghost" size="sm" onClick={()=>{setFilterStatus(null);setFilterRole(null);setFilterGroup(null);setPage(1);}}
                    className="text-xs text-[#64748b] hover:text-[#0f172a] dark:hover:text-[#f1f5f9] underline underline-offset-2 transition-colors">
                    Clear all
                  </Button>
                </div>
              )}

              {/* ── table card ── */}
              <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.05)] flex flex-col flex-1 min-h-0">

                {/* ── Aziron action bar (shown inside table card, above thead) ── */}
                {selected.length>0 && (
                  <div className="flex items-center gap-1 px-4 py-2.5 border-b border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b]">
                    <span className="text-sm text-[#64748b] dark:text-[#94a3b8] mr-2">{selected.length} selected</span>

                    {/* Change Role */}
                    <div className="relative">
                      <Button ref={roleRef} variant="outline" size="sm" onClick={()=>{ closeAllPops(); setShowRolePop(v=>!v); }}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border border-[#e2e8f0] dark:border-[#334155] text-sm font-medium text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors">
                        <ShieldCheck size={13}/> Change Role
                        <ChevronDown size={11} className={`text-[#94a3b8] transition-transform ${showRolePop?"rotate-180":""}`}/>
                      </Button>
                      <Popover open={showRolePop} onClose={()=>setShowRolePop(false)} anchor={roleRef} width="w-44">
                        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">Select Role</p>
                        {ROLES.map(r=>{
                          const cfg=ROLE_CFG[r];
                          return(
                            <Button key={r} type="button" variant="ghost" size="sm" onClick={()=>applyBulkRole(r)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{color:cfg.text,backgroundColor:cfg.bg}}>{r}</span>
                            </Button>
                          );
                        })}
                      </Popover>
                    </div>

                    {/* Add to Group */}
                    <Button variant="outline" size="sm" onClick={openAddGroupModal}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border border-[#e2e8f0] dark:border-[#334155] text-sm font-medium text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors">
                      <UserPlus size={13}/> Add to Group
                    </Button>

                    {/* Deactivate */}
                    {selActive.length>0 && (
                      <Button variant="outline" size="sm" onClick={()=>setDeactivateModal(true)}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border border-[#e2e8f0] dark:border-[#334155] text-sm font-medium text-[#dc2626] hover:bg-[#fef2f2] dark:hover:bg-[#450a0a] transition-colors">
                        <UserX size={13}/> Deactivate
                      </Button>
                    )}

                    {/* Activate */}
                    {selInactive.length>0 && (
                      <Button variant="outline" size="sm" onClick={()=>setActivateModal(true)}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border border-[#e2e8f0] dark:border-[#334155] text-sm font-medium text-[#16a34a] hover:bg-[#f0fdf4] dark:hover:bg-[#052e16] transition-colors">
                        <UserCheck size={13}/> Activate
                      </Button>
                    )}

                    {/* Clear selection */}
                    <Button variant="outline" size="sm" onClick={clearSelection}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border border-[#e2e8f0] dark:border-[#334155] text-sm font-medium text-[#64748b] dark:text-[#94a3b8] hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors ml-auto">
                      <X size={13}/> Clear Selection
                    </Button>
                  </div>
                )}

                <div className="flex-1 min-h-0 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a]/40">
                      <th className="w-10 px-4 py-3">
                        <input type="checkbox" checked={allChecked} onChange={toggleAll}
                          className="rounded accent-[#2563eb] cursor-pointer size-[15px]"/>
                      </th>
                      {visCols.has("name")      && <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-[0.05em]">Name</th>}
                      {visCols.has("email")     && <th className="px-4 py-3 text-left"><Button variant="ghost" size="sm" onClick={()=>toggleSort("email")} className="inline-flex h-auto px-0 text-xs font-semibold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-[0.05em] hover:bg-transparent hover:text-[#0f172a] dark:hover:bg-transparent dark:hover:text-[#f1f5f9]">Email <SortIcon sortKey={sortKey} col="email" sortDir={sortDir}/></Button></th>}
                      {visCols.has("role")      && <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-[0.05em]">Role</th>}
                      {visCols.has("groups")    && <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-[0.05em]">Groups</th>}
                      {visCols.has("status")    && <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-[0.05em]">Status</th>}
                      {visCols.has("lastLogin") && <th className="px-4 py-3 text-left"><Button variant="ghost" size="sm" onClick={()=>toggleSort("lastLogin")} className="inline-flex h-auto px-0 text-xs font-semibold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-[0.05em] hover:bg-transparent hover:text-[#0f172a] dark:hover:bg-transparent dark:hover:text-[#f1f5f9]">Last Login <SortIcon sortKey={sortKey} col="lastLogin" sortDir={sortDir}/></Button></th>}
                      <th className="w-10 px-4 py-3"/>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.length>0 ? pageRows.map((user)=>{
                      const roleCfg   = ROLE_CFG[user.role]??ROLE_CFG["Member"];
                      const statusCfg = STATUS_CFG[user.status]??STATUS_CFG["Active"];
                      const names     = groupNames(user.groups);
                      return(
                        <tr key={user.id}
                          className={`border-b last:border-0 border-[#f1f5f9] dark:border-[#334155] transition-colors cursor-pointer
                            ${user.checked
                              ?"bg-[#eff6ff] dark:bg-[#1e3a8a]/20"
                              :"hover:bg-[#f8fafc] dark:hover:bg-[#0f172a]/30"}`}
                          onClick={()=>onViewUser&&onViewUser(user)}
                        >
                          <td className="px-4 py-3.5" onClick={e=>e.stopPropagation()}>
                            <input type="checkbox" checked={user.checked} onChange={()=>toggleRow(user.id)}
                              className="rounded accent-[#2563eb] cursor-pointer size-[15px]"/>
                          </td>

                          {visCols.has("name") && (
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                                  style={{background:avatarGrad(user.id)}}>
                                  {initials(user.name)}
                                </div>
                                <span className="font-medium text-[#0f172a] dark:text-[#f1f5f9] whitespace-nowrap">{user.name}</span>
                              </div>
                            </td>
                          )}
                          {visCols.has("email") && <td className="px-4 py-3.5 text-[#64748b] dark:text-[#94a3b8] whitespace-nowrap">{user.email}</td>}
                          {visCols.has("role") && (
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                                style={{color:roleCfg.text,backgroundColor:roleCfg.bg}}>{user.role}</span>
                            </td>
                          )}
                          {visCols.has("groups") && (
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1 flex-wrap">
                                {names.slice(0,1).map((n,i)=>(
                                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-xs font-medium bg-[#f0f9ff] dark:bg-[#0c4a6e] text-[#0369a1] dark:text-[#38bdf8] border border-[#bae6fd] dark:border-[#0369a1]">{n}</span>
                                ))}
                                {names.length>1 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-xs font-medium border bg-[#f1f5f9] dark:bg-[#334155] text-[#64748b] dark:text-[#94a3b8] border-[#e2e8f0] dark:border-[#475569]">+{names.length-1}</span>
                                )}
                                {names.length===0 && <span className="text-[#94a3b8] text-xs">—</span>}
                              </div>
                            </td>
                          )}
                          {visCols.has("status") && (
                            <td className="px-4 py-3.5">
                              {/* Aziron style: plain colored text with dot, no pill background */}
                              <span className="inline-flex items-center gap-1.5 text-sm font-medium"
                                style={{color:statusCfg.text}}>
                                <span className="size-1.5 rounded-full flex-shrink-0" style={{backgroundColor:statusCfg.dot}}/>
                                {user.status}
                              </span>
                            </td>
                          )}
                          {visCols.has("lastLogin") && <td className="px-4 py-3.5 text-[#64748b] dark:text-[#94a3b8] text-xs whitespace-nowrap">{user.lastLogin}</td>}

                          {/* row context menu */}
                          <td className="px-4 py-3.5 relative" onClick={e=>e.stopPropagation()}>
                            <button
                              onClick={e=>{
                                e.stopPropagation();
                                const rect=e.currentTarget.getBoundingClientRect();
                                setRowMenu(prev=>prev?.id===user.id?null:{id:user.id,top:rect.bottom+4,right:window.innerWidth-rect.right});
                                setRowSubMenu(null);
                              }}
                              className="flex items-center justify-center size-7 rounded-[5px] text-[#94a3b8] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] transition-colors">
                              <MoreVertical size={14}/>
                            </button>

                            {rowMenu?.id===user.id && (
                              <div
                                className="fixed z-50 w-52 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-visible py-1"
                                style={{top:rowMenu.top,right:rowMenu.right}}
                                onClick={e=>e.stopPropagation()}>

                                {/* View Profile */}
                                <button onClick={()=>{onViewUser&&onViewUser(user);setRowMenu(null);}}
                                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors">
                                  <Eye size={14} className="text-[#94a3b8]"/> View Profile
                                </button>

                                {/* Edit User */}
                                <button onClick={()=>{setEditModal({user,draft:{name:user.name,email:user.email,role:user.role,status:user.status}});setRowMenu(null);}}
                                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors">
                                  <Pencil size={14} className="text-[#94a3b8]"/> Edit User
                                </button>

                                <div className="h-px bg-[#f1f5f9] dark:bg-[#334155] my-1 mx-2"/>

                                {/* Change Role — inline flyout */}
                                <div className="relative">
                                  <button onClick={()=>setRowSubMenu(v=>v==="role"?null:"role")}
                                    className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 text-sm text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors">
                                    <span className="flex items-center gap-2.5"><ShieldCheck size={14} className="text-[#94a3b8]"/> Change Role</span>
                                    <ChevronRight size={12} className="text-[#94a3b8]"/>
                                  </button>
                                  {rowSubMenu==="role" && (
                                    <div className="absolute left-full top-0 ml-1 w-40 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-1 z-10">
                                      {ROLES.map(r=>{
                                        const cfg=ROLE_CFG[r]; const active=user.role===r;
                                        return(
                                          <button key={r} onClick={()=>rowChangeRole(user.id,r)}
                                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors ${active?"bg-[#eff6ff] dark:bg-[#1e3a8a]/30":"hover:bg-[#f8fafc] dark:hover:bg-[#334155] text-[#374151] dark:text-[#cbd5e1]"}`}>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                                              style={{color:cfg.text,backgroundColor:cfg.bg}}>{r}</span>
                                            {active && <Check size={12} className="text-[#2563eb]"/>}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                {/* Add to Group */}
                                <div className="relative">
                                  <button onClick={()=>setRowSubMenu(v=>v==="add-group"?null:"add-group")}
                                    className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 text-sm text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors">
                                    <span className="flex items-center gap-2.5"><UserPlus size={14} className="text-[#94a3b8]"/> Add to Group</span>
                                    <ChevronRight size={12} className="text-[#94a3b8]"/>
                                  </button>
                                  {rowSubMenu==="add-group" && (
                                    <div className="absolute left-full top-0 ml-1 w-44 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-1 overflow-hidden z-10">
                                      {ALL_GROUPS.map(g=>{
                                        const has=user.groups.includes(g.id);
                                        return(
                                          <button key={g.id} onClick={()=>!has&&rowAddToGroup(user.id,g.id)}
                                            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors ${has?"opacity-40 cursor-not-allowed text-[#374151] dark:text-[#cbd5e1]":"hover:bg-[#f8fafc] dark:hover:bg-[#334155] text-[#374151] dark:text-[#cbd5e1]"}`}>
                                            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#3b82f6]"/>{g.name}</span>
                                            {has && <Check size={12} className="text-[#94a3b8]"/>}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                <div className="h-px bg-[#f1f5f9] dark:bg-[#334155] my-1 mx-2"/>

                                {/* Deactivate / Activate */}
                                <button onClick={()=>rowToggleStatus(user.id)}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                                    user.status==="Active"
                                      ?"text-[#dc2626] dark:text-[#fca5a5] hover:bg-[#fef2f2] dark:hover:bg-[#450a0a]"
                                      :"text-[#16a34a] dark:text-[#86efac] hover:bg-[#f0fdf4] dark:hover:bg-[#052e16]"}`}>
                                  {user.status==="Active"?<><UserX size={14}/> Deactivate</>:<><UserCheck size={14}/> Activate</>}
                                </button>

                                {/* Remove User */}
                                <button onClick={()=>{setRemoveModal({user});setRowMenu(null);}}
                                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#dc2626] dark:text-[#fca5a5] hover:bg-[#fef2f2] dark:hover:bg-[#450a0a] transition-colors">
                                  <Trash2 size={14}/> Remove User
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="10">
                          <div className="flex flex-col items-center gap-3 py-16 px-4">
                            <div className="size-12 rounded-full bg-[#f1f5f9] dark:bg-[#334155] flex items-center justify-center">
                              <Users size={22} className="text-[#94a3b8]"/>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-[#374151] dark:text-[#cbd5e1]">No users found</p>
                              <p className="text-xs text-[#94a3b8] mt-1">
                                {search||filterStatus||filterRole||filterGroup
                                  ?"Try adjusting your search or filters"
                                  :"No users have been added yet"}
                              </p>
                            </div>
                            {(search||filterStatus||filterRole||filterGroup) && (
                              <Button variant="ghost" size="sm" onClick={()=>{setSearch("");setFilterStatus(null);setFilterRole(null);setFilterGroup(null);}}
                                className="text-xs text-[#2563eb] hover:underline font-medium">
                                Clear all filters
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>

              {/* ── pagination ── */}
              <div className="flex items-center justify-between text-xs text-[#64748b] dark:text-[#94a3b8] flex-wrap gap-3">
                <span>{selected.length} of {filtered.length} row(s) selected.</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <select value={rpp} onChange={e=>{setRpp(Number(e.target.value));setPage(1);}}
                      className="h-7 px-2 rounded-[5px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#374151] dark:text-[#cbd5e1] text-xs outline-none cursor-pointer">
                      {[5,10,20,50].map(n=><option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <span className="text-[#374151] dark:text-[#cbd5e1] font-medium">Page {safePage} of {totalPages}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon-sm" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={safePage===1}
                      className="size-7 flex items-center justify-center rounded-[5px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft size={13}/>
                    </Button>
                    <Button variant="outline" size="icon-sm" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={safePage===totalPages}
                      className="size-7 flex items-center justify-center rounded-[5px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronRight size={13}/>
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onDone={()=>setToast(null)}/>}

      {/* ── Add to Group Modal (Aziron style) ─────────────────────────────── */}
      <Dialog open={!!addGroupModal} onOpenChange={()=>setAddGroupModal(null)}>
        {addGroupModal && (
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                Add {addGroupModal.count} User{addGroupModal.count>1?"s":""} to Group
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-[#64748b] dark:text-[#94a3b8] -mt-1">Select one or more groups to add the selected users to.</p>

            <div className="flex flex-col gap-2">
              {ALL_GROUPS.map(g=>{
                const checked=addGroupModal.groupChecks[g.id];
                return(
                  <label key={g.id} className={`flex items-start gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors ${checked?"border-[#2563eb] bg-[#eff6ff] dark:bg-[#1e3a8a]/20":"border-[#e2e8f0] dark:border-[#334155] hover:bg-[#f8fafc] dark:hover:bg-[#334155]"}`}>
                    <input type="checkbox" checked={checked}
                      onChange={()=>setAddGroupModal(prev=>({...prev,groupChecks:{...prev.groupChecks,[g.id]:!prev.groupChecks[g.id]}}))}
                      className="mt-0.5 rounded accent-[#2563eb] cursor-pointer size-[15px] flex-shrink-0"/>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0f172a] dark:text-[#f1f5f9]">{g.name}</p>
                      <p className="text-xs text-[#94a3b8] mt-0.5">{g.members} members · {g.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={()=>setAddGroupModal(null)}>Cancel</Button>
              <Button onClick={confirmAddToGroup}
                disabled={!Object.values(addGroupModal.groupChecks).some(Boolean)}
                className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white gap-1.5">
                <UserPlus size={14}/> Add to Group
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* ── Bulk Deactivate ─────────────────────────────────────────────────── */}
      <Dialog open={deactivateModal} onOpenChange={setDeactivateModal}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <span className="size-8 rounded-full bg-[#fef2f2] dark:bg-[#450a0a] flex items-center justify-center flex-shrink-0">
                <UserX size={15} className="text-[#dc2626]"/>
              </span>
              Deactivate {selActive.length} User{selActive.length>1?"s":""}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#64748b] dark:text-[#94a3b8] px-1">
            These users will lose access immediately. You can reactivate them anytime.
          </p>
          <div className="max-h-36 overflow-y-auto rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] divide-y divide-[#e2e8f0] dark:divide-[#334155]">
            {selActive.map(u=>(
              <div key={u.id} className="flex items-center gap-2.5 px-3 py-2">
                <div className="size-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{background:avatarGrad(u.id)}}>{initials(u.name)}</div>
                <span className="text-sm font-medium text-[#0f172a] dark:text-[#f1f5f9]">{u.name}</span>
                <span className="ml-auto text-xs text-[#94a3b8] truncate">{u.email}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDeactivateModal(false)}>Cancel</Button>
            <Button onClick={confirmDeactivate} className="bg-[#dc2626] hover:bg-[#b91c1c] text-white gap-1.5">
              <UserX size={14}/> Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Activate ───────────────────────────────────────────────────── */}
      <Dialog open={activateModal} onOpenChange={setActivateModal}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <span className="size-8 rounded-full bg-[#f0fdf4] dark:bg-[#052e16] flex items-center justify-center flex-shrink-0">
                <UserCheck size={15} className="text-[#16a34a]"/>
              </span>
              Activate {selInactive.length} User{selInactive.length>1?"s":""}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#64748b] dark:text-[#94a3b8] px-1">These users will regain access immediately.</p>
          <div className="max-h-36 overflow-y-auto rounded-[8px] border border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a] divide-y divide-[#e2e8f0] dark:divide-[#334155]">
            {selInactive.map(u=>(
              <div key={u.id} className="flex items-center gap-2.5 px-3 py-2">
                <div className="size-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{background:avatarGrad(u.id)}}>{initials(u.name)}</div>
                <span className="text-sm font-medium text-[#0f172a] dark:text-[#f1f5f9]">{u.name}</span>
                <span className="ml-auto text-xs text-[#94a3b8] truncate">{u.email}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setActivateModal(false)}>Cancel</Button>
            <Button onClick={confirmActivate} className="bg-[#16a34a] hover:bg-[#15803d] text-white gap-1.5">
              <UserCheck size={14}/> Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Remove Confirm ──────────────────────────────────────────────────── */}
      <Dialog open={!!removeModal} onOpenChange={()=>setRemoveModal(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <span className="size-8 rounded-full bg-[#fef2f2] dark:bg-[#450a0a] flex items-center justify-center flex-shrink-0">
                <Trash2 size={15} className="text-[#dc2626]"/>
              </span>
              Remove User
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#64748b] dark:text-[#94a3b8] px-1">
            Are you sure you want to remove <strong className="text-[#0f172a] dark:text-[#f1f5f9]">{removeModal?.user.name}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setRemoveModal(null)}>Cancel</Button>
            <Button onClick={()=>confirmRemove(removeModal.user.id)} className="bg-[#dc2626] hover:bg-[#b91c1c] text-white gap-1.5">
              <Trash2 size={14}/> Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit User ───────────────────────────────────────────────────────── */}
      <Dialog open={!!editModal} onOpenChange={()=>setEditModal(null)}>
        {editModal && (
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Pencil size={15} className="text-[#64748b]"/> Edit User
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              {[{field:"name",label:"Full Name",type:"text"},{field:"email",label:"Email Address",type:"email"}].map(({field,label,type})=>(
                <div key={field}>
                  <label className="block text-xs font-semibold text-[#374151] dark:text-[#cbd5e1] mb-1.5 uppercase tracking-wide">{label}</label>
                  <input type={type} value={editModal.draft[field]}
                    onChange={e=>setEditModal(prev=>({...prev,draft:{...prev.draft,[field]:e.target.value}}))}
                    className="w-full h-9 px-3 rounded-[7px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] text-[#0f172a] dark:text-[#f1f5f9] text-sm outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 transition-colors"/>
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-[#374151] dark:text-[#cbd5e1] mb-1.5 uppercase tracking-wide">Role</label>
                <select value={editModal.draft.role}
                  onChange={e=>setEditModal(prev=>({...prev,draft:{...prev.draft,role:e.target.value}}))}
                  className="w-full h-9 px-3 rounded-[7px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] text-[#0f172a] dark:text-[#f1f5f9] text-sm outline-none cursor-pointer focus:border-[#2563eb] transition-colors">
                  {ROLES.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] dark:text-[#cbd5e1] mb-1.5 uppercase tracking-wide">Status</label>
                <select value={editModal.draft.status}
                  onChange={e=>setEditModal(prev=>({...prev,draft:{...prev.draft,status:e.target.value}}))}
                  className="w-full h-9 px-3 rounded-[7px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a] text-[#0f172a] dark:text-[#f1f5f9] text-sm outline-none cursor-pointer focus:border-[#2563eb] transition-colors">
                  {STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={()=>setEditModal(null)}>Cancel</Button>
              <Button onClick={saveEdit} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
