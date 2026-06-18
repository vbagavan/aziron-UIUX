import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import ConnectionsPanel from "@/components/connections/ConnectionsPanel.jsx";
import { useConnectionsStore } from "@/lib/connections/store.js";
import { CONNECTORS_SECTION } from "@/lib/connectorsNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";

// ─── Settings nav ──────────────────────────────────────────────────────────────

const SETTINGS_NAV = [
  { icon: UserCircle,  label: "Account",       id: "account",       comingSoon: true },
  { icon: SwatchBook,  label: "Appearance",    id: "appearance" },
  { icon: KeyRound,    label: "API Keys",      id: "api-keys",      comingSoon: true },
  { icon: Bell,        label: "Notifications", id: "notifications" },
  { icon: LayoutGrid,  label: "Connectors",    id: "connectors",    permission: "settings.connectors" },
  { icon: CreditCard,  label: "Subscription",  id: "subscription" },
  { icon: HelpCircle,  label: "Support",       id: "support",       comingSoon: true },
];

// ─── Appearance assets ────────────────────────────────────────────────────────

const themeColors = [
  { id:"blue",          label:"Blue theme",          gradient:"linear-gradient(135deg,#5c70e8 0%,#2d3ec8 100%)" },
  { id:"blaze-orange",  label:"Blaze Orange theme",  gradient:"linear-gradient(135deg,#fca83a 0%,#c86800 100%)" },
  { id:"amethyst-haze", label:"Amethyst Haze theme", gradient:"linear-gradient(135deg,#b070d8 0%,#7030b0 100%)" },
  { id:"graphite",      label:"Graphite theme",      gradient:"linear-gradient(135deg,#4a7898 0%,#1e4862 100%)" },
];

function ModePreviewFrame({
  selected,
  className = "",
  style,
  children,
  selectedBorderClass = "border-foreground",
  unselectedBorderClass = "border-border",
  checkBgClass = "bg-foreground",
  checkColorClass = "text-background",
}) {
  return (
    <div
      className={`w-full flex-1 min-h-0 rounded-[6px] border-2 flex items-center justify-center p-2 relative ${selected ? selectedBorderClass : unselectedBorderClass} ${className}`}
      style={style}
    >
      {selected && (
        <div className={`absolute top-2 right-2 size-4 rounded-full ${checkBgClass} flex items-center justify-center`}>
          <Check size={10} className={checkColorClass} strokeWidth={3} />
        </div>
      )}
      {children}
    </div>
  );
}

function LightPreview({ selected }) {
  return (
    <ModePreviewFrame
      selected={selected}
      className="bg-white"
      selectedBorderClass="border-slate-900"
      unselectedBorderClass="border-slate-300"
      checkBgClass="bg-slate-900"
      checkColorClass="text-white"
    >
      <div className="w-full flex flex-col gap-2">
        <div className="h-2 bg-slate-300 rounded-full w-3/4" />
        <div className="h-2 bg-slate-300 rounded-full w-1/2" />
      </div>
    </ModePreviewFrame>
  );
}
function DarkPreview({ selected }) {
  return (
    <ModePreviewFrame
      selected={selected}
      className="bg-[#0d1117]"
      selectedBorderClass="border-white"
      unselectedBorderClass="border-[#3a3f52]"
      checkBgClass="bg-white"
      checkColorClass="text-slate-900"
    >
      <div className="w-full flex flex-col gap-2">
        <div className="h-2 bg-[#3a3f52] rounded-full w-3/4" />
        <div className="h-2 bg-[#3a3f52] rounded-full w-1/2" />
      </div>
    </ModePreviewFrame>
  );
}
function SystemPreview({ selected }) {
  return (
    <ModePreviewFrame
      selected={selected}
      className="overflow-hidden"
      style={{ background: "linear-gradient(135deg,#f0f6fc 0%,#0d1117 100%)" }}
      selectedBorderClass="border-slate-900"
      unselectedBorderClass="border-slate-500"
      checkBgClass="bg-white"
      checkColorClass="text-slate-900"
    >
      <div className="w-full flex flex-col gap-2">
        <div className="h-2 bg-[rgba(153,161,175,0.7)] rounded-full w-3/4" />
        <div className="h-2 bg-[rgba(153,161,175,0.7)] rounded-full w-1/2" />
      </div>
    </ModePreviewFrame>
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
            {id:"light",  label:"Light",  Preview:LightPreview},
            {id:"dark",   label:"Dark",   Preview:DarkPreview},
            {id:"system", label:"System", Preview:SystemPreview},
          ].map(({id,label,Preview})=>(
            <button key={id} onClick={()=>setThemeMode(id)} aria-label={`${label} mode`}
              className="flex flex-col gap-2 items-center flex-1 min-w-[120px] max-w-[200px]">
              <div className="w-full h-24 flex"><Preview selected={themeMode===id}/></div>
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
  Approve:"bg-success text-success-foreground hover:bg-success/90",
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
          {hasAny&&<span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">{countFilters(filters)}</span>}
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
                aria-label="Dismiss notification"
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 flex items-center justify-center size-5 rounded-full text-muted-foreground hover:bg-muted dark:hover:bg-muted transition-all">
                <X size={12} aria-hidden/>
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
                  ?"bg-primary text-primary-foreground border-border hover:bg-muted"
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
              aria-pressed={active}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                active?"border-primary text-primary font-semibold":"border-transparent text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-muted"}`}>
              {label}
              {cnt>0&&<span className={`flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-xs font-bold ${active?"bg-primary text-primary-foreground":"bg-muted dark:bg-border text-muted-foreground dark:text-muted-foreground"}`}>{cnt}</span>}
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
      <div className="flex flex-col gap-2 p-4 bg-foreground dark:bg-card rounded-xl text-background dark:text-foreground">
        <p className="text-sm font-semibold">Need to upgrade or change your plan?</p>
        <p className="text-xs text-muted-foreground leading-4">Billing is managed manually. Contact our sales team to upgrade tiers, adjust seat counts, or discuss enterprise agreements.</p>
        <a href="mailto:sales@aziro.com"
          className="mt-1 inline-flex items-center gap-2 h-8 px-4 rounded-[8px] bg-primary hover:bg-muted text-primary-foreground text-xs font-semibold w-fit transition-colors">
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

const VALID_SECTIONS = new Set(SETTINGS_NAV.map((n) => n.id));

function SettingsConnectorsUnavailable() {
  return (
    <div className="flex flex-col gap-2 py-6">
      <h2 className="text-lg font-medium leading-7 text-foreground">Connectors</h2>
      <p className="text-sm text-muted-foreground">
        You don&apos;t have permission to manage workspace connectors. Contact your administrator if you need access.
      </p>
    </div>
  );
}

export default function SettingsAppearancePage({ onNavigate, initialSection = "appearance" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { can } = usePermissions();
  const canManageConnectors = can("settings.connectors");
  const visibleNav = SETTINGS_NAV.filter(
    (item) => !item.permission || can(item.permission),
  );
  const sectionFromUrl = searchParams.get("section");
  const resolvedInitial =
    sectionFromUrl && visibleNav.some((n) => n.id === sectionFromUrl)
      ? sectionFromUrl
      : initialSection;
  const [activeSection, setActiveSection] = useState(resolvedInitial);
  const openWizard = useConnectionsStore((s) => s.openWizard);
  const openWizardWithProvider = useConnectionsStore((s) => s.openWizardWithProvider);
  const handledCatalogKeyRef = useRef(null);

  useEffect(() => {
    const section = searchParams.get("section");
    if (section && visibleNav.some((n) => n.id === section)) {
      setActiveSection(section);
      return;
    }
    if (section === CONNECTORS_SECTION && !canManageConnectors) {
      setActiveSection("appearance");
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("section", "appearance");
          next.delete("new");
          next.delete("provider");
          return next;
        },
        { replace: true },
      );
    }
  }, [searchParams, visibleNav, canManageConnectors, setSearchParams]);

  useEffect(() => {
    if (activeSection !== CONNECTORS_SECTION || !canManageConnectors) return;

    const providerId = searchParams.get("provider");
    const openNew = searchParams.get("new") === "1";
    const catalogKey = `${providerId ?? ""}:${openNew ? "new" : ""}`;

    if (!providerId && !openNew) {
      handledCatalogKeyRef.current = null;
      return;
    }

    if (handledCatalogKeyRef.current === catalogKey) return;
    handledCatalogKeyRef.current = catalogKey;

    if (providerId) {
      openWizardWithProvider(providerId);
    } else {
      window.setTimeout(() => openWizard(), 0);
    }

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("provider");
        next.delete("new");
        return next;
      },
      { replace: true },
    );
  }, [activeSection, searchParams, canManageConnectors, openWizard, openWizardWithProvider, setSearchParams]);

  function selectSection(id) {
    setActiveSection(id);
    if (id !== CONNECTORS_SECTION) {
      handledCatalogKeyRef.current = null;
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("section", id);
        next.delete("new");
        next.delete("provider");
        return next;
      },
      { replace: true },
    );
  }

  const activeLabel = visibleNav.find((n) => n.id === activeSection)?.label ?? activeSection;
  const pageSubtitle =
    activeSection === CONNECTORS_SECTION
      ? KNOWLEDGE_TERMS.connectorsSettingsDescription
      : "Manage your preferences";

  return(
    <main className="flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="settings" onNavigate={onNavigate}/>

      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader onNavigate={onNavigate}>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-px h-6 bg-border dark:bg-border"/>
            <nav className="flex min-w-0 items-center gap-2 overflow-x-auto">
              <span className="shrink-0 text-sm text-muted-foreground whitespace-nowrap">Settings</span>
              <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
              <span className="truncate text-sm text-foreground">{activeLabel}</span>
            </nav>
          </div>
        </AppHeader>

        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto px-4 py-4 gap-4 sm:px-6">
          <div className="flex flex-col gap-0">
            <h1 className="type-page-title">Settings</h1>
            <p className="text-sm text-muted-foreground leading-5">{pageSubtitle}</p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-start">
            {/* Settings nav — horizontal scroll on mobile, sidebar on lg+ */}
            <nav
              aria-label="Settings sections"
              className="flex shrink-0 gap-1 overflow-x-auto pb-1 lg:w-[216px] lg:flex-col lg:overflow-visible lg:pb-0"
            >
              {visibleNav.map(({ icon: Icon, label, id, comingSoon }) => {
                const isActive = activeSection === id;
                return (
                  <Button
                    key={id}
                    type="button"
                    variant="ghost"
                    onClick={() => selectSection(id)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "h-8 shrink-0 justify-start gap-2 rounded-md border-l-2 pl-1.5 pr-3 text-sm font-normal lg:w-full lg:pr-2",
                      isActive
                        ? "border-primary bg-primary/15 font-medium text-foreground"
                        : "border-transparent text-foreground hover:bg-muted/40",
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", isActive && "text-primary")} />
                    <span className="whitespace-nowrap">{label}</span>
                    {comingSoon ? (
                      <Badge variant="outline" className="ml-auto hidden text-[10px] lg:inline-flex">
                        Soon
                      </Badge>
                    ) : null}
                  </Button>
                );
              })}
            </nav>

            {/* Right content card */}
            <div className="min-w-0 flex-1 rounded-xl border-2 border-border bg-card p-4 shadow-2xs sm:p-6">
              {activeSection==="appearance"    && <AppearancePanel/>}
              {activeSection==="notifications" && <NotificationsPanel/>}
              {activeSection==="subscription"  && <SubscriptionPanel/>}
              {activeSection === "connectors" && canManageConnectors ? <ConnectionsPanel /> : null}
              {activeSection === "connectors" && !canManageConnectors ? <SettingsConnectorsUnavailable /> : null}
              {!["appearance","notifications","subscription","connectors"].includes(activeSection) && <PlaceholderPanel section={activeSection}/>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
