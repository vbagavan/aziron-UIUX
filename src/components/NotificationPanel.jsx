import { useState } from "react";
import {
  X,
  CheckCheck,
  ChevronRight,
  ServerCrash,
  ShieldAlert,
  Bot,
  ShieldX,
  Zap,
  Gauge,
  FlaskConical,
  DatabaseZap,
  Rocket,
  GitMerge,
  GitPullRequest,
  Clock,
  CheckCircle2,
  UserCheck,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const NOTIFICATIONS = [
  // CRITICAL
  {
    id: "c1", type: "critical", category: "security",
    avatarBg: "#64748b", avatarInitials: "PR",
    BadgeIcon: ServerCrash, badgeBg: "#ef4444",
    title: "Production deployment failure",
    desc: "main branch · deploy #847 crashed at runtime",
    tag: "PROD", time: "Just now", unread: true, persistent: true,
  },
  {
    id: "c2", type: "critical", category: "security",
    avatarBg: "#ef4444", avatarInitials: "CV",
    BadgeIcon: ShieldAlert, badgeBg: "#ef4444",
    title: "Security vulnerability detected",
    desc: "CVE-2024-1234 (critical) in lodash@4.17.11",
    tag: "CVE", time: "5 min ago", unread: true, persistent: true,
  },
  {
    id: "c3", type: "critical", category: "general",
    avatarBg: "#2563eb", avatarInitials: "AI",
    BadgeIcon: Bot, badgeBg: "#ef4444",
    title: "AI agent execution failure",
    desc: "Customer Support Agent · unhandled exception in run #23",
    tag: "AGENT", time: "12 min ago", unread: true, persistent: true,
  },
  {
    id: "c4", type: "critical", category: "security",
    avatarBg: "#b91c1c", avatarInitials: "UA",
    BadgeIcon: ShieldX, badgeBg: "#ef4444",
    title: "Unauthorized access attempt",
    desc: "IP 203.0.113.42 · 14 failed logins on admin panel",
    tag: "SECURITY", time: "18 min ago", unread: true, persistent: true,
  },
  // WARNING
  {
    id: "w1", type: "warning", category: "general",
    avatarBg: "#d97706", avatarInitials: "CI",
    BadgeIcon: Zap, badgeBg: "#f97316",
    title: "Build pipeline instability",
    desc: "CI/CD · 3 of last 5 runs failed — flaky test suspected",
    tag: "CI/CD", time: "45 min ago", unread: true,
  },
  {
    id: "w2", type: "warning", category: "general",
    avatarBg: "#b45309", avatarInitials: "AP",
    BadgeIcon: Gauge, badgeBg: "#f97316",
    title: "API latency spike detected",
    desc: "p95 → 1.4s · 340% above baseline",
    tag: "API", time: "1h ago", unread: false,
  },
  {
    id: "w3", type: "warning", category: "general",
    avatarBg: "#92400e", avatarInitials: "TC",
    BadgeIcon: FlaskConical, badgeBg: "#f97316",
    title: "Test coverage below threshold",
    desc: "Coverage dropped to 68% · minimum required: 80%",
    tag: "TESTS", time: "2h ago", unread: false,
  },
  {
    id: "w4", type: "warning", category: "general",
    avatarBg: "#7c3aed", avatarInitials: "DP",
    BadgeIcon: DatabaseZap, badgeBg: "#f97316",
    title: "Data pipeline near capacity",
    desc: "Queue utilisation at 89% · auto-scaling triggered",
    tag: "PIPELINE", time: "3h ago", unread: false,
  },
  // SUCCESS
  {
    id: "s1", type: "success", category: "general",
    avatarBg: "#16a34a", avatarInitials: "PR",
    BadgeIcon: Rocket, badgeBg: "#22c55e",
    title: "Production deployment successful",
    desc: "v2.4.1 deployed to prod · 0 errors · 12s build",
    tag: "DEPLOY", time: "3h ago", unread: false,
  },
  {
    id: "s2", type: "success", category: "general",
    avatarBg: "#15803d", avatarInitials: "GH",
    BadgeIcon: GitMerge, badgeBg: "#22c55e",
    title: "PR #1247 merged — AI review passed",
    desc: "feat: knowledge-hub picker · reviewed by Aziron AI",
    tag: "PR", time: "4h ago", unread: false,
  },
  // APPROVAL
  {
    id: "a1", type: "approval", category: "approval",
    avatarBg: "#1d4ed8", avatarInitials: "AI",
    BadgeIcon: GitPullRequest, badgeBg: "#2563eb",
    title: "AI-generated code pending review",
    desc: "Aziron AI proposes 3 file changes in CustomerAgent.js",
    tag: "CODE", time: "15 min ago", unread: true, persistent: true,
    actions: ["Review", "Approve", "Reject"],
  },
  {
    id: "a2", type: "approval", category: "approval",
    avatarBg: "#1e40af", avatarInitials: "JA",
    BadgeIcon: Rocket, badgeBg: "#2563eb",
    title: "Deployment approval required",
    desc: "staging → production · v2.5.0-rc.1 · requested by Jay",
    tag: "DEPLOY", time: "30 min ago", unread: true, persistent: true,
    actions: ["Approve", "Reject"],
  },
  {
    id: "a3", type: "approval", category: "approval", category2: "security",
    avatarBg: "#1e3a8a", avatarInitials: "SE",
    BadgeIcon: ShieldAlert, badgeBg: "#2563eb",
    title: "Security exception awaiting review",
    desc: "CORS bypass requested for partner API integration",
    tag: "SECURITY", time: "1h ago", unread: false, persistent: true,
    actions: ["Review"],
  },
  {
    id: "a4", type: "approval", category: "approval",
    avatarBg: "#1d4ed8", avatarInitials: "WF",
    BadgeIcon: Clock, badgeBg: "#2563eb",
    title: "Workflow paused — human decision needed",
    desc: "Invoice reconciliation agent waiting at step 4 of 7",
    tag: "WORKFLOW", time: "2h ago", unread: false, persistent: true,
    actions: ["Review", "Approve"],
  },
];

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE = {
  critical: { bar: "#ef4444", dot: "#ef4444", label: "CRITICAL", labelColor: "#ef4444" },
  warning:  { bar: "#f97316", dot: "#f97316", label: "WARNING",  labelColor: "#f97316" },
  success:  { bar: "#22c55e", dot: "#22c55e", label: "SUCCESS",  labelColor: "#22c55e" },
  approval: { bar: "#2563eb", dot: "#2563eb", label: "APPROVAL", labelColor: "#2563eb" },
};

const ACTION_STYLE = {
  Approve: "bg-[#22c55e] text-white hover:bg-[#16a34a]",
  Reject:  "border border-[#ef4444] text-[#ef4444] bg-white hover:bg-[#fef2f2]",
  Review:  "border border-[#2563eb] text-[#2563eb] bg-white hover:bg-[#eff6ff]",
};

// ─── Notification Row ─────────────────────────────────────────────────────────

function NotificationRow({ item, selected, onSelect }) {
  const cfg = TYPE[item.type];
  const { BadgeIcon } = item;

  return (
    <div
      className={`group relative flex items-stretch cursor-pointer transition-colors ${
        selected ? "bg-[#f8fafc]" : "bg-white hover:bg-[#f8fafc]"
      }`}
      onClick={() => onSelect(selected ? null : item.id)}
    >
      <div className="flex-1 flex items-start gap-3 px-4 py-4">
        {/* Unread dot */}
        <div className="w-2.5 flex-shrink-0 flex justify-center mt-[18px]">
          {item.unread ? (
            <div
              className={`size-2 rounded-full opacity-50 ${item.type === "critical" ? "animate-pulse !opacity-100" : ""}`}
              style={{ backgroundColor: cfg.dot }}
            />
          ) : (
            <div className="size-2 rounded-full bg-[#e2e8f0]" />
          )}
        </div>

        {/* Avatar + badge */}
        <div className="relative flex-shrink-0">
          <div
            className="size-10 rounded-full flex items-center justify-center text-white text-sm font-bold select-none"
            style={{ backgroundColor: item.avatarBg }}
          >
            {item.avatarInitials}
          </div>
          <div
            className="absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-white flex items-center justify-center"
            style={{ backgroundColor: item.badgeBg }}
          >
            <BadgeIcon size={10} color="white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-sm text-[#0f172a] leading-snug">
            <span className="font-semibold">{item.title}</span>
          </p>

          {/* Description */}
          <p className="text-xs text-[#64748b] mt-0.5 leading-snug">{item.desc}</p>

          {/* Tag + time */}
          <div className="flex items-center gap-2 mt-2">
            <span
              className="px-[6px] py-[2px] rounded text-xs font-bold tracking-wide border"
              style={{ color: cfg.labelColor, backgroundColor: `${cfg.bar}12`, borderColor: `${cfg.bar}30` }}
            >
              {item.tag}
            </span>
            <span
              className="px-[6px] py-[2px] rounded text-xs font-semibold border"
              style={{ color: cfg.labelColor, backgroundColor: `${cfg.bar}10`, borderColor: `${cfg.bar}20` }}
            >
              {cfg.label}
            </span>
            <span className="text-sm text-[#94a3b8]">{item.time}</span>
            {item.persistent && (
              <span className="text-xs font-medium px-1.5 py-[2px] rounded bg-[#f8fafc] text-[#94a3b8] border border-[#e2e8f0]">
                persistent
              </span>
            )}
          </div>

          {/* Action buttons — only shown when expanded */}
          <div
            className={`overflow-hidden transition-all duration-200 ${
              selected ? "max-h-[60px] mt-3 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {item.actions && (
              <div className="flex items-center gap-2">
                {item.actions.map((action) => (
                  <button
                    key={action}
                    onClick={(e) => e.stopPropagation()}
                    className={`flex items-center gap-1 px-3 py-[5px] rounded-[6px] text-xs font-semibold transition-colors ${ACTION_STYLE[action]}`}
                  >
                    {action === "Approve" && <CheckCheck size={11} />}
                    {action === "Reject"  && <X size={11} />}
                    {action === "Review"  && <ChevronRight size={11} />}
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Kudos Approval Row ───────────────────────────────────────────────────────

const KUDOS_TEMPLATE_LABELS = {
  "gold-classic": "Gold Classic",
  "blue-morden": "Blue Modern",
  "green": "Green Nature",
  "purple-elegant": "Purple Elegant",
};

function KudosApprovalRow({ approval, onApprove, onReject }) {
  const recipientNames = approval.recipients.map((r) => r.name.split(" ")[0]).join(" & ");
  const isApproved = approval.status === "approved";

  return (
    <div className="flex items-start gap-3 px-4 py-4 bg-white hover:bg-[#f8fafc] transition-colors border-b border-[#f1f5f9]">
      {/* Unread dot */}
      <div className="w-2.5 flex-shrink-0 flex justify-center mt-[18px]">
        {!isApproved && <div className="size-2 rounded-full bg-[#2563eb]" />}
      </div>

      {/* Avatar + badge */}
      <div className="relative flex-shrink-0">
        <div className="size-10 rounded-full bg-[#2563eb] flex items-center justify-center text-white text-sm font-bold select-none">
          KD
        </div>
        <div className="absolute -bottom-1 -right-1 size-[18px] rounded-full border-2 border-white flex items-center justify-center bg-[#2563eb]">
          {isApproved
            ? <CheckCircle2 size={9} color="white" strokeWidth={2.5} />
            : <UserCheck size={9} color="white" strokeWidth={2.5} />
          }
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#0f172a] leading-snug font-semibold">
          {isApproved ? "Kudos card approved ✓" : "Kudos approval requested"}
        </p>
        <p className="text-xs text-[#64748b] mt-0.5 leading-snug">
          {recipientNames} · {KUDOS_TEMPLATE_LABELS[approval.template] ?? approval.template}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <span className="px-[6px] py-[2px] rounded text-xs font-bold tracking-wide bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
            KUDOS
          </span>
          <span className="text-sm text-[#94a3b8]">Just now</span>
          {!isApproved && (
            <span className="text-xs font-semibold px-1.5 py-[2px] rounded-full text-[#2563eb] bg-[#eff6ff]">
              pending
            </span>
          )}
          {isApproved && (
            <span className="text-xs font-semibold px-1.5 py-[2px] rounded-full text-[#15803d] bg-[#dcfce7]">
              approved
            </span>
          )}
        </div>

        {/* Approve / Reject — only for pending */}
        {!isApproved && onApprove && onReject && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={(e) => { e.stopPropagation(); onApprove(approval.id); }}
              className="flex items-center gap-1 px-3 py-[5px] rounded-[6px] text-xs font-semibold bg-[#22c55e] text-white hover:bg-[#16a34a] transition-colors"
            >
              <CheckCheck size={11} /> Approve
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onReject(approval.id); }}
              className="flex items-center gap-1 px-3 py-[5px] rounded-[6px] text-xs font-semibold border border-[#ef4444] text-[#ef4444] bg-white hover:bg-[#fef2f2] transition-colors"
            >
              <X size={11} /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tabs & filtering ─────────────────────────────────────────────────────────

const TABS = [
  { key: "all",       label: "All" },
  { key: "approvals", label: "Approvals" },
  { key: "security",  label: "Security" },
];

function getFiltered(tab) {
  if (tab === "all")       return NOTIFICATIONS;
  if (tab === "approvals") return NOTIFICATIONS.filter((n) => n.category === "approval");
  if (tab === "security")  return NOTIFICATIONS.filter((n) => n.category === "security" || n.category2 === "security");
  return NOTIFICATIONS;
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function NotificationPanel({ open, onClose, onNavigate, approvals: kudosApprovals, onApprove: onKudosApprove, onReject: onKudosReject }) {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  if (!open) return null;

  const kudosList = kudosApprovals ?? [];
  // Only show kudos in "all" and "approvals" tabs
  const visibleKudos = (activeTab === "all" || activeTab === "approvals") ? kudosList : [];

  const items    = getFiltered(activeTab);
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length + kudosList.filter((a) => a.status === "pending").length;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        className="fixed z-50 bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden flex flex-col"
        style={{
          top: 56, right: 16, width: 460, maxHeight: 640,
          boxShadow: "0 24px 64px -12px rgba(15,23,42,0.18), 0 4px 16px -4px rgba(15,23,42,0.08)",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold text-[#0f172a] leading-none">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#ef4444] text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8] transition-colors whitespace-nowrap">
              Mark all as read
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center size-8 rounded-full bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-0 px-5 border-b border-[#e2e8f0] flex-shrink-0">
          {TABS.map(({ key, label }) => {
            const cnt   = getFiltered(key).filter((n) => n.unread).length;
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setSelectedId(null); }}
                className={`relative flex items-center gap-1.5 mr-6 pb-3 text-sm font-medium transition-colors ${
                  active ? "text-[#2563eb]" : "text-[#64748b] hover:text-[#0f172a]"
                }`}
              >
                {label}
                {cnt > 0 && (
                  <span
                    className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold ${
                      active ? "bg-[#2563eb] text-white" : "bg-[#f1f5f9] text-[#64748b]"
                    }`}
                  >
                    {cnt}
                  </span>
                )}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2563eb] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── List ── */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#f1f5f9]">
          {items.length === 0 && visibleKudos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CheckCircle2 size={32} className="text-[#cbd5e1]" />
              <p className="text-sm text-[#94a3b8]">All caught up!</p>
            </div>
          ) : (
            <>
              {/* Kudos approval section — injected at top when present */}
              {visibleKudos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-5 py-2 bg-white">
                    <span className="text-xs font-bold tracking-[0.09em] uppercase text-[#2563eb]">
                      KUDOS
                    </span>
                    <div className="flex-1 h-px bg-[#f1f5f9]" />
                  </div>
                  {visibleKudos.map((approval) => (
                    <KudosApprovalRow
                      key={approval.id}
                      approval={approval}
                      onApprove={onKudosApprove}
                      onReject={onKudosReject}
                    />
                  ))}
                </div>
              )}

              {/* "All" tab: group by type with a section label */}
              {activeTab === "all"
                ? ["critical", "warning", "approval", "success"].map((type) => {
                    const group = items.filter((n) => n.type === type);
                    if (!group.length) return null;
                    const cfg = TYPE[type];
                    return (
                      <div key={type}>
                        <div className="flex items-center gap-2 px-5 py-2 bg-white">
                          <span
                            className="text-xs font-bold tracking-[0.09em] uppercase"
                            style={{ color: cfg.labelColor }}
                          >
                            {cfg.label}
                          </span>
                          <div className="flex-1 h-px bg-[#f1f5f9]" />
                        </div>
                        <div className="divide-y divide-[#f1f5f9]">
                          {group.map((item) => (
                            <NotificationRow
                              key={item.id}
                              item={item}
                              selected={selectedId === item.id}
                              onSelect={setSelectedId}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })
                : items.map((item) => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      selected={selectedId === item.id}
                      onSelect={setSelectedId}
                    />
                  ))
              }
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#e2e8f0] flex-shrink-0 bg-white">
          <span className="text-sm text-[#94a3b8]">
            {items.length} Total &bull; {items.filter((n) => n.unread).length} unread
          </span>
          <button
            onClick={() => { onClose(); onNavigate?.("notifications"); }}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#0f172a] hover:text-[#2563eb] transition-colors"
          >
            View all notifications
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
