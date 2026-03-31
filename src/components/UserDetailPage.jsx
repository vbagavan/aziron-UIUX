import { useState } from "react";
import {
  ChevronRight, UserX, UserCheck, Pencil, Shield, Users, Activity,
  LayoutDashboard, LogIn, MessageSquare, FileText, Check, X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

// ─── shared config ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  ["#3b82f6","#1d4ed8"],["#8b5cf6","#6d28d9"],["#ec4899","#be185d"],
  ["#f59e0b","#b45309"],["#10b981","#047857"],["#06b6d4","#0e7490"],
  ["#f97316","#c2410c"],["#6366f1","#4338ca"],["#84cc16","#4d7c0f"],
  ["#14b8a6","#0f766e"],
];
const ROLE_CFG = {
  "Admin":       { bg:"#2563eb", text:"#ffffff" },
  "Member":      { bg:"#334155", text:"#ffffff" },
  "Super Admin": { bg:"#7c3aed", text:"#ffffff" },
};
const STATUS_CFG = {
  Active:   { dot:"#16a34a", text:"#16a34a", bg:"#dcfce7", label:"Active"   },
  Inactive: { dot:"#94a3b8", text:"#64748b", bg:"#f1f5f9", label:"Inactive" },
  Pending:  { dot:"#f59e0b", text:"#d97706", bg:"#fef9c3", label:"Pending"  },
};

const ALL_GROUPS = [
  { id:1, name:"Finance Team",  members:12, desc:"Financial operations and reporting" },
  { id:2, name:"AI Dev Team",   members:8,  desc:"AI product development team"        },
  { id:3, name:"Support Team",  members:15, desc:"Customer support and success"       },
];

const ALL_PERMISSIONS = [
  { key:"view_users",    label:"View Users",           group:"Users"     },
  { key:"manage_users",  label:"Manage Users",          group:"Users"     },
  { key:"invite_users",  label:"Invite Users",          group:"Users"     },
  { key:"view_flows",    label:"View Flows",            group:"Flows"     },
  { key:"manage_flows",  label:"Manage Flows",          group:"Flows"     },
  { key:"view_agents",   label:"View Agents",           group:"Agents"    },
  { key:"manage_agents", label:"Manage Agents",         group:"Agents"    },
  { key:"view_reports",  label:"View Reports",          group:"Reports"   },
  { key:"export_data",   label:"Export Data",           group:"Reports"   },
  { key:"manage_settings",label:"Manage Settings",     group:"Settings"  },
];

const ACTIVITY_LOG = [
  { id:1, date:"23 Feb 2025 12:00 PM", activity:"Logged in",             by:"—"               },
  { id:2, date:"23 Feb 2025 11:45 AM", activity:"Updated profile",       by:"Jane Cooper"     },
  { id:3, date:"22 Feb 2025 03:00 PM", activity:"Created flow",          by:"Jane Cooper"     },
  { id:4, date:"21 Feb 2025 10:30 AM", activity:"Invited team member",   by:"Jane Cooper"     },
  { id:5, date:"20 Feb 2025 02:15 PM", activity:"Changed role to Admin", by:"Kristin Watson"  },
  { id:6, date:"19 Feb 2025 09:00 AM", activity:"Logged in",             by:"—"               },
  { id:7, date:"18 Feb 2025 04:00 PM", activity:"Exported report",       by:"Jane Cooper"     },
];

function initials(name){ return name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2); }
function avatarGrad(id){ const [f,t]=AVATAR_COLORS[id%AVATAR_COLORS.length]; return `linear-gradient(135deg,${f},${t})`; }
function groupNames(ids){ return ids.map(id=>ALL_GROUPS.find(g=>g.id===id)).filter(Boolean); }

const TABS = [
  { key:"overview",       label:"Overview",      icon:LayoutDashboard },
  { key:"access-roles",   label:"Access & Roles",icon:Shield           },
  { key:"groups",         label:"Groups",        icon:Users            },
  { key:"activity",       label:"Activity Log",  icon:Activity         },
];

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ user }){
  const stats = [
    { icon:LogIn,         label:"Login Sessions",  value:"124"  },
    { icon:MessageSquare, label:"Messages Sent",   value:"1,847"},
    { icon:FileText,      label:"Files Shared",    value:"93"   },
  ];
  return(
    <div className="flex flex-col gap-5">
      {/* stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(s=>(
          <div key={s.label} className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] p-4 flex items-center gap-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="size-10 rounded-[8px] bg-[#eff6ff] dark:bg-[#1e3a8a]/30 flex items-center justify-center flex-shrink-0">
              <s.icon size={18} className="text-[#2563eb]"/>
            </div>
            <div>
              <p className="text-xl font-bold text-[#0f172a] dark:text-[#f1f5f9] leading-none">{s.value}</p>
              <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* info rows */}
      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        {[
          { label:"Email",      value:user.email },
          { label:"Role",       value:<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{color:ROLE_CFG[user.role]?.text,backgroundColor:ROLE_CFG[user.role]?.bg}}>{user.role}</span> },
          { label:"Status",     value:<span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{color:STATUS_CFG[user.status]?.text}}><span className="size-1.5 rounded-full" style={{backgroundColor:STATUS_CFG[user.status]?.dot}}/>{user.status}</span> },
          { label:"Groups",     value:groupNames(user.groups).map(g=>g.name).join(", ")||"—" },
          { label:"Last Login", value:user.lastLogin },
        ].map((row,i)=>(
          <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b last:border-0 border-[#f1f5f9] dark:border-[#334155]">
            <span className="text-sm font-medium text-[#94a3b8] w-32">{row.label}</span>
            <span className="flex-1 text-sm text-[#374151] dark:text-[#cbd5e1] text-right">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Access & Roles tab ───────────────────────────────────────────────────────

function AccessRolesTab({ user, onRoleChange }){
  const [perms, setPerms] = useState(()=>{
    const p = {};
    // Admin gets all; Member gets view perms; Super Admin gets all
    ALL_PERMISSIONS.forEach(pm=>{
      if(user.role==="Super Admin") p[pm.key]=true;
      else if(user.role==="Admin") p[pm.key]=pm.key!=="manage_settings";
      else p[pm.key]=pm.key.startsWith("view_");
    });
    return p;
  });

  const ROLES = ["Super Admin","Admin","Member"];
  const ROLE_CFG_FULL = {
    "Admin":       { bg:"#2563eb", text:"#ffffff", desc:"Full access to all features except settings" },
    "Member":      { bg:"#334155", text:"#ffffff", desc:"View-only access, can use agents and flows" },
    "Super Admin": { bg:"#7c3aed", text:"#ffffff", desc:"Unrestricted access to all platform features" },
  };

  const grouped = ALL_PERMISSIONS.reduce((acc,pm)=>{
    (acc[pm.group]||(acc[pm.group]=[])).push(pm); return acc;
  },{});

  return(
    <div className="flex flex-col gap-5">
      {/* Role assignment */}
      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="px-5 py-3.5 border-b border-[#f1f5f9] dark:border-[#334155]">
          <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">Role Assignment</h3>
          <p className="text-xs text-[#94a3b8] mt-0.5">Assign a role to control what this user can access.</p>
        </div>
        <div className="p-4 flex flex-col gap-2">
          {ROLES.map(r=>{
            const cfg=ROLE_CFG_FULL[r]; const active=user.role===r;
            return(
              <label key={r} className={`flex items-center gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors ${active?"border-[#2563eb] bg-[#eff6ff] dark:bg-[#1e3a8a]/20":"border-[#e2e8f0] dark:border-[#334155] hover:bg-[#f8fafc] dark:hover:bg-[#334155]"}`}>
                <input type="radio" name="role" checked={active} onChange={()=>onRoleChange(r)}
                  className="accent-[#2563eb] cursor-pointer flex-shrink-0"/>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{color:cfg.text,backgroundColor:cfg.bg}}>{r}</span>
                    {active && <span className="text-xs text-[#2563eb] font-medium">Current</span>}
                  </div>
                  <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-0.5">{cfg.desc}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="px-5 py-3.5 border-b border-[#f1f5f9] dark:border-[#334155]">
          <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">Permissions</h3>
          <p className="text-xs text-[#94a3b8] mt-0.5">Fine-grained access controls for this user.</p>
        </div>
        <div className="p-4 flex flex-col gap-4">
          {Object.entries(grouped).map(([group,items])=>(
            <div key={group}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2">{group}</p>
              <div className="flex flex-col gap-1">
                {items.map(pm=>(
                  <label key={pm.key} className="flex items-center gap-3 px-3 py-2.5 rounded-[7px] hover:bg-[#f8fafc] dark:hover:bg-[#334155] cursor-pointer transition-colors">
                    <span className={`size-4 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${perms[pm.key]?"bg-[#2563eb] border-[#2563eb]":"border-[#cbd5e1] dark:border-[#475569]"}`}>
                      {perms[pm.key] && <Check size={10} className="text-white"/>}
                    </span>
                    <input type="checkbox" checked={perms[pm.key]}
                      onChange={()=>setPerms(p=>({...p,[pm.key]:!p[pm.key]}))}
                      className="sr-only"/>
                    <span className="text-sm text-[#374151] dark:text-[#cbd5e1]">{pm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Groups tab ───────────────────────────────────────────────────────────────

function GroupsTab({ user, onGroupChange }){
  const userGroups = groupNames(user.groups);
  const otherGroups = ALL_GROUPS.filter(g=>!user.groups.includes(g.id));
  return(
    <div className="flex flex-col gap-5">
      {/* Current groups */}
      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="px-5 py-3.5 border-b border-[#f1f5f9] dark:border-[#334155] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">Group Membership</h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">{userGroups.length} group{userGroups.length!==1?"s":""}</p>
          </div>
        </div>
        {userGroups.length>0 ? (
          <div className="divide-y divide-[#f1f5f9] dark:divide-[#334155]">
            {userGroups.map(g=>(
              <div key={g.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-[8px] bg-[#eff6ff] dark:bg-[#1e3a8a]/30 flex items-center justify-center flex-shrink-0">
                    <Users size={16} className="text-[#2563eb]"/>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0f172a] dark:text-[#f1f5f9]">{g.name}</p>
                    <p className="text-xs text-[#94a3b8]">{g.members} members · {g.desc}</p>
                  </div>
                </div>
                <button onClick={()=>onGroupChange("remove",g.id)}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[6px] border border-[#e2e8f0] dark:border-[#334155] text-xs font-medium text-[#64748b] dark:text-[#94a3b8] hover:border-[#fecaca] hover:text-[#dc2626] hover:bg-[#fef2f2] transition-colors">
                  <X size={11}/> Remove
                </button>
              </div>
            ))}
          </div>
        ):(
          <div className="flex flex-col items-center gap-2 py-10">
            <Users size={28} className="text-[#cbd5e1] dark:text-[#475569]"/>
            <p className="text-sm text-[#94a3b8]">Not a member of any group</p>
          </div>
        )}
      </div>

      {/* Add to groups */}
      {otherGroups.length>0 && (
        <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="px-5 py-3.5 border-b border-[#f1f5f9] dark:border-[#334155]">
            <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">Available Groups</h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">Add this user to additional groups.</p>
          </div>
          <div className="divide-y divide-[#f1f5f9] dark:divide-[#334155]">
            {otherGroups.map(g=>(
              <div key={g.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-[8px] bg-[#f1f5f9] dark:bg-[#334155] flex items-center justify-center flex-shrink-0">
                    <Users size={16} className="text-[#64748b]"/>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0f172a] dark:text-[#f1f5f9]">{g.name}</p>
                    <p className="text-xs text-[#94a3b8]">{g.members} members · {g.desc}</p>
                  </div>
                </div>
                <button onClick={()=>onGroupChange("add",g.id)}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[6px] border border-[#e2e8f0] dark:border-[#334155] text-xs font-medium text-[#374151] dark:text-[#cbd5e1] hover:border-[#2563eb] hover:text-[#2563eb] hover:bg-[#eff6ff] transition-colors">
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Activity Log tab ─────────────────────────────────────────────────────────

function ActivityTab(){
  return(
    <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[10px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="px-5 py-3.5 border-b border-[#f1f5f9] dark:border-[#334155]">
        <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">Activity Log</h3>
        <p className="text-xs text-[#94a3b8] mt-0.5">Recent actions performed by or for this user.</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#f1f5f9] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a]/40">
            <th className="px-5 py-3 text-left text-xs font-semibold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-[0.05em]">Date & Time</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-[0.05em]">Activity</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-[#64748b] dark:text-[#94a3b8] uppercase tracking-[0.05em]">Initiated By</th>
          </tr>
        </thead>
        <tbody>
          {ACTIVITY_LOG.map(row=>(
            <tr key={row.id} className="border-b last:border-0 border-[#f1f5f9] dark:border-[#334155] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a]/30 transition-colors">
              <td className="px-5 py-3.5 text-xs text-[#94a3b8] whitespace-nowrap">{row.date}</td>
              <td className="px-5 py-3.5 text-sm font-medium text-[#374151] dark:text-[#cbd5e1]">{row.activity}</td>
              <td className="px-5 py-3.5 text-sm text-[#64748b] dark:text-[#94a3b8]">{row.by}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UserDetailPage({ user: initUser, onNavigate }){
  const [user,    setUser]    = useState(initUser);
  const [tab,     setTab]     = useState("overview");
  const [editModal, setEditModal] = useState(null);
  const [suspendModal, setSuspendModal] = useState(false);
  const [toast,   setToast]   = useState(null);

  const roleCfg   = ROLE_CFG[user.role]   ?? ROLE_CFG["Member"];
  const statusCfg = STATUS_CFG[user.status] ?? STATUS_CFG["Active"];

  const notify = msg => setToast(msg);

  function handleRoleChange(r){
    setUser(u=>({...u,role:r}));
    notify(`Role changed to "${r}"`);
  }

  function handleGroupChange(action, gid){
    if(action==="add")    setUser(u=>({...u,groups:[...u.groups,gid]}));
    if(action==="remove") setUser(u=>({...u,groups:u.groups.filter(g=>g!==gid)}));
    const g=ALL_GROUPS.find(g=>g.id===gid);
    notify(action==="add"?`Added to "${g.name}"`:`Removed from "${g.name}"`);
  }

  function saveEdit(){
    setUser(u=>({...u,...editModal.draft}));
    setEditModal(null);
    notify("Profile updated");
  }

  function confirmSuspend(){
    const next=user.status==="Active"?"Inactive":"Active";
    setUser(u=>({...u,status:next}));
    setSuspendModal(false);
    notify(next==="Active"?"Access restored":"Access suspended");
  }

  return(
    <>
      <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
        <Sidebar activePage="users-list" onNavigate={onNavigate}/>

        <div className="flex flex-col flex-1 min-w-0">
          <AppHeader onNavigate={onNavigate}>
            <nav className="flex items-center gap-1.5 text-sm ml-1">
              <button onClick={()=>onNavigate("users-list")} className="text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f1f5f9] transition-colors">
                User Management
              </button>
              <ChevronRight size={13} className="text-[#cbd5e1] dark:text-[#475569]"/>
              <button onClick={()=>onNavigate("users-list")} className="text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f1f5f9] transition-colors">
                Users
              </button>
              <ChevronRight size={13} className="text-[#cbd5e1] dark:text-[#475569]"/>
              <span className="text-[#0f172a] dark:text-[#f1f5f9] font-medium">{user.name}</span>
            </nav>
          </AppHeader>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-6 py-5 flex flex-col gap-5 max-w-[900px] mx-auto">

              {/* ── Profile header card ── */}
              <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[12px] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="size-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-sm"
                      style={{background:avatarGrad(user.id)}}>
                      {initials(user.name)}
                    </div>

                    {/* Name + meta */}
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="text-[19px] font-semibold text-[#0f172a] dark:text-[#f1f5f9] leading-none">{user.name}</h1>
                        {/* Status badge — inline with name */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-semibold"
                          style={{color:statusCfg.text, backgroundColor:statusCfg.bg}}>
                          <span className="size-1.5 rounded-full" style={{backgroundColor:statusCfg.dot}}/>
                          {user.status}
                        </span>
                      </div>
                      <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mt-1">{user.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{color:roleCfg.text,backgroundColor:roleCfg.bg}}>{user.role}</span>
                        {user.groups.length>0 && (
                          <span className="text-xs text-[#94a3b8]">·</span>
                        )}
                        {groupNames(user.groups).map(g=>(
                          <span key={g.id} className="text-xs text-[#64748b] dark:text-[#94a3b8]">{g.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline"
                      onClick={()=>setEditModal({draft:{name:user.name,email:user.email,role:user.role,status:user.status}})}
                      className="gap-1.5 h-9 text-sm font-medium border-[#e2e8f0] dark:border-[#334155]">
                      <Pencil size={13}/> Edit Profile
                    </Button>
                    <Button
                      onClick={()=>setSuspendModal(true)}
                      className={`gap-1.5 h-9 text-sm font-medium ${
                        user.status==="Active"
                          ?"bg-[#dc2626] hover:bg-[#b91c1c] text-white"
                          :"bg-[#16a34a] hover:bg-[#15803d] text-white"}`}>
                      {user.status==="Active"
                        ?<><UserX size={13}/> Suspend Access</>
                        :<><UserCheck size={13}/> Restore Access</>}
                    </Button>
                  </div>
                </div>
              </div>

              {/* ── Tabs ── */}
              <div className="flex items-center gap-1 border-b border-[#e2e8f0] dark:border-[#334155] -mb-1">
                {TABS.map(t=>(
                  <button key={t.key} onClick={()=>setTab(t.key)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                      tab===t.key
                        ?"border-[#2563eb] text-[#2563eb]"
                        :"border-transparent text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f1f5f9]"}`}>
                    <t.icon size={14}/>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── Tab content ── */}
              {tab==="overview"     && <OverviewTab     user={user}/>}
              {tab==="access-roles" && <AccessRolesTab  user={user} onRoleChange={handleRoleChange}/>}
              {tab==="groups"       && <GroupsTab       user={user} onGroupChange={handleGroupChange}/>}
              {tab==="activity"     && <ActivityTab/>}

            </div>
          </div>
        </div>
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-4 py-2.5 bg-[#0f172a] dark:bg-[#f1f5f9] text-white dark:text-[#0f172a] rounded-[8px] shadow-xl text-sm font-medium">
          <Check size={14} className="text-[#22c55e]"/>{toast}
        </div>
      )}

      {/* ── Suspend / Restore confirm ─── */}
      <Dialog open={suspendModal} onOpenChange={setSuspendModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <span className={`size-8 rounded-full flex items-center justify-center flex-shrink-0 ${user.status==="Active"?"bg-[#fef2f2] dark:bg-[#450a0a]":"bg-[#f0fdf4] dark:bg-[#052e16]"}`}>
                {user.status==="Active"
                  ?<UserX size={15} className="text-[#dc2626]"/>
                  :<UserCheck size={15} className="text-[#16a34a]"/>}
              </span>
              {user.status==="Active"?"Suspend Access":"Restore Access"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#64748b] dark:text-[#94a3b8] px-1">
            {user.status==="Active"
              ?`Suspending ${user.name}'s access will prevent them from logging in immediately.`
              :`Restoring ${user.name}'s access will allow them to log in again.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setSuspendModal(false)}>Cancel</Button>
            <Button onClick={confirmSuspend}
              className={user.status==="Active"
                ?"bg-[#dc2626] hover:bg-[#b91c1c] text-white gap-1.5"
                :"bg-[#16a34a] hover:bg-[#15803d] text-white gap-1.5"}>
              {user.status==="Active"
                ?<><UserX size={14}/> Suspend</>
                :<><UserCheck size={14}/> Restore</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Profile modal ── */}
      <Dialog open={!!editModal} onOpenChange={()=>setEditModal(null)}>
        {editModal && (
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Pencil size={15} className="text-[#64748b]"/> Edit Profile
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
