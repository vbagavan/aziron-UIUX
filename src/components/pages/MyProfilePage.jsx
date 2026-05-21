import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail, Phone, MapPin, Calendar, ChevronRight, Edit2,
  Github, Linkedin, Globe, Twitter, Award, BookOpen,
  Paperclip, MessageSquare, User, Clock, BarChart3, FileText,
  Shield, DollarSign, Star, Briefcase, Network, Copy,
  CheckCircle2, ExternalLink, Building2, Hash, Zap, Check,
  Settings, MoreHorizontal,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { InsuranceContent } from "@/components/pages/EmployeeInsurancePage";

// ─── Mock data ────────────────────────────────────────────────────────────────

const PROFILE = {
  id: "EMP-2024-0042",
  name: "Jane Cooper",
  email: "jane@meridian.com",
  phone: "+91 98765 43210",
  avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  role: "Senior Product Designer",
  designation: "Lead Designer / Developer",
  department: "Product · Design Systems",
  businessUnit: "Digital Experiences",
  costCenter: "CC-4420",
  employeeType: "Full-time",
  workMode: "Hybrid",
  location: "Bangalore, India",
  joiningDate: "14 Mar 2022",
  status: "Active",
  website: "meridian.design/jane",
  completionPct: 72,
  followers: "2.4K",
  following: "318",
  bio: `I design systems that scale — from tokens to products. Obsessed with interaction clarity, structured components, and delightful micro-moments that make users feel at home.

  I believe great design isn't just how it looks, but how well it communicates intent. Every spacing decision, every label, every transition carries meaning.`,
  skills: [
    { name: "Figma",          pct: 95 },
    { name: "Prototyping",    pct: 88 },
    { name: "UX Research",    pct: 80 },
    { name: "Motion design",  pct: 72 },
    { name: "Framer",         pct: 65 },
  ],
  certifications: ["Google UX Design Certificate", "IxDF Interaction Design"],
  portfolio: [
    { icon: Github,   href: "#", label: "GitHub" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Twitter,  href: "#", label: "Twitter" },
    { icon: Globe,    href: "#", label: "Website" },
  ],
  reportingManager: { name: "David Chen", role: "VP of Product", initials: "DC" },
  directReports: [
    { name: "Aiden Park",  role: "UX Designer",      initials: "AP", color: "bg-blue-500"   },
    { name: "Priya Mehta", role: "Visual Designer",  initials: "PM", color: "bg-violet-500" },
    { name: "Lucas Nair",  role: "Design Engineer",  initials: "LN", color: "bg-emerald-500"},
  ],
  emergencyContact: { name: "Robert Cooper", relation: "Spouse", phone: "+91 99887 76655" },
};

const ACTIVITY = [
  {
    id: 1,
    type: "comment",
    user: "Jacqueline Steve",
    initials: "JS",
    color: "bg-primary",
    time: "Today at 05:16 PM",
    text: "We have changed 2 attributes on 05:16PM",
    body: "In an awareness campaign, it is vital for people to begin put 2 and 2 together and begin to recognize your cause. Too much or too little spacing, as in the example below, can make things unpleasant for the reader.",
  },
  {
    id: 2,
    type: "event",
    user: "Megan Elmore",
    initials: "ME",
    color: "bg-info",
    time: "Today at 04:45 PM",
    text: "Adding a new event with attachments · 04:45 PM",
    attachments: [
      { name: "Business Template – UI/UX design", size: "865 KB", icon: "figma" },
      { name: "Bank Management System – PSD",     size: "5.78 MB", icon: "psd"   },
    ],
  },
  {
    id: 3,
    type: "upload",
    user: "Priya Mehta",
    initials: "PM",
    color: "bg-violet-500",
    time: "Yesterday at 02:10 PM",
    text: "Uploaded the Q2 design review deck.",
  },
];

const TIMELINE = [
  { date: "Mar 2024", label: "Promoted to Senior Product Designer", icon: Award, color: "text-success bg-success/10 border-success/20" },
  { date: "Jan 2024", label: "Completed Google UX Design Certificate", icon: BookOpen, color: "text-info bg-info/10 border-info/20" },
  { date: "Sep 2023", label: "Led Design System v2.0 rollout", icon: Star, color: "text-warning bg-warning/10 border-warning/20" },
  { date: "Mar 2022", label: "Joined as Product Designer", icon: Briefcase, color: "text-primary bg-primary/10 border-primary/20" },
];

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, copyable }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="flex items-start justify-between gap-2 group">
      <div className="flex items-start gap-2 min-w-0">
        <Icon size={13} className="text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="type-caption leading-none mb-0.5">{label}</p>
          <p className="text-xs font-medium text-foreground truncate">{value}</p>
        </div>
      </div>
      {copyable && (
        <button onClick={copy} aria-label={copied ? `Copied ${label}` : `Copy ${label}`} className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity">
          {copied
            ? <CheckCircle2 size={12} className="text-success" aria-hidden />
            : <Copy size={12} className="text-muted-foreground" aria-hidden />}
        </button>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <SectionEyebrow as="p" className="mb-3">
      {children}
    </SectionEyebrow>
  );
}

function ProfileCard({ children, className }) {
  return (
    <Card className={className}>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

// ─── Banner ───────────────────────────────────────────────────────────────────

// ─── Banner (reference image style) ─────────────────────────────────────────

function ProfileBanner({ profile, activeTab, onTabChange, onNavigate }) {
  const isOverview = activeTab === "overview";

  return (
    <div className="w-full shrink-0 overflow-visible border-b border-border">

      {/* Cover + avatar — Overview only */}
      <AnimatePresence initial={false}>
        {isOverview && (
          <motion.div
            key="profile-cover"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="relative overflow-visible"
          >
            <div
              className="relative h-44 w-full overflow-hidden"
              style={{
                background: "linear-gradient(90deg, var(--profile-cover-from) 0%, var(--profile-cover-mid) 50%, var(--profile-cover-to) 100%)",
              }}
            >
              <div className="relative flex h-full w-full items-end px-6 pb-5 sm:px-8 lg:px-10">
                <div className="min-w-0 pl-28 text-white sm:pl-32">
                  <h1 className="type-detail-title">{profile.name}</h1>
                  <p className="mt-0.5 text-sm font-medium text-white/75">{profile.role}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-white/55">
                      <MapPin className="size-3 shrink-0" aria-hidden />{profile.location}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-white/55">
                      <Building2 className="size-3 shrink-0" aria-hidden />{profile.businessUnit}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-0 left-6 z-20 translate-y-1/2 sm:left-8 lg:left-10">
              <div className="pointer-events-auto relative">
                <Avatar className="size-20 ring-4 ring-white shadow-xl dark:ring-card">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback
                    className="text-xl font-bold text-white"
                    style={{ background: "linear-gradient(145deg,#3b82f6,#6366f1)" }}
                  >
                    {profile.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab row */}
      <div className="relative z-10 flex w-full items-center justify-between bg-card">
        <div
          className={cn(
            "flex w-full items-center justify-between pr-6 sm:pr-8 lg:pr-10",
            isOverview ? "pl-28 sm:pl-32" : "pl-6 sm:pl-8 lg:pl-10",
          )}
        >
        {/* Tabs */}
        <div className="flex items-end gap-0 overflow-x-auto scrollbar-none">
          {PAGE_TABS.map(tab => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                )}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="ptab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          size="sm"
          className="h-8 shrink-0 gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold shadow-sm"
          aria-label="Settings"
          onClick={() => onNavigate?.("settings")}
        >
          <Settings className="size-3.5" aria-hidden />
          Settings
        </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile completion ───────────────────────────────────────────────────────

function ProfileCompletion({ pct }) {
  return (
    <ProfileCard>
      <SectionTitle>Complete your profile</SectionTitle>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">Profile strength</p>
        <span className="text-xs font-bold text-primary">{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Add your certifications and skills to reach 100%.
      </p>
    </ProfileCard>
  );
}

// ─── Left sidebar ─────────────────────────────────────────────────────────────

function LeftPanel({ profile }) {
  return (
    <div className="space-y-4">

      {/* Info */}
      <ProfileCard>
        <SectionTitle>Info</SectionTitle>
        <div className="space-y-3.5">
          <InfoRow icon={User}     label="Full name"    value={profile.name} />
          <InfoRow icon={Phone}    label="Mobile"       value={profile.phone}  copyable />
          <InfoRow icon={Mail}     label="E-mail"       value={profile.email}  copyable />
          <InfoRow icon={MapPin}   label="Location"     value={profile.location} />
          <InfoRow icon={Calendar} label="Joining date" value={profile.joiningDate} />
          <InfoRow icon={Hash}     label="Employee ID"  value={profile.id} />
        </div>
      </ProfileCard>

      {/* Reporting */}
      <ProfileCard>
        <SectionTitle>Reporting structure</SectionTitle>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Reports to</p>
            <div className="flex items-center gap-2.5 rounded-xl border border-border p-2.5 hover:bg-muted/30 transition-colors cursor-pointer group">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">{profile.reportingManager.initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{profile.reportingManager.name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.reportingManager.role}</p>
              </div>
              <ExternalLink size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity shrink-0" />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Direct reports ({profile.directReports.length})</p>
            <div className="space-y-1.5">
              {profile.directReports.map(m => (
                <div key={m.name} className="flex items-center gap-2.5 rounded-xl border border-border p-2 hover:bg-muted/30 transition-colors cursor-pointer group">
                  <Avatar className="size-7 shrink-0">
                    <AvatarFallback className={cn("text-xs font-bold text-white", m.color)}>{m.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ProfileCard>
    </div>
  );
}

// ─── About section (right) ────────────────────────────────────────────────────

function AboutSection({ profile }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Work info */}
      <ProfileCard>
        <SectionTitle>Work information</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { icon: Building2, label: "Business unit",  value: profile.businessUnit },
            { icon: User,      label: "Department",     value: profile.department },
            { icon: Briefcase, label: "Role",           value: profile.role },
            { icon: Zap,       label: "Work mode",      value: profile.workMode },
            { icon: User,      label: "Employee type",  value: profile.employeeType },
            { icon: Hash,      label: "Cost center",    value: profile.costCenter },
          ].map(r => (
            <div key={r.label} className="flex items-start gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                <r.icon size={12} className="text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground leading-none mb-0.5">{r.label}</p>
                <p className="text-xs font-medium text-foreground truncate">{r.value}</p>
              </div>
            </div>
          ))}
        </div>
      </ProfileCard>
    </motion.div>
  );
}

// ─── Activity section ─────────────────────────────────────────────────────────

const ACTIVITY_RANGE = ["Today", "Weekly", "Monthly"];

function ActivityItem({ item }) {
  return (
    <div className="flex gap-3">
      <Avatar className="size-8 shrink-0 mt-0.5">
        <AvatarFallback className={cn("text-xs font-bold text-white", item.color)}>{item.initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 pb-5 border-b border-border last:border-0 last:pb-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
          <span className="text-sm font-semibold text-foreground">{item.user}</span>
          <span className="text-xs text-muted-foreground">{item.time}</span>
        </div>
        <p className="text-xs text-muted-foreground mb-1.5">{item.text}</p>
        {item.body && <p className="text-xs text-foreground leading-relaxed">{item.body}</p>}
        {item.attachments && (
          <div className="flex flex-wrap gap-2 mt-2">
            {item.attachments.map(a => (
              <div key={a.name} className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 hover:bg-muted transition-colors cursor-pointer max-w-[200px]">
                <Paperclip size={12} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.size}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivitySection() {
  return (
    <ProfileCard>
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">Recent activity</p>
      </div>
      <div className="space-y-0">
        {ACTIVITY.map(item => <ActivityItem key={item.id} item={item} />)}
      </div>
    </ProfileCard>
  );
}

// ─── Timeline section ─────────────────────────────────────────────────────────

function TimelineSection() {
  return (
    <ProfileCard>
      <SectionTitle>Career timeline</SectionTitle>
      <div className="space-y-0">
        {TIMELINE.map((e, i) => (
          <div key={i} className="flex gap-4 group">
            <div className="flex flex-col items-center">
              <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border", e.color)}>
                <e.icon size={14} />
              </div>
              {i < TIMELINE.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
            </div>
            <div className="pb-4 min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-0.5">{e.date}</p>
              <p className="text-sm font-medium text-foreground">{e.label}</p>
            </div>
          </div>
        ))}
      </div>
    </ProfileCard>
  );
}

// ─── Tab content for each primary tab ────────────────────────────────────────

function OverviewContent({ profile }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">
      <LeftPanel profile={profile} />
      <div className="space-y-5">
        <AboutSection profile={profile} />
        <ActivitySection />
      </div>
    </div>
  );
}

function PlaceholderContent({ icon: Icon, title, subtitle }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted mb-4">
        <Icon size={28} className="text-muted-foreground" />
      </div>
      <p className="text-base font-semibold text-foreground mb-1.5">{title}</p>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{subtitle}</p>
    </motion.div>
  );
}

// ─── Tab bar (underline style, matching reference) ────────────────────────────

const PAGE_TABS = [
  { id: "overview",   label: "Overview",  icon: User   },
  { id: "insurance",  label: "Insurance", icon: Shield },
];

function TabBar({ active, onChange }) {
  return (
    <div className="flex items-end gap-0 border-b border-border overflow-x-auto scrollbar-none bg-card rounded-t-2xl">
      {PAGE_TABS.map(tab => {
        const isActive = tab.id === active;
        return (
          <button key={tab.id} type="button" onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors shrink-0",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
            )}>
            {tab.label}
            {isActive && (
              <motion.div layoutId="ptab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                transition={{ type: "spring", stiffness: 400, damping: 30 }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyProfilePage({ onNavigate }) {
  const { auth } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const profile = {
    ...PROFILE,
    name:  auth.user?.name  ?? PROFILE.name,
    email: auth.user?.email ?? PROFILE.email,
  };

  return (
    <main className="flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
      <Sidebar activePage="my-profile" onNavigate={onNavigate} />

      <div className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden">
        <AppHeader onNavigate={onNavigate}>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-px h-6 bg-border" />
            <button onClick={() => onNavigate?.("new-chat")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Home
            </button>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">My Profile</span>
          </div>
        </AppHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Full-width banner stripe */}
          <div className="shrink-0">
            <ProfileBanner profile={profile} activeTab={activeTab} onTabChange={setActiveTab} onNavigate={onNavigate} />
          </div>

          <div className="flex min-h-0 flex-1 flex-col basis-0 overflow-y-auto overscroll-y-contain">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-6 pt-5 pb-10"
                >
                  <div className="rounded-2xl border border-border overflow-hidden">
                    <div className="bg-muted/10 p-5">
                      <OverviewContent profile={profile} />
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === "insurance" && (
                <motion.div
                  key="insurance"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-0 w-full flex-1 flex-col"
                >
                  <InsuranceContent onNavigate={onNavigate} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
