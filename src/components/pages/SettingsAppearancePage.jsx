import { useState, useRef, useEffect } from "react";
import {
  UserCircle, SwatchBook, KeyRound, Bell, LayoutGrid, HelpCircle,
  ChevronRight, Check, X, CheckCheck, Filter, SlidersHorizontal,
  ServerCrash, ShieldAlert, Bot, ShieldX, Zap, Gauge, FlaskConical,
  DatabaseZap, Rocket, GitMerge, GitPullRequest, Clock, BellOff,
  CreditCard, BadgeCheck, HardDrive, Workflow, Users, DollarSign,
  Mail, PhoneCall,
} from "lucide-react";
import { TENANTS, SAAS_TIERS, getLimits } from "@/data/adminData";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";

// ─── Settings nav ──────────────────────────────────────────────────────────────

const SETTINGS_NAV = [
  { icon: UserCircle,  label: "Account",      id: "account"      },
  { icon: SwatchBook,  label: "Appearance",   id: "appearance"   },
  { icon: KeyRound,    label: "API Keys",     id: "api-keys"     },
  { icon: Bell,        label: "Notifications",id: "notifications"},
  { icon: LayoutGrid,  label: "Integrations", id: "integrations" },
  { icon: CreditCard,  label: "Subscription", id: "subscription" },
  { icon: HelpCircle,  label: "Support",      id: "support"      },
];

// ─── Appearance assets ────────────────────────────────────────────────────────

const imgThemeBlueActive = "https://www.figma.com/api/mcp/asset/b286a75a-1bfc-4079-a8c0-cc107db1c040";
const imgThemeGreen      = "https://www.figma.com/api/mcp/asset/7970b3d4-28e9-4404-b71c-c61ad17dc708";
const imgThemeOrange     = "https://www.figma.com/api/mcp/asset/e26076c8-e8a3-4882-8f83-3912232e487b";
const imgThemePurple     = "https://www.figma.com/api/mcp/asset/9cfb15c9-c14a-4f58-9eaf-67c7c9312b1a";

const themeColors = [
  { id:"blue",   label:"Blue theme",   img:imgThemeBlueActive },
  { id:"green",  label:"Green theme",  img:imgThemeGreen      },
  { id:"orange", label:"Orange theme", img:imgThemeOrange     },
  { id:"purple", label:"Purple theme", img:imgThemePurple     },
];

function LightPreview(){
  return(
    <div className="w-full flex-1 min-h-0 bg-[#f8fafc] rounded-[6px] border-2 border-[#8b949e] flex items-center justify-center p-2">
      <div className="w-full flex flex-col gap-2">
        <div className="h-2 bg-[#e5e7eb] rounded-full w-3/4"/>
        <div className="h-2 bg-[#e5e7eb] rounded-full w-1/2"/>
      </div>
    </div>
  );
}
function DarkPreview({ selected }){
  return(
    <div className={`w-full flex-1 min-h-0 bg-[#0d1117] rounded-[6px] border-2 flex items-center justify-center p-2 relative ${selected?"border-[#0f172a]":"border-[#8b949e]"}`}>
      {selected&&(<div className="absolute top-2 right-2 size-4 rounded-full bg-[#0f172a] flex items-center justify-center"><Check size={10} className="text-white"/></div>)}
      <div className="w-full flex flex-col gap-2">
        <div className="h-2 bg-[#1e2939] rounded-full w-3/4"/>
        <div className="h-2 bg-[#1e2939] rounded-full w-1/2"/>
      </div>
    </div>
  );
}
function SystemPreview(){
  return(
    <div className="w-full flex-1 min-h-0 rounded-[6px] border-2 border-[#8b949e] overflow-hidden flex items-center justify-center p-2" style={{background:"linear-gradient(135deg,#f0f6fc 0%,#0d1117 100%)"}}>
      <div className="w-full flex flex-col gap-2">
        <div className="h-2 bg-[rgba(153,161,175,0.5)] rounded-full w-3/4"/>
        <div className="h-2 bg-[rgba(153,161,175,0.5)] rounded-full w-1/2"/>
      </div>
    </div>
  );
}

// ─── Appearance panel ─────────────────────────────────────────────────────────

function AppearancePanel(){
  const [themeColor, setThemeColor] = useState("blue");
  const [themeMode,  setThemeMode]  = useState("dark");
  return(
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium text-[#0f172a] dark:text-[#f1f5f9] leading-7">Appearance</h2>
        <p className="text-base text-[#4e4d4d] dark:text-[#94a3b8] leading-6">Manage your appearance settings and preferences.</p>
      </div>

      {/* Theme Color */}
      <div className="flex flex-col gap-4">
        <p className="text-base font-semibold text-[#0f172a] dark:text-[#f1f5f9] leading-6">Theme Color</p>
        <div className="flex items-center gap-4">
          {themeColors.map(({id,label,img})=>(
            <button key={id} onClick={()=>setThemeColor(id)} aria-label={label} title={label}
              className={`relative size-8 rounded-full overflow-hidden flex-shrink-0 transition-all ${themeColor===id?"ring-2 ring-offset-2 ring-[#2563eb]":"hover:scale-110"}`}>
              <img src={img} alt="" className="absolute inset-0 size-full object-cover"/>
            </button>
          ))}
        </div>
      </div>

      {/* Theme Mode */}
      <div className="flex flex-col gap-4">
        <p className="text-xl font-medium text-[#0f172a] dark:text-[#f1f5f9] leading-7 tracking-[-0.6px]">Theme Mode</p>
        <div className="flex gap-4">
          {[
            {id:"light",  label:"Light",  Preview:()=><LightPreview/>},
            {id:"dark",   label:"Dark",   Preview:()=><DarkPreview selected={themeMode==="dark"}/>},
            {id:"system", label:"System", Preview:()=><SystemPreview/>},
          ].map(({id,label,Preview})=>(
            <button key={id} onClick={()=>setThemeMode(id)} aria-label={`${label} mode`}
              className="flex flex-col gap-2 items-center flex-1 min-w-[120px] max-w-[200px]">
              <div className="w-full h-24 flex"><Preview/></div>
              <span className={`text-sm font-medium leading-5 ${themeMode===id?"text-[#0f172a] dark:text-[#f1f5f9]":"text-[#64748b] dark:text-[#94a3b8]"}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Notifications panel ──────────────────────────────────────────────────────

const NOTIF_DATA = [
  { id:"c1", type:"critical", category:"security",  avatarBg:"#64748b", avatarInitials:"PR", BadgeIcon:ServerCrash,   badgeBg:"#ef4444", title:"Production deployment failure",     desc:"main branch · deploy #847 crashed at runtime",                tag:"PROD",     time:"Just now",   unread:true,  persistent:true  },
  { id:"c2", type:"critical", category:"security",  avatarBg:"#ef4444", avatarInitials:"CV", BadgeIcon:ShieldAlert,   badgeBg:"#ef4444", title:"Security vulnerability detected",    desc:"CVE-2024-1234 (critical) in lodash@4.17.11",                   tag:"CVE",      time:"5 min ago",  unread:true,  persistent:true  },
  { id:"c3", type:"critical", category:"general",   avatarBg:"#2563eb", avatarInitials:"AI", BadgeIcon:Bot,           badgeBg:"#ef4444", title:"AI agent execution failure",         desc:"Customer Support Agent · unhandled exception in run #23",      tag:"AGENT",    time:"12 min ago", unread:true,  persistent:true  },
  { id:"c4", type:"critical", category:"security",  avatarBg:"#b91c1c", avatarInitials:"UA", BadgeIcon:ShieldX,       badgeBg:"#ef4444", title:"Unauthorized access attempt",        desc:"IP 203.0.113.42 · 14 failed logins on admin panel",             tag:"SECURITY", time:"18 min ago", unread:true,  persistent:true  },
  { id:"w1", type:"warning",  category:"general",   avatarBg:"#d97706", avatarInitials:"CI", BadgeIcon:Zap,           badgeBg:"#f97316", title:"Build pipeline instability",         desc:"CI/CD · 3 of last 5 runs failed — flaky test suspected",       tag:"CI/CD",    time:"45 min ago", unread:true                   },
  { id:"w2", type:"warning",  category:"general",   avatarBg:"#b45309", avatarInitials:"AP", BadgeIcon:Gauge,         badgeBg:"#f97316", title:"API latency spike detected",         desc:"p95 → 1.4s · 340% above baseline",                             tag:"API",      time:"1h ago",     unread:false                  },
  { id:"w3", type:"warning",  category:"general",   avatarBg:"#92400e", avatarInitials:"TC", BadgeIcon:FlaskConical,  badgeBg:"#f97316", title:"Test coverage below threshold",      desc:"Coverage dropped to 68% · minimum required: 80%",              tag:"TESTS",    time:"2h ago",     unread:false                  },
  { id:"w4", type:"warning",  category:"general",   avatarBg:"#7c3aed", avatarInitials:"DP", BadgeIcon:DatabaseZap,  badgeBg:"#f97316", title:"Data pipeline near capacity",        desc:"Queue utilisation at 89% · auto-scaling triggered",            tag:"PIPELINE", time:"3h ago",     unread:false                  },
  { id:"s1", type:"success",  category:"general",   avatarBg:"#16a34a", avatarInitials:"PR", BadgeIcon:Rocket,        badgeBg:"#22c55e", title:"Production deployment successful",   desc:"v2.4.1 deployed to prod · 0 errors · 12s build",               tag:"DEPLOY",   time:"3h ago",     unread:false                  },
  { id:"s2", type:"success",  category:"general",   avatarBg:"#15803d", avatarInitials:"GH", BadgeIcon:GitMerge,      badgeBg:"#22c55e", title:"PR #1247 merged — AI review passed", desc:"feat: knowledge-hub picker · reviewed by Aziron AI",          tag:"PR",       time:"4h ago",     unread:false                  },
  { id:"a1", type:"approval", category:"approval",  avatarBg:"#1d4ed8", avatarInitials:"AI", BadgeIcon:GitPullRequest,badgeBg:"#2563eb", title:"AI-generated code pending review",   desc:"Aziron AI proposes 3 file changes in CustomerAgent.js",        tag:"CODE",     time:"15 min ago", unread:true,  persistent:true, actions:["Review","Approve","Reject"] },
  { id:"a2", type:"approval", category:"approval",  avatarBg:"#1e40af", avatarInitials:"JA", BadgeIcon:Rocket,        badgeBg:"#2563eb", title:"Deployment approval required",       desc:"staging → production · v2.5.0-rc.1 · requested by Jay",       tag:"DEPLOY",   time:"30 min ago", unread:true,  persistent:true, actions:["Approve","Reject"] },
  { id:"a3", type:"approval", category:"approval",  avatarBg:"#1e3a8a", avatarInitials:"SE", BadgeIcon:ShieldAlert,   badgeBg:"#2563eb", title:"Security exception awaiting review", desc:"CORS bypass requested for partner API integration",            tag:"SECURITY", time:"1h ago",     unread:false, persistent:true, actions:["Review"], category2:"security" },
  { id:"a4", type:"approval", category:"approval",  avatarBg:"#1d4ed8", avatarInitials:"WF", BadgeIcon:Clock,         badgeBg:"#2563eb", title:"Workflow paused — human decision",   desc:"Invoice reconciliation agent waiting at step 4 of 7",          tag:"WORKFLOW", time:"2h ago",     unread:false, persistent:true, actions:["Review","Approve"] },
];

const TYPE_CFG = {
  critical:{ bar:"#ef4444", dot:"#ef4444", label:"CRITICAL", labelColor:"#ef4444" },
  warning: { bar:"#f97316", dot:"#f97316", label:"WARNING",  labelColor:"#f97316" },
  success: { bar:"#22c55e", dot:"#22c55e", label:"SUCCESS",  labelColor:"#22c55e" },
  approval:{ bar:"#2563eb", dot:"#2563eb", label:"APPROVAL", labelColor:"#2563eb" },
};

const ACTION_STYLE = {
  Approve:"bg-[#22c55e] text-white hover:bg-[#16a34a]",
  Reject: "border border-[#ef4444] text-[#ef4444] bg-white dark:bg-[#1e293b] hover:bg-[#fef2f2]",
  Review: "border border-[#2563eb] text-[#2563eb] bg-white dark:bg-[#1e293b] hover:bg-[#eff6ff]",
};

const NOTIF_TABS = [
  {key:"all",       label:"All"      },
  {key:"approvals", label:"Approvals"},
  {key:"security",  label:"Security" },
  {key:"unread",    label:"Unread"   },
];

const FILTER_TYPE_OPTIONS = [
  {value:"critical",label:"Critical",color:"#ef4444"},
  {value:"warning", label:"Warning", color:"#f97316"},
  {value:"success", label:"Success", color:"#22c55e"},
  {value:"approval",label:"Approval",color:"#2563eb"},
];
const FILTER_STATUS_OPTIONS = [
  {value:"unread",    label:"Unread only"},
  {value:"read",      label:"Read only"  },
  {value:"persistent",label:"Persistent" },
];
const ALL_TAGS = [...new Set(NOTIF_DATA.map(n=>n.tag))].sort();
const EMPTY_FILTERS = {types:[],tags:[],statuses:[]};

function applyTab(items,tab){
  if(tab==="all")       return items;
  if(tab==="approvals") return items.filter(n=>n.category==="approval");
  if(tab==="security")  return items.filter(n=>n.category==="security"||n.category2==="security");
  if(tab==="unread")    return items.filter(n=>n.unread);
  return items;
}
function applyFilters(items,filters){
  let r=items;
  if(filters.types.length)    r=r.filter(n=>filters.types.includes(n.type));
  if(filters.tags.length)     r=r.filter(n=>filters.tags.includes(n.tag));
  if(filters.statuses.length) r=r.filter(n=>{
    if(filters.statuses.includes("unread")     &&  n.unread)     return true;
    if(filters.statuses.includes("read")       && !n.unread)     return true;
    if(filters.statuses.includes("persistent") &&  n.persistent) return true;
    return false;
  });
  return r;
}
function countFilters(f){ return f.types.length+f.tags.length+f.statuses.length; }

function NotifFilterPanel({filters,onChange,onClose,anchorRef}){
  const ref=useRef(null);
  useEffect(()=>{
    const h=e=>{
      if(ref.current&&!ref.current.contains(e.target)&&anchorRef.current&&!anchorRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[onClose,anchorRef]);
  const toggle=(key,val)=>onChange(prev=>({...prev,[key]:prev[key].includes(val)?prev[key].filter(v=>v!==val):[...prev[key],val]}));
  const hasAny=countFilters(filters)>0;
  return(
    <div ref={ref} className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[12px] w-[260px]"
      style={{boxShadow:"0 8px 32px rgba(15,23,42,0.12)"}}>
      <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-[#f1f5f9] dark:border-[#334155]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={13} className="text-[#475569] dark:text-[#94a3b8]"/>
          <span className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9]">Filters</span>
          {hasAny&&<span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#2563eb] text-white text-xs font-bold">{countFilters(filters)}</span>}
        </div>
        {hasAny&&<button onClick={()=>onChange(EMPTY_FILTERS)} className="text-xs text-[#ef4444] font-medium hover:text-[#dc2626]">Clear all</button>}
      </div>
      <div className="flex flex-col gap-3 p-3">
        <div>
          <p className="text-[10px] font-bold tracking-wider uppercase text-[#94a3b8] mb-1.5">Type</p>
          {FILTER_TYPE_OPTIONS.map(({value,label,color})=>{
            const active=filters.types.includes(value);
            return(
              <button key={value} onClick={()=>toggle("types",value)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-[5px] text-sm w-full text-left transition-colors ${active?"bg-[#f8fafc] dark:bg-[#0f172a]":"hover:bg-[#f8fafc] dark:hover:bg-[#0f172a]"}`}>
                <span className="flex-shrink-0 flex items-center justify-center size-4 rounded border-2 transition-colors" style={active?{backgroundColor:color,borderColor:color}:{borderColor:"#cbd5e1"}}>
                  {active&&<svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </span>
                <span className="size-2 rounded-full flex-shrink-0" style={{backgroundColor:color}}/>
                <span className={`text-sm ${active?"font-medium text-[#0f172a] dark:text-[#f1f5f9]":"text-[#475569] dark:text-[#94a3b8]"}`}>{label}</span>
                <span className="ml-auto text-xs text-[#94a3b8]">{NOTIF_DATA.filter(n=>n.type===value).length}</span>
              </button>
            );
          })}
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-wider uppercase text-[#94a3b8] mb-1.5">Status</p>
          {FILTER_STATUS_OPTIONS.map(({value,label})=>{
            const active=filters.statuses.includes(value);
            return(
              <button key={value} onClick={()=>toggle("statuses",value)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-[5px] text-sm w-full text-left transition-colors ${active?"bg-[#f8fafc] dark:bg-[#0f172a]":"hover:bg-[#f8fafc] dark:hover:bg-[#0f172a]"}`}>
                <span className={`flex-shrink-0 flex items-center justify-center size-4 rounded border-2 transition-colors ${active?"bg-[#2563eb] border-[#2563eb]":"border-[#cbd5e1]"}`}>
                  {active&&<svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </span>
                <span className={`text-sm ${active?"font-medium text-[#0f172a] dark:text-[#f1f5f9]":"text-[#475569] dark:text-[#94a3b8]"}`}>{label}</span>
              </button>
            );
          })}
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-wider uppercase text-[#94a3b8] mb-1.5">Tag</p>
          <div className="flex flex-wrap gap-1">
            {ALL_TAGS.map(tag=>{
              const active=filters.tags.includes(tag);
              const color=TYPE_CFG[NOTIF_DATA.find(n=>n.tag===tag)?.type]?.bar??"#64748b";
              return(
                <button key={tag} onClick={()=>toggle("tags",tag)}
                  className={`px-2 py-[2px] rounded text-xs font-bold tracking-wide border transition-all ${active?"text-white border-transparent":"text-[#475569] dark:text-[#94a3b8] bg-[#f8fafc] dark:bg-[#0f172a] border-[#e2e8f0] dark:border-[#334155]"}`}
                  style={active?{backgroundColor:color,borderColor:color}:{}}>{tag}</button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationRow({item,expanded,onToggle,onDismiss,onMarkRead}){
  const cfg=TYPE_CFG[item.type];
  const {BadgeIcon}=item;
  return(
    <div className={`group relative rounded-[10px] border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#0f172a]/40 transition-all duration-200 cursor-pointer ${expanded?"shadow-sm":""} hover:shadow-sm`}
      onClick={()=>onToggle(item.id)}>
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className="flex-shrink-0 flex items-center justify-center w-3 mt-[18px]">
          {item.unread
            ?<div className={`size-2 rounded-full ${item.type==="critical"?"animate-pulse":""}`} style={{backgroundColor:cfg.dot,opacity:item.type==="critical"?1:0.6}}/>
            :<div className="size-2 rounded-full bg-[#e2e8f0] dark:bg-[#334155]"/>}
        </div>
        <div className="relative flex-shrink-0 mt-0.5">
          <div className="size-10 rounded-full flex items-center justify-center text-white text-sm font-bold select-none"
            style={{backgroundColor:item.avatarBg}}>{item.avatarInitials}</div>
          <div className="absolute -bottom-1 -right-1 size-[18px] rounded-full border-2 border-white dark:border-[#1e293b] flex items-center justify-center"
            style={{backgroundColor:item.badgeBg}}>
            <BadgeIcon size={9} color="white" strokeWidth={2.5}/>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm text-[#0f172a] dark:text-[#f1f5f9] leading-snug ${item.unread?"font-semibold":"font-medium"}`}>{item.title}</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs text-[#94a3b8] whitespace-nowrap">{item.time}</span>
              <button onClick={e=>{e.stopPropagation();onDismiss(item.id);}}
                className="opacity-0 group-hover:opacity-100 flex items-center justify-center size-5 rounded-full text-[#94a3b8] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] transition-all">
                <X size={12}/>
              </button>
            </div>
          </div>
          <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-0.5 leading-snug">{item.desc}</p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="px-1.5 py-[1px] rounded text-[10px] font-bold tracking-wide border"
              style={{color:cfg.labelColor,backgroundColor:`${cfg.bar}12`,borderColor:`${cfg.bar}30`}}>{item.tag}</span>
            <span className="text-[10px] font-semibold px-1.5 py-[1px] rounded border"
              style={{color:cfg.labelColor,backgroundColor:`${cfg.bar}10`,borderColor:`${cfg.bar}20`}}>{cfg.label}</span>
            {item.persistent&&<span className="text-[10px] text-[#94a3b8] bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] px-1.5 py-[1px] rounded font-medium">persistent</span>}
            {item.unread&&(
              <button onClick={e=>{e.stopPropagation();onMarkRead(item.id);}}
                className="text-[10px] text-[#2563eb] hover:text-[#1d4ed8] font-medium transition-colors ml-auto">Mark as read</button>
            )}
          </div>
          {item.actions&&(
            <div className={`overflow-hidden transition-all duration-200 ${expanded?"max-h-12 mt-2.5 opacity-100":"max-h-0 opacity-0"}`}>
              <div className="flex items-center gap-1.5">
                {item.actions.map(action=>(
                  <button key={action} onClick={e=>e.stopPropagation()}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-[5px] text-xs font-semibold transition-colors ${ACTION_STYLE[action]}`}>
                    {action==="Approve"&&<CheckCheck size={11}/>}
                    {action==="Reject" &&<X size={11}/>}
                    {action==="Review" &&<ChevronRight size={11}/>}
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({type,count}){
  const cfg=TYPE_CFG[type];
  return(
    <div className="flex items-center gap-3 mt-5 mb-2 first:mt-0">
      <span className="text-xs font-bold tracking-[0.08em] uppercase" style={{color:cfg.labelColor}}>{cfg.label}</span>
      <span className="text-xs font-bold px-1.5 py-[1px] rounded-full" style={{color:cfg.labelColor,backgroundColor:`${cfg.bar}15`}}>{count}</span>
      <div className="flex-1 h-px" style={{backgroundColor:`${cfg.bar}20`}}/>
    </div>
  );
}

function NotificationsPanel(){
  const [activeTab,  setActiveTab]  = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [items,      setItems]      = useState(NOTIF_DATA);
  const [filters,    setFilters]    = useState(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterBtnRef                = useRef(null);

  const tabItems     = applyTab(items,activeTab);
  const displayItems = applyFilters(tabItems,filters);
  const activeFCount = countFilters(filters);
  const unreadCount  = items.filter(n=>n.unread).length;
  const tabCount     = key=>applyTab(items,key).filter(n=>n.unread).length;

  const handleToggle   = id=>setExpandedId(prev=>prev===id?null:id);
  const handleDismiss  = id=>setItems(prev=>prev.filter(n=>n.id!==id));
  const handleMarkRead = id=>setItems(prev=>prev.map(n=>n.id===id?{...n,unread:false}:n));
  const handleMarkAll  = ()=>setItems(prev=>prev.map(n=>({...n,unread:false})));

  return(
    <div className="flex flex-col gap-5">
      {/* Panel header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-medium text-[#0f172a] dark:text-[#f1f5f9] leading-7">Notifications</h2>
          <p className="text-sm text-[#4e4d4d] dark:text-[#94a3b8] mt-0.5">
            {unreadCount>0
              ?<span>You have <span className="font-semibold text-[#0f172a] dark:text-[#f1f5f9]">{unreadCount} unread</span> notification{unreadCount!==1?"s":""}</span>
              :"All notifications are read"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount>0&&(
            <button onClick={handleMarkAll}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border border-[#e2e8f0] dark:border-[#334155] text-sm font-medium text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155] transition-colors">
              <CheckCheck size={13}/> Mark all as read
            </button>
          )}
          <div className="relative">
            <button ref={filterBtnRef} onClick={()=>setFilterOpen(v=>!v)}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border text-sm font-medium transition-colors ${
                filterOpen||activeFCount>0
                  ?"bg-[#2563eb] text-white border-[#2563eb] hover:bg-[#1d4ed8]"
                  :"border-[#e2e8f0] dark:border-[#334155] text-[#374151] dark:text-[#cbd5e1] hover:bg-[#f8fafc] dark:hover:bg-[#334155]"}`}>
              <Filter size={13}/> Filter
              {activeFCount>0&&<span className="flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-white text-[#2563eb] text-xs font-bold">{activeFCount}</span>}
            </button>
            {filterOpen&&<NotifFilterPanel filters={filters} onChange={setFilters} onClose={()=>setFilterOpen(false)} anchorRef={filterBtnRef}/>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#e2e8f0] dark:border-[#334155] -mb-1">
        {NOTIF_TABS.map(({key,label})=>{
          const cnt=tabCount(key); const active=activeTab===key;
          return(
            <button key={key} onClick={()=>{setActiveTab(key);setExpandedId(null);}}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                active?"border-[#2563eb] text-[#2563eb]":"border-transparent text-[#64748b] dark:text-[#94a3b8] hover:text-[#0f172a] dark:hover:text-[#f1f5f9]"}`}>
              {label}
              {cnt>0&&<span className={`flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-xs font-bold ${active?"bg-[#2563eb] text-white":"bg-[#f1f5f9] dark:bg-[#334155] text-[#64748b] dark:text-[#94a3b8]"}`}>{cnt}</span>}
            </button>
          );
        })}
      </div>

      {/* Active filter chips */}
      {activeFCount>0&&(
        <div className="flex items-center gap-2 flex-wrap -mt-1">
          <span className="text-xs text-[#94a3b8]">Active:</span>
          {[
            ...filters.types.map(v=>({key:"types",value:v,label:v.charAt(0).toUpperCase()+v.slice(1),color:TYPE_CFG[v].bar})),
            ...filters.statuses.map(v=>({key:"statuses",value:v,label:FILTER_STATUS_OPTIONS.find(o=>o.value===v)?.label??v,color:"#64748b"})),
            ...filters.tags.map(v=>({key:"tags",value:v,label:v,color:TYPE_CFG[NOTIF_DATA.find(n=>n.tag===v)?.type]?.bar??"#64748b"})),
          ].map(({key,value,label,color})=>(
            <button key={`${key}-${value}`}
              onClick={()=>setFilters(prev=>({...prev,[key]:prev[key].filter(v=>v!==value)}))}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white hover:opacity-80"
              style={{backgroundColor:color}}>
              {label}<X size={9} strokeWidth={2.5}/>
            </button>
          ))}
          <button onClick={()=>setFilters(EMPTY_FILTERS)} className="text-xs text-[#64748b] hover:text-[#ef4444] font-medium transition-colors">Clear all</button>
        </div>
      )}

      {/* Notification list */}
      {displayItems.length===0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="size-14 rounded-full bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] flex items-center justify-center">
            <BellOff size={22} className="text-[#cbd5e1]"/>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[#475569] dark:text-[#94a3b8]">No notifications match</p>
            <p className="text-xs text-[#94a3b8] dark:text-[#64748b] mt-0.5">Try adjusting your filters</p>
          </div>
        </div>
      ) : activeTab==="all"&&activeFCount===0 ? (
        ["critical","warning","approval","success"].map(type=>{
          const group=displayItems.filter(n=>n.type===type);
          if(!group.length) return null;
          return(
            <div key={type}>
              <SectionHeader type={type} count={group.length}/>
              <div className="flex flex-col gap-2">
                {group.map(item=>(
                  <NotificationRow key={item.id} item={item} expanded={expandedId===item.id}
                    onToggle={handleToggle} onDismiss={handleDismiss} onMarkRead={handleMarkRead}/>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="flex flex-col gap-2">
          {displayItems.map(item=>(
            <NotificationRow key={item.id} item={item} expanded={expandedId===item.id}
              onToggle={handleToggle} onDismiss={handleDismiss} onMarkRead={handleMarkRead}/>
          ))}
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-[#94a3b8] dark:text-[#64748b] pt-1 pb-2">
        {displayItems.length} notification{displayItems.length!==1?"s":""}{activeFCount>0&&<span className="text-[#2563eb] font-medium"> (filtered)</span>}
        {" "}· {displayItems.filter(n=>n.unread).length} unread
      </p>
    </div>
  );
}

// ─── Subscription panel ───────────────────────────────────────────────────────

const SUB_ORG = TENANTS.find(t => t.id === 3); // Vanta Logistics — Growth SaaS
const SUB_TIER_DEF = SAAS_TIERS[SUB_ORG.tier];
const SUB_LIMITS = getLimits(SUB_ORG);

function SubMeter({ icon: Icon, label, used, limit, unit = "", color = "#2563eb" }) {
  const pct = (limit != null && limit > 0) ? Math.min(100, Math.round((used / limit) * 100)) : null;
  const warn = pct != null && pct >= 80;
  const barColor = pct >= 90 ? "#ef4444" : pct >= 80 ? "#f59e0b" : color;
  const fv = v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-[#475569] dark:text-[#94a3b8] font-medium">
          {Icon && <Icon size={12} />}{label}
        </span>
        <span className={`font-semibold tabular-nums ${warn ? "text-[#d97706]" : "text-[#0f172a] dark:text-[#f1f5f9]"}`}>
          {used != null ? fv(used) : "—"}
          {limit != null ? `${unit} / ${fv(limit)}${unit}` : "  Unlimited"}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#f1f5f9] dark:bg-[#334155] overflow-hidden">
        {pct != null
          ? <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
          : <div className="h-full rounded-full bg-[#2563eb] w-full opacity-20" />
        }
      </div>
      {pct != null && <p className="text-[10px] text-[#94a3b8] text-right">{pct}% used</p>}
    </div>
  );
}

function SubscriptionPanel(){
  const usage = SUB_ORG.usage;
  return(
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium text-[#0f172a] dark:text-[#f1f5f9] leading-7">Subscription</h2>
        <p className="text-base text-[#4e4d4d] dark:text-[#94a3b8] leading-6">Your current plan, limits, and billing details.</p>
      </div>

      {/* Plan card */}
      <div className="rounded-xl overflow-hidden border border-[#2563eb]/30">
        <div className="bg-gradient-to-br from-[#1d4ed8] to-[#2563eb] px-5 py-4 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest opacity-70">SaaS Cloud</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">MOST POPULAR</span>
              </div>
              <h3 className="text-2xl font-bold">Growth</h3>
              <p className="text-sm opacity-70 mt-0.5">{SUB_TIER_DEF.seatRange} · {SUB_ORG.seats} seats provisioned</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${SUB_TIER_DEF.pricePerSeat}<span className="text-sm font-normal opacity-70">/seat/mo</span></p>
              <p className="text-xs opacity-60 mt-0.5">Tokens: ${SUB_TIER_DEF.tokenRatePerM?.toFixed(2)}/1M</p>
            </div>
          </div>
        </div>
        <div className="bg-[#eff6ff] dark:bg-[#1e3a8a]/20 px-5 py-3 flex flex-wrap gap-x-4 gap-y-1">
          {[
            ["SSO & RBAC", true],
            ["Audit Logs", SUB_TIER_DEF.auditLogs],
            ["Priority Support", true],
            ["HIPAA-Ready", SUB_TIER_DEF.hipaa],
            ["99.9% Uptime SLA", true],
          ].map(([label, enabled]) => (
            <span key={label} className={`flex items-center gap-1 text-xs font-medium ${enabled ? "text-[#1e40af] dark:text-[#93c5fd]" : "text-[#cbd5e1] line-through"}`}>
              {enabled ? <BadgeCheck size={12} className="text-[#16a34a]" /> : <X size={12} />}{label}
            </span>
          ))}
        </div>
      </div>

      {/* Usage meters */}
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9] mb-2">Current Usage — April 2025</h3>
        <div className="flex flex-col gap-3">
          <SubMeter icon={Users}     label="Seats"                used={usage.seatsUsed}       limit={SUB_ORG.seats}               color="#0ea5e9" />
          <SubMeter icon={Zap}       label="Flow Executions / mo" used={usage.flowExecutions}   limit={SUB_LIMITS.flowExecPerMonth}  color="#16a34a" />
          <SubMeter icon={HardDrive} label="Knowledge Hub"        used={usage.storageGB}        limit={SUB_LIMITS.knowledgeHubGB}   unit=" GB" color="#f59e0b" />
          <SubMeter icon={Workflow}  label="Agents"               used={8}                      limit={SUB_LIMITS.agents}           color="#2563eb" />
          <SubMeter icon={Workflow}  label="Workflows"            used={7}                      limit={SUB_LIMITS.workflows}        color="#7c3aed" />
        </div>
      </div>

      {/* Billing contact */}
      <div className="bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#f1f5f9] mb-3">Billing Contact</h3>
        <div className="flex flex-col gap-2 text-sm text-[#64748b] dark:text-[#94a3b8]">
          <span className="flex items-center gap-2"><Users size={13} />{SUB_ORG.contactName}</span>
          <span className="flex items-center gap-2"><Mail size={13} />{SUB_ORG.contactEmail}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-2 p-4 bg-[#0f172a] dark:bg-[#1e293b] rounded-xl text-white">
        <p className="text-sm font-semibold">Need to upgrade or change your plan?</p>
        <p className="text-xs text-[#94a3b8] leading-4">Billing is managed manually. Contact our sales team to upgrade tiers, adjust seat counts, or discuss enterprise agreements.</p>
        <a href="mailto:sales@aziro.com"
          className="mt-1 inline-flex items-center gap-2 h-8 px-4 rounded-[8px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold w-fit transition-colors">
          <Mail size={12} /> Contact Sales
        </a>
      </div>
    </div>
  );
}

// ─── Placeholder panel ────────────────────────────────────────────────────────

function PlaceholderPanel({section}){
  const label=SETTINGS_NAV.find(n=>n.id===section)?.label??section;
  return(
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-medium text-[#0f172a] dark:text-[#f1f5f9] leading-7">{label}</h2>
      <p className="text-base text-[#4e4d4d] dark:text-[#94a3b8] leading-6">This section is coming soon.</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SettingsAppearancePage({ onNavigate, initialSection="appearance" }){
  const [activeSection, setActiveSection] = useState(initialSection);

  const activeLabel = SETTINGS_NAV.find(n=>n.id===activeSection)?.label ?? activeSection;

  return(
    <div className="flex min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="settings" onNavigate={onNavigate}/>

      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader onNavigate={onNavigate}>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-px h-6 bg-[#e2e8f0] dark:bg-[#334155]"/>
            <nav className="flex items-center gap-[10px]">
              <span className="text-sm text-[#64748b] dark:text-[#94a3b8] whitespace-nowrap">Settings</span>
              <ChevronRight size={14} className="text-[#94a3b8] dark:text-[#64748b]"/>
              <span className="text-sm text-[#0f172a] dark:text-[#f1f5f9] whitespace-nowrap">{activeLabel}</span>
            </nav>
          </div>
        </AppHeader>

        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto px-6 py-4 gap-4">
          <div className="flex flex-col gap-0">
            <h1 className="text-2xl font-semibold text-[#0f172a] dark:text-[#f1f5f9] tracking-[-0.6px] leading-8">Settings</h1>
            <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-5">Manage your preferences</p>
          </div>

          <div className="flex flex-1 gap-4 items-start min-h-0">
            {/* Left settings nav */}
            <div className="flex flex-col gap-1 w-[216px] flex-shrink-0">
              {SETTINGS_NAV.map(({icon:Icon,label,id})=>(
                <button key={id} onClick={()=>setActiveSection(id)} aria-current={activeSection===id?"page":undefined}
                  className={`flex items-center gap-2 px-2 h-8 rounded-[6px] text-sm w-full text-left transition-colors ${
                    activeSection===id
                      ?"bg-[#d3d3d3]/60 text-[#363636] font-medium"
                      :"text-[#363636] hover:bg-[#d3d3d3]/40"}`}>
                  <Icon size={16} className="flex-shrink-0"/>
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>

            {/* Right content card */}
            <div className="flex-1 min-w-0 bg-card border-2 border-border rounded-xl shadow-2xs p-6">
              {activeSection==="appearance"    && <AppearancePanel/>}
              {activeSection==="notifications" && <NotificationsPanel/>}
              {activeSection==="subscription"  && <SubscriptionPanel/>}
              {!["appearance","notifications","subscription"].includes(activeSection) && <PlaceholderPanel section={activeSection}/>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
