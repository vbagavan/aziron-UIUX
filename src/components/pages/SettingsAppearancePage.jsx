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
import { useTheme } from "@/context/ThemeContext";
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

const themeColors = [
  { id:"blue",   label:"Blue theme",   gradient:"linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%)" },
  { id:"green",  label:"Green theme",  gradient:"linear-gradient(135deg,#22c55e 0%,#15803d 100%)" },
  { id:"orange", label:"Orange theme", gradient:"linear-gradient(135deg,#f97316 0%,#c2410c 100%)" },
  { id:"purple", label:"Purple theme", gradient:"linear-gradient(135deg,#a855f7 0%,#7e22ce 100%)" },
];

function LightPreview(){
  return(
    <div className="w-full flex-1 min-h-0 bg-muted rounded-[6px] border-2 border-border flex items-center justify-center p-2">
      <div className="w-full flex flex-col gap-2">
        <div className="h-2 bg-muted rounded-full w-3/4"/>
        <div className="h-2 bg-muted rounded-full w-1/2"/>
      </div>
    </div>
  );
}
function DarkPreview({ selected }){
  return(
    <div className={`w-full flex-1 min-h-0 bg-muted rounded-[6px] border-2 flex items-center justify-center p-2 relative ${selected?"border-foreground":"border-border"}`}>
      {selected&&(<div className="absolute top-2 right-2 size-4 rounded-full bg-foreground flex items-center justify-center"><Check size={10} className="text-white"/></div>)}
      <div className="w-full flex flex-col gap-2">
        <div className="h-2 bg-muted rounded-full w-3/4"/>
        <div className="h-2 bg-muted rounded-full w-1/2"/>
      </div>
    </div>
  );
}
function SystemPreview(){
  return(
    <div className="w-full flex-1 min-h-0 rounded-[6px] border-2 border-border overflow-hidden flex items-center justify-center p-2" style={{background:"linear-gradient(135deg,#f0f6fc 0%,#0d1117 100%)"}}>
      <div className="w-full flex flex-col gap-2">
        <div className="h-2 bg-[rgba(153,161,175,0.5)] rounded-full w-3/4"/>
        <div className="h-2 bg-[rgba(153,161,175,0.5)] rounded-full w-1/2"/>
      </div>
    </div>
  );
}

// ─── Appearance panel ─────────────────────────────────────────────────────────

function AppearancePanel(){
  const { color: themeColor, mode: themeMode, setThemeColor, setThemeMode } = useTheme();
  return(
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium text-foreground dark:text-foreground leading-7">Appearance</h2>
        <p className="text-base text-foreground dark:text-muted-foreground leading-6">Manage your appearance settings and preferences.</p>
      </div>

      {/* Theme Color */}
      <div className="flex flex-col gap-4">
        <p className="text-base font-semibold text-foreground dark:text-foreground leading-6">Theme Color</p>
        <div className="flex items-center gap-4">
          {themeColors.map(({id,label,gradient})=>(
            <button key={id} onClick={()=>setThemeColor(id)} aria-label={label} title={label}
              className={`relative size-8 rounded-full flex-shrink-0 transition-all ${themeColor===id?"ring-2 ring-offset-2 ring-foreground scale-110":"hover:scale-110"}`}
              style={{ background: gradient }}>
              {themeColor===id && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check size={13} className="text-white drop-shadow" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Mode */}
      <div className="flex flex-col gap-4">
        <p className="text-xl font-medium text-foreground dark:text-foreground leading-7 tracking-[-0.6px]">Theme Mode</p>
        <div className="flex gap-4">
          {[
            {id:"light",  label:"Light",  Preview:()=><LightPreview/>},
            {id:"dark",   label:"Dark",   Preview:()=><DarkPreview selected={themeMode==="dark"}/>},
            {id:"system", label:"System", Preview:()=><SystemPreview/>},
          ].map(({id,label,Preview})=>(
            <button key={id} onClick={()=>setThemeMode(id)} aria-label={`${label} mode`}
              className="flex flex-col gap-2 items-center flex-1 min-w-[120px] max-w-[200px]">
              <div className="w-full h-24 flex"><Preview/></div>
              <span className={`text-sm font-medium leading-5 ${themeMode===id?"text-foreground dark:text-foreground":"text-muted-foreground dark:text-muted-foreground"}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Notifications panel ──────────────────────────────────────────────────────

const NOTIF_DATA = [
  { id:"c1", type:"critical", category:"security",  avatarBg:"var(--muted-foreground)", avatarInitials:"PR", BadgeIcon:ServerCrash,   badgeBg:"var(--destructive)", title:"Production deployment failure",     desc:"main branch · deploy #847 crashed at runtime",                tag:"PROD",     time:"Just now",   unread:true,  persistent:true  },
  { id:"c2", type:"critical", category:"security",  avatarBg:"var(--destructive)", avatarInitials:"CV", BadgeIcon:ShieldAlert,   badgeBg:"var(--destructive)", title:"Security vulnerability detected",    desc:"CVE-2024-1234 (critical) in lodash@4.17.11",                   tag:"CVE",      time:"5 min ago",  unread:true,  persistent:true  },
  { id:"c3", type:"critical", category:"general",   avatarBg:"var(--primary)", avatarInitials:"AI", BadgeIcon:Bot,           badgeBg:"var(--destructive)", title:"AI agent execution failure",         desc:"Customer Support Agent · unhandled exception in run #23",      tag:"AGENT",    time:"12 min ago", unread:true,  persistent:true  },
  { id:"c4", type:"critical", category:"security",  avatarBg:"var(--destructive)", avatarInitials:"UA", BadgeIcon:ShieldX,       badgeBg:"var(--destructive)", title:"Unauthorized access attempt",        desc:"IP 203.0.113.42 · 14 failed logins on admin panel",             tag:"SECURITY", time:"18 min ago", unread:true,  persistent:true  },
  { id:"w1", type:"warning",  category:"general",   avatarBg:"var(--warning)", avatarInitials:"CI", BadgeIcon:Zap,           badgeBg:"var(--warning)", title:"Build pipeline instability",         desc:"CI/CD · 3 of last 5 runs failed — flaky test suspected",       tag:"CI/CD",    time:"45 min ago", unread:true                   },
  { id:"w2", type:"warning",  category:"general",   avatarBg:"var(--warning)", avatarInitials:"AP", BadgeIcon:Gauge,         badgeBg:"var(--warning)", title:"API latency spike detected",         desc:"p95 → 1.4s · 340% above baseline",                             tag:"API",      time:"1h ago",     unread:false                  },
  { id:"w3", type:"warning",  category:"general",   avatarBg:"var(--warning)", avatarInitials:"TC", BadgeIcon:FlaskConical,  badgeBg:"var(--warning)", title:"Test coverage below threshold",      desc:"Coverage dropped to 68% · minimum required: 80%",              tag:"TESTS",    time:"2h ago",     unread:false                  },
  { id:"w4", type:"warning",  category:"general",   avatarBg:"var(--chart-chart-4)", avatarInitials:"DP", BadgeIcon:DatabaseZap,  badgeBg:"var(--warning)", title:"Data pipeline near capacity",        desc:"Queue utilisation at 89% · auto-scaling triggered",            tag:"PIPELINE", time:"3h ago",     unread:false                  },
  { id:"s1", type:"success",  category:"general",   avatarBg:"var(--success)", avatarInitials:"PR", BadgeIcon:Rocket,        badgeBg:"var(--success)", title:"Production deployment successful",   desc:"v2.4.1 deployed to prod · 0 errors · 12s build",               tag:"DEPLOY",   time:"3h ago",     unread:false                  },
  { id:"s2", type:"success",  category:"general",   avatarBg:"var(--success)", avatarInitials:"GH", BadgeIcon:GitMerge,      badgeBg:"var(--success)", title:"PR #1247 merged — AI review passed", desc:"feat: knowledge-hub picker · reviewed by Aziron AI",          tag:"PR",       time:"4h ago",     unread:false                  },
  { id:"a1", type:"approval", category:"approval",  avatarBg:"var(--primary)", avatarInitials:"AI", BadgeIcon:GitPullRequest,badgeBg:"var(--primary)", title:"AI-generated code pending review",   desc:"Aziron AI proposes 3 file changes in CustomerAgent.js",        tag:"CODE",     time:"15 min ago", unread:true,  persistent:true, actions:["Review","Approve","Reject"] },
  { id:"a2", type:"approval", category:"approval",  avatarBg:"var(--primary)", avatarInitials:"JA", BadgeIcon:Rocket,        badgeBg:"var(--primary)", title:"Deployment approval required",       desc:"staging → production · v2.5.0-rc.1 · requested by Jay",       tag:"DEPLOY",   time:"30 min ago", unread:true,  persistent:true, actions:["Approve","Reject"] },
  { id:"a3", type:"approval", category:"approval",  avatarBg:"var(--primary)", avatarInitials:"SE", BadgeIcon:ShieldAlert,   badgeBg:"var(--primary)", title:"Security exception awaiting review", desc:"CORS bypass requested for partner API integration",            tag:"SECURITY", time:"1h ago",     unread:false, persistent:true, actions:["Review"], category2:"security" },
  { id:"a4", type:"approval", category:"approval",  avatarBg:"var(--primary)", avatarInitials:"WF", BadgeIcon:Clock,         badgeBg:"var(--primary)", title:"Workflow paused — human decision",   desc:"Invoice reconciliation agent waiting at step 4 of 7",          tag:"WORKFLOW", time:"2h ago",     unread:false, persistent:true, actions:["Review","Approve"] },
];

const TYPE_CFG = {
  critical:{ bar:"var(--destructive)", dot:"var(--destructive)", label:"CRITICAL", labelColor:"var(--destructive)" },
  warning: { bar:"var(--warning)", dot:"var(--warning)", label:"WARNING",  labelColor:"var(--warning)" },
  success: { bar:"var(--success)", dot:"var(--success)", label:"SUCCESS",  labelColor:"var(--success)" },
  approval:{ bar:"var(--primary)", dot:"var(--primary)", label:"APPROVAL", labelColor:"var(--primary)" },
};

const ACTION_STYLE = {
  Approve:"bg-success text-white hover:bg-muted",
  Reject: "border border-border text-destructive bg-card dark:bg-card hover:bg-destructive/10",
  Review: "border border-border text-primary bg-card dark:bg-card hover:bg-primary/10",
};

const NOTIF_TABS = [
  {key:"all",       label:"All"      },
  {key:"approvals", label:"Approvals"},
  {key:"security",  label:"Security" },
  {key:"unread",    label:"Unread"   },
];

const FILTER_TYPE_OPTIONS = [
  {value:"critical",label:"Critical",color:"var(--destructive)"},
  {value:"warning", label:"Warning", color:"var(--warning)"},
  {value:"success", label:"Success", color:"var(--success)"},
  {value:"approval",label:"Approval",color:"var(--primary)"},
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
    <div ref={ref} className="absolute right-0 top-full mt-2 z-50 bg-card dark:bg-card border border-border dark:border-border rounded-[12px] w-[260px]"
      style={{boxShadow:"0 8px 32px rgba(15,23,42,0.12)"}}>
      <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-border dark:border-border">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={13} className="text-muted-foreground dark:text-muted-foreground"/>
          <span className="text-sm font-semibold text-foreground dark:text-foreground">Filters</span>
          {hasAny&&<span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-xs font-bold">{countFilters(filters)}</span>}
        </div>
        {hasAny&&<button onClick={()=>onChange(EMPTY_FILTERS)} className="text-xs text-destructive font-medium hover:text-destructive">Clear all</button>}
      </div>
      <div className="flex flex-col gap-3 p-3">
        <div>
          <p className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground mb-1.5">Type</p>
          {FILTER_TYPE_OPTIONS.map(({value,label,color})=>{
            const active=filters.types.includes(value);
            return(
              <button key={value} onClick={()=>toggle("types",value)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-[5px] text-sm w-full text-left transition-colors ${active?"bg-background":"hover:bg-muted dark:hover:bg-muted"}`}>
                <span className="flex-shrink-0 flex items-center justify-center size-4 rounded border-2 transition-colors" style={active?{backgroundColor:color,borderColor:color}:{borderColor:"var(--border)"}}>
                  {active&&<svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </span>
                <span className="size-2 rounded-full flex-shrink-0" style={{backgroundColor:color}}/>
                <span className={`text-sm ${active?"font-medium text-foreground dark:text-foreground":"text-muted-foreground dark:text-muted-foreground"}`}>{label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{NOTIF_DATA.filter(n=>n.type===value).length}</span>
              </button>
            );
          })}
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground mb-1.5">Status</p>
          {FILTER_STATUS_OPTIONS.map(({value,label})=>{
            const active=filters.statuses.includes(value);
            return(
              <button key={value} onClick={()=>toggle("statuses",value)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-[5px] text-sm w-full text-left transition-colors ${active?"bg-background":"hover:bg-muted dark:hover:bg-muted"}`}>
                <span className={`flex-shrink-0 flex items-center justify-center size-4 rounded border-2 transition-colors ${active?"bg-primary border-border":"border-border"}`}>
                  {active&&<svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </span>
                <span className={`text-sm ${active?"font-medium text-foreground dark:text-foreground":"text-muted-foreground dark:text-muted-foreground"}`}>{label}</span>
              </button>
            );
          })}
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground mb-1.5">Tag</p>
          <div className="flex flex-wrap gap-1">
            {ALL_TAGS.map(tag=>{
              const active=filters.tags.includes(tag);
              const color=TYPE_CFG[NOTIF_DATA.find(n=>n.tag===tag)?.type]?.bar??"var(--muted-foreground)";
              return(
                <button key={tag} onClick={()=>toggle("tags",tag)}
                  className={`px-2 py-[2px] rounded text-xs font-bold tracking-wide border transition-all ${active?"text-white border-transparent":"text-muted-foreground dark:text-muted-foreground bg-background border-border dark:border-border"}`}
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
    <div className={`group relative rounded-[10px] border border-border dark:border-border bg-card dark:bg-background/40 transition-all duration-200 cursor-pointer ${expanded?"shadow-sm":""} hover:shadow-sm`}
      onClick={()=>onToggle(item.id)}>
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className="flex-shrink-0 flex items-center justify-center w-3 mt-[18px]">
          {item.unread
            ?<div className={`size-2 rounded-full ${item.type==="critical"?"animate-pulse":""}`} style={{backgroundColor:cfg.dot,opacity:item.type==="critical"?1:0.6}}/>
            :<div className="size-2 rounded-full bg-border dark:bg-border"/>}
        </div>
        <div className="relative flex-shrink-0 mt-0.5">
          <div className="size-10 rounded-full flex items-center justify-center text-white text-sm font-bold select-none"
            style={{backgroundColor:item.avatarBg}}>{item.avatarInitials}</div>
          <div className="absolute -bottom-1 -right-1 size-[18px] rounded-full border-2 border-card dark:border-border flex items-center justify-center"
            style={{backgroundColor:item.badgeBg}}>
            <BadgeIcon size={9} color="white" strokeWidth={2.5}/>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm text-foreground dark:text-foreground leading-snug ${item.unread?"font-semibold":"font-medium"}`}>{item.title}</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
              <button onClick={e=>{e.stopPropagation();onDismiss(item.id);}}
                className="opacity-0 group-hover:opacity-100 flex items-center justify-center size-5 rounded-full text-muted-foreground hover:bg-muted dark:hover:bg-muted transition-all">
                <X size={12}/>
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5 leading-snug">{item.desc}</p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="px-1.5 py-[1px] rounded text-[10px] font-bold tracking-wide border"
              style={{color:cfg.labelColor,backgroundColor:`${cfg.bar}12`,borderColor:`${cfg.bar}30`}}>{item.tag}</span>
            <span className="text-[10px] font-semibold px-1.5 py-[1px] rounded border"
              style={{color:cfg.labelColor,backgroundColor:`${cfg.bar}10`,borderColor:`${cfg.bar}20`}}>{cfg.label}</span>
            {item.persistent&&<span className="text-[10px] text-muted-foreground bg-background border border-border dark:border-border px-1.5 py-[1px] rounded font-medium">persistent</span>}
            {item.unread&&(
              <button onClick={e=>{e.stopPropagation();onMarkRead(item.id);}}
                className="text-[10px] text-primary hover:text-primary font-medium transition-colors ml-auto">Mark as read</button>
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
          <h2 className="text-lg font-medium text-foreground dark:text-foreground leading-7">Notifications</h2>
          <p className="text-sm text-foreground dark:text-muted-foreground mt-0.5">
            {unreadCount>0
              ?<span>You have <span className="font-semibold text-foreground dark:text-foreground">{unreadCount} unread</span> notification{unreadCount!==1?"s":""}</span>
              :"All notifications are read"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount>0&&(
            <button onClick={handleMarkAll}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border border-border dark:border-border text-sm font-medium text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted transition-colors">
              <CheckCheck size={13}/> Mark all as read
            </button>
          )}
          <div className="relative">
            <button ref={filterBtnRef} onClick={()=>setFilterOpen(v=>!v)}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border text-sm font-medium transition-colors ${
                filterOpen||activeFCount>0
                  ?"bg-primary text-white border-border hover:bg-muted"
                  :"border-border dark:border-border text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted"}`}>
              <Filter size={13}/> Filter
              {activeFCount>0&&<span className="flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-card text-primary text-xs font-bold">{activeFCount}</span>}
            </button>
            {filterOpen&&<NotifFilterPanel filters={filters} onChange={setFilters} onClose={()=>setFilterOpen(false)} anchorRef={filterBtnRef}/>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border dark:border-border -mb-1">
        {NOTIF_TABS.map(({key,label})=>{
          const cnt=tabCount(key); const active=activeTab===key;
          return(
            <button key={key} onClick={()=>{setActiveTab(key);setExpandedId(null);}}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                active?"border-border text-primary":"border-transparent text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-muted"}`}>
              {label}
              {cnt>0&&<span className={`flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-xs font-bold ${active?"bg-primary text-white":"bg-muted dark:bg-border text-muted-foreground dark:text-muted-foreground"}`}>{cnt}</span>}
            </button>
          );
        })}
      </div>

      {/* Active filter chips */}
      {activeFCount>0&&(
        <div className="flex items-center gap-2 flex-wrap -mt-1">
          <span className="text-xs text-muted-foreground">Active:</span>
          {[
            ...filters.types.map(v=>({key:"types",value:v,label:v.charAt(0).toUpperCase()+v.slice(1),color:TYPE_CFG[v].bar})),
            ...filters.statuses.map(v=>({key:"statuses",value:v,label:FILTER_STATUS_OPTIONS.find(o=>o.value===v)?.label??v,color:"var(--muted-foreground)"})),
            ...filters.tags.map(v=>({key:"tags",value:v,label:v,color:TYPE_CFG[NOTIF_DATA.find(n=>n.tag===v)?.type]?.bar??"var(--muted-foreground)"})),
          ].map(({key,value,label,color})=>(
            <button key={`${key}-${value}`}
              onClick={()=>setFilters(prev=>({...prev,[key]:prev[key].filter(v=>v!==value)}))}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white hover:opacity-80"
              style={{backgroundColor:color}}>
              {label}<X size={9} strokeWidth={2.5}/>
            </button>
          ))}
          <button onClick={()=>setFilters(EMPTY_FILTERS)} className="text-xs text-muted-foreground hover:text-destructive font-medium transition-colors">Clear all</button>
        </div>
      )}

      {/* Notification list */}
      {displayItems.length===0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="size-14 rounded-full bg-background border border-border dark:border-border flex items-center justify-center">
            <BellOff size={22} className="text-border"/>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">No notifications match</p>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">Try adjusting your filters</p>
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
      <p className="text-xs text-muted-foreground dark:text-muted-foreground pt-1 pb-2">
        {displayItems.length} notification{displayItems.length!==1?"s":""}{activeFCount>0&&<span className="text-primary font-medium"> (filtered)</span>}
        {" "}· {displayItems.filter(n=>n.unread).length} unread
      </p>
    </div>
  );
}

// ─── Subscription panel ───────────────────────────────────────────────────────

const SUB_ORG = TENANTS.find(t => t.id === 3); // Vanta Logistics — Growth SaaS
const SUB_TIER_DEF = SAAS_TIERS[SUB_ORG.tier];
const SUB_LIMITS = getLimits(SUB_ORG);

function SubMeter({ icon: Icon, label, used, limit, unit = "", color = "var(--primary)" }) {
  const pct = (limit != null && limit > 0) ? Math.min(100, Math.round((used / limit) * 100)) : null;
  const warn = pct != null && pct >= 80;
  const barColor = pct >= 90 ? "var(--destructive)" : pct >= 80 ? "var(--warning)" : color;
  const fv = v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground dark:text-muted-foreground font-medium">
          {Icon && <Icon size={12} />}{label}
        </span>
        <span className={`font-semibold tabular-nums ${warn ? "text-warning" : "text-foreground dark:text-foreground"}`}>
          {used != null ? fv(used) : "—"}
          {limit != null ? `${unit} / ${fv(limit)}${unit}` : "  Unlimited"}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted dark:bg-border overflow-hidden">
        {pct != null
          ? <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
          : <div className="h-full rounded-full bg-primary w-full opacity-20" />
        }
      </div>
      {pct != null && <p className="text-[10px] text-muted-foreground text-right">{pct}% used</p>}
    </div>
  );
}

function SubscriptionPanel(){
  const usage = SUB_ORG.usage;
  return(
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium text-foreground dark:text-foreground leading-7">Subscription</h2>
        <p className="text-base text-foreground dark:text-muted-foreground leading-6">Your current plan, limits, and billing details.</p>
      </div>

      {/* Plan card */}
      <div className="rounded-xl overflow-hidden border border-border/30">
        <div className="bg-gradient-to-br from-[#1d4ed8] to-[#2563eb] px-5 py-4 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest opacity-70">SaaS Cloud</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-card/20">MOST POPULAR</span>
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
        <div className="bg-primary/10 dark:bg-primary/20/20 px-5 py-3 flex flex-wrap gap-x-4 gap-y-1">
          {[
            ["SSO & RBAC", true],
            ["Audit Logs", SUB_TIER_DEF.auditLogs],
            ["Priority Support", true],
            ["HIPAA-Ready", SUB_TIER_DEF.hipaa],
            ["99.9% Uptime SLA", true],
          ].map(([label, enabled]) => (
            <span key={label} className={`flex items-center gap-1 text-xs font-medium ${enabled ? "text-foreground dark:text-primary" : "text-border line-through"}`}>
              {enabled ? <BadgeCheck size={12} className="text-success" /> : <X size={12} />}{label}
            </span>
          ))}
        </div>
      </div>

      {/* Usage meters */}
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground dark:text-foreground mb-2">Current Usage — April 2025</h3>
        <div className="flex flex-col gap-3">
          <SubMeter icon={Users}     label="Seats"                used={usage.seatsUsed}       limit={SUB_ORG.seats}               color="var(--info)" />
          <SubMeter icon={Zap}       label="Flow Executions / mo" used={usage.flowExecutions}   limit={SUB_LIMITS.flowExecPerMonth}  color="var(--success)" />
          <SubMeter icon={HardDrive} label="Knowledge Hub"        used={usage.storageGB}        limit={SUB_LIMITS.knowledgeHubGB}   unit=" GB" color="var(--warning)" />
          <SubMeter icon={Workflow}  label="Agents"               used={8}                      limit={SUB_LIMITS.agents}           color="var(--primary)" />
          <SubMeter icon={Workflow}  label="Workflows"            used={7}                      limit={SUB_LIMITS.workflows}        color="var(--chart-chart-4)" />
        </div>
      </div>

      {/* Billing contact */}
      <div className="bg-background border border-border dark:border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground dark:text-foreground mb-3">Billing Contact</h3>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
          <span className="flex items-center gap-2"><Users size={13} />{SUB_ORG.contactName}</span>
          <span className="flex items-center gap-2"><Mail size={13} />{SUB_ORG.contactEmail}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-2 p-4 bg-foreground dark:bg-card rounded-xl text-white">
        <p className="text-sm font-semibold">Need to upgrade or change your plan?</p>
        <p className="text-xs text-muted-foreground leading-4">Billing is managed manually. Contact our sales team to upgrade tiers, adjust seat counts, or discuss enterprise agreements.</p>
        <a href="mailto:sales@aziro.com"
          className="mt-1 inline-flex items-center gap-2 h-8 px-4 rounded-[8px] bg-primary hover:bg-muted text-white text-xs font-semibold w-fit transition-colors">
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
      <h2 className="text-lg font-medium text-foreground dark:text-foreground leading-7">{label}</h2>
      <p className="text-base text-foreground dark:text-muted-foreground leading-6">This section is coming soon.</p>
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
            <div className="w-px h-6 bg-border dark:bg-border"/>
            <nav className="flex items-center gap-[10px]">
              <span className="text-sm text-muted-foreground dark:text-muted-foreground whitespace-nowrap">Settings</span>
              <ChevronRight size={14} className="text-muted-foreground dark:text-muted-foreground"/>
              <span className="text-sm text-foreground dark:text-foreground whitespace-nowrap">{activeLabel}</span>
            </nav>
          </div>
        </AppHeader>

        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto px-6 py-4 gap-4">
          <div className="flex flex-col gap-0">
            <h1 className="text-2xl font-semibold text-foreground dark:text-foreground tracking-[-0.6px] leading-8">Settings</h1>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-5">Manage your preferences</p>
          </div>

          <div className="flex flex-1 gap-4 items-start min-h-0">
            {/* Left settings nav */}
            <div className="flex flex-col gap-1 w-[216px] flex-shrink-0">
              {SETTINGS_NAV.map(({icon:Icon,label,id})=>(
                <button key={id} onClick={()=>setActiveSection(id)} aria-current={activeSection===id?"page":undefined}
                  className={`flex items-center gap-2 px-2 h-8 rounded-[6px] text-sm w-full text-left transition-colors ${
                    activeSection===id
                      ?"bg-muted/60 text-foreground font-medium"
                      :"text-foreground hover:bg-muted/40"}`}>
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
