import { useEffect, useRef, useState } from "react";
import {
  APPROVAL_STATUS,
  APPROVAL_STATUS_LABELS,
  PSP_TEAM_DESCRIPTION,
  PSP_TEAM_LABEL,
} from "@/components/features/kudos/constants";
import { cn } from "@/lib/utils";
import {
  X,
  CheckCheck,
  ChevronRight,
  MessageSquare,
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
    avatarBg: "var(--muted-foreground)", avatarInitials: "PR",
    BadgeIcon: ServerCrash, badgeBg: "var(--destructive)",
    title: "Production deployment failure",
    desc: "main branch · deploy #847 crashed at runtime",
    tag: "PROD", time: "Just now", unread: true, persistent: true,
  },
  {
    id: "c2", type: "critical", category: "security",
    avatarBg: "var(--destructive)", avatarInitials: "CV",
    BadgeIcon: ShieldAlert, badgeBg: "var(--destructive)",
    title: "Security vulnerability detected",
    desc: "CVE-2024-1234 (critical) in lodash@4.17.11",
    tag: "CVE", time: "5 min ago", unread: true, persistent: true,
  },
  {
    id: "c3", type: "critical", category: "general",
    avatarBg: "var(--primary)", avatarInitials: "AI",
    BadgeIcon: Bot, badgeBg: "var(--destructive)",
    title: "AI agent execution failure",
    desc: "Customer Support Agent · unhandled exception in run #23",
    tag: "AGENT", time: "12 min ago", unread: true, persistent: true,
  },
  {
    id: "c4", type: "critical", category: "security",
    avatarBg: "var(--destructive)", avatarInitials: "UA",
    BadgeIcon: ShieldX, badgeBg: "var(--destructive)",
    title: "Unauthorized access attempt",
    desc: "IP 203.0.113.42 · 14 failed logins on admin panel",
    tag: "SECURITY", time: "18 min ago", unread: true, persistent: true,
  },
  // WARNING
  {
    id: "w1", type: "warning", category: "general",
    avatarBg: "var(--warning)", avatarInitials: "CI",
    BadgeIcon: Zap, badgeBg: "var(--warning)",
    title: "Build pipeline instability",
    desc: "CI/CD · 3 of last 5 runs failed — flaky test suspected",
    tag: "CI/CD", time: "45 min ago", unread: true,
  },
  {
    id: "w2", type: "warning", category: "general",
    avatarBg: "var(--warning)", avatarInitials: "AP",
    BadgeIcon: Gauge, badgeBg: "var(--warning)",
    title: "API latency spike detected",
    desc: "p95 → 1.4s · 340% above baseline",
    tag: "API", time: "1h ago", unread: false,
  },
  {
    id: "w3", type: "warning", category: "general",
    avatarBg: "var(--warning)", avatarInitials: "TC",
    BadgeIcon: FlaskConical, badgeBg: "var(--warning)",
    title: "Test coverage below threshold",
    desc: "Coverage dropped to 68% · minimum required: 80%",
    tag: "TESTS", time: "2h ago", unread: false,
  },
  {
    id: "w4", type: "warning", category: "general",
    avatarBg: "var(--chart-chart-4)", avatarInitials: "DP",
    BadgeIcon: DatabaseZap, badgeBg: "var(--warning)",
    title: "Data pipeline near capacity",
    desc: "Queue utilisation at 89% · auto-scaling triggered",
    tag: "PIPELINE", time: "3h ago", unread: false,
  },
  // SUCCESS
  {
    id: "s1", type: "success", category: "general",
    avatarBg: "var(--success)", avatarInitials: "PR",
    BadgeIcon: Rocket, badgeBg: "var(--success)",
    title: "Production deployment successful",
    desc: "v2.4.1 deployed to prod · 0 errors · 12s build",
    tag: "DEPLOY", time: "3h ago", unread: false,
  },
  {
    id: "s2", type: "success", category: "general",
    avatarBg: "var(--success)", avatarInitials: "GH",
    BadgeIcon: GitMerge, badgeBg: "var(--success)",
    title: "PR #1247 merged — AI review passed",
    desc: "feat: knowledge-hub picker · reviewed by Aziron AI",
    tag: "PR", time: "4h ago", unread: false,
  },
  // APPROVAL
  {
    id: "a1", type: "approval", category: "approval",
    avatarBg: "var(--primary)", avatarInitials: "AI",
    BadgeIcon: GitPullRequest, badgeBg: "var(--primary)",
    title: "AI-generated code pending review",
    desc: "Aziron AI proposes 3 file changes in CustomerAgent.js",
    tag: "CODE", time: "15 min ago", unread: true, persistent: true,
    actions: ["Review", "Approve", "Reject"],
  },
  {
    id: "a2", type: "approval", category: "approval",
    avatarBg: "var(--primary)", avatarInitials: "JA",
    BadgeIcon: Rocket, badgeBg: "var(--primary)",
    title: "Deployment approval required",
    desc: "staging → production · v2.5.0-rc.1 · requested by Jay",
    tag: "DEPLOY", time: "30 min ago", unread: true, persistent: true,
    actions: ["Approve", "Reject"],
  },
  {
    id: "a3", type: "approval", category: "approval", category2: "security",
    avatarBg: "var(--primary)", avatarInitials: "SE",
    BadgeIcon: ShieldAlert, badgeBg: "var(--primary)",
    title: "Security exception awaiting review",
    desc: "CORS bypass requested for partner API integration",
    tag: "SECURITY", time: "1h ago", unread: false, persistent: true,
    actions: ["Review"],
  },
  {
    id: "a4", type: "approval", category: "approval",
    avatarBg: "var(--primary)", avatarInitials: "WF",
    BadgeIcon: Clock, badgeBg: "var(--primary)",
    title: "Workflow paused — human decision needed",
    desc: "Invoice reconciliation agent waiting at step 4 of 7",
    tag: "WORKFLOW", time: "2h ago", unread: false, persistent: true,
    actions: ["Review", "Approve"],
  },
];

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE = {
  critical: { bar: "var(--destructive)", dot: "var(--destructive)", label: "CRITICAL", labelColor: "var(--destructive)" },
  warning:  { bar: "var(--warning)", dot: "var(--warning)", label: "WARNING",  labelColor: "var(--warning)" },
  success:  { bar: "var(--success)", dot: "var(--success)", label: "SUCCESS",  labelColor: "var(--success)" },
  approval: { bar: "var(--primary)", dot: "var(--primary)", label: "APPROVAL", labelColor: "var(--primary)" },
};

const ACTION_STYLE = {
  Approve: "bg-success text-success-foreground hover:bg-success/90",
  Reject:  "border border-border text-destructive bg-card dark:bg-card hover:bg-destructive/10 dark:hover:bg-destructive/20",
  Review:  "border border-border text-primary dark:text-primary bg-card dark:bg-card hover:bg-primary/10 dark:hover:bg-primary/20",
};

// ─── Notification Row ─────────────────────────────────────────────────────────

function NotificationRow({ item, selected, onSelect }) {
  const cfg = TYPE[item.type];
  const { BadgeIcon } = item;

  return (
    <div
      className={`group relative flex items-stretch cursor-pointer transition-colors ${
        selected ? "bg-background" : "bg-card dark:bg-card hover:bg-muted dark:hover:bg-muted"
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
            <div className="size-2 rounded-full bg-border dark:bg-border" />
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
            className="absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-card dark:border-border flex items-center justify-center"
            style={{ backgroundColor: item.badgeBg }}
          >
            <BadgeIcon size={10} color="white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-sm text-foreground dark:text-foreground leading-snug">
            <span className="font-semibold">{item.title}</span>
          </p>

          {/* Description */}
          <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5 leading-snug">{item.desc}</p>

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
            <span className="text-sm text-muted-foreground dark:text-muted-foreground">{item.time}</span>
            {item.persistent && (
              <span className="text-xs font-medium px-1.5 py-[2px] rounded bg-background text-muted-foreground dark:text-muted-foreground border border-border dark:border-border">
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

function KudosApprovalRow({ approval, onApprove, onReject, onRequestChanges, onActionComplete }) {
  const [comment, setComment] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [actionError, setActionError] = useState("");
  const recipientNames = approval.recipients?.map((r) => r.name.split(" ")[0]).join(" & ") ?? "—";
  const isPending = approval.status === APPROVAL_STATUS.PENDING;
  const statusLabel = APPROVAL_STATUS_LABELS[approval.status] ?? approval.status;

  const statusColor =
    approval.status === APPROVAL_STATUS.APPROVED
      ? "text-success bg-success/10 border-success-ring"
      : approval.status === APPROVAL_STATUS.REJECTED
        ? "text-destructive bg-destructive/10 border-destructive/30"
        : approval.status === APPROVAL_STATUS.CHANGES_REQUESTED
          ? "text-warning bg-warning/10 border-warning-ring"
          : "text-primary bg-primary/10 border-primary/30";

  const runAction = (fn) => {
    const message = fn?.(approval.id, comment);
    if (message === null) {
      setActionError("Add a comment before rejecting or requesting changes.");
      return;
    }
    setActionError("");
    setComment("");
    setExpanded(false);
    onActionComplete?.(message);
  };

  return (
    <div className="border-b border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-start gap-3 px-4 py-4 hover:bg-muted transition-colors text-left"
      >
        <div className="w-2.5 flex-shrink-0 flex justify-center mt-[18px]">
          {isPending && <div className="size-2 rounded-full bg-primary" />}
        </div>
        <div className="relative flex-shrink-0">
          <div className="size-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
            PSP
          </div>
          <div className="absolute -bottom-1 -right-1 size-[18px] rounded-full border-2 border-card flex items-center justify-center bg-primary">
            <UserCheck size={9} color="white" strokeWidth={2.5} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Customer Appreciation — {PSP_TEAM_LABEL} review</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {recipientNames} · {KUDOS_TEMPLATE_LABELS[approval.template] ?? approval.template}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1 leading-snug" title={PSP_TEAM_DESCRIPTION}>
            {PSP_TEAM_DESCRIPTION}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="px-[6px] py-[2px] rounded text-xs font-bold bg-primary/10 text-primary border border-primary/30">
              KUDOS
            </span>
            <span className={cn("text-xs font-semibold px-1.5 py-[2px] rounded-full border", statusColor)}>
              {statusLabel}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-primary mt-2 flex-shrink-0">
          {expanded ? "Hide" : "Review"}
        </span>
        <ChevronRight
          size={14}
          className={cn("text-muted-foreground transition-transform mt-2 flex-shrink-0", expanded && "rotate-90")}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 ml-[52px] flex flex-col gap-3 border-t border-border/50">
          {isPending && (
            <>
              <textarea
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (actionError) setActionError("");
                }}
                placeholder="Comment required for reject or request changes. Optional for approve."
                rows={2}
                className="w-full text-xs rounded-md border border-border bg-background px-2 py-1.5 resize-none"
              />
              {actionError && (
                <p className="text-[10px] text-destructive" role="alert">
                  {actionError}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => runAction(onApprove)}
                  className="flex items-center gap-1 px-3 py-[5px] rounded-[6px] text-xs font-semibold bg-success text-success-foreground hover:bg-success/90"
                >
                  <CheckCheck size={11} /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => runAction(onReject)}
                  disabled={!comment.trim()}
                  className="flex items-center gap-1 px-3 py-[5px] rounded-[6px] text-xs font-semibold border border-border text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={11} /> Reject
                </button>
                <button
                  type="button"
                  onClick={() => runAction(onRequestChanges)}
                  disabled={!comment.trim()}
                  className="flex items-center gap-1 px-3 py-[5px] rounded-[6px] text-xs font-semibold border border-border text-warning hover:bg-warning/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare size={11} /> Request changes
                </button>
              </div>
            </>
          )}

          {approval.pspComment && !isPending && (
            <p className="text-xs text-muted-foreground bg-muted rounded-md px-2 py-1.5">
              <span className="font-medium">PSP note:</span> {approval.pspComment}
            </p>
          )}
        </div>
      )}
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

export default function NotificationPanel({
  open,
  onClose,
  onNavigate,
  approvals: kudosApprovals,
  onApprove: onKudosApprove,
  onReject: onKudosReject,
  onRequestChanges: onKudosRequestChanges,
  onKudosActionComplete,
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const panelRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // WCAG 2.1.2 (No Keyboard Trap) + 2.4.3 (Focus Order): close on Escape,
  // move focus into the panel on open, and restore focus on close.
  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement;
    const handleKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", handleKey);
    const node = panelRef.current;
    if (node) {
      const focusable = node.querySelector("button, [href], [tabindex]:not([tabindex='-1'])");
      focusable?.focus();
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === "function") prev.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const kudosList = kudosApprovals ?? [];
  // Only show kudos in "all" and "approvals" tabs
  const visibleKudos = (activeTab === "all" || activeTab === "approvals") ? kudosList : [];

  const items    = getFiltered(activeTab);
  const unreadCount =
    NOTIFICATIONS.filter((n) => n.unread).length +
    kudosList.filter((a) => a.status === APPROVAL_STATUS.PENDING).length;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className="fixed z-50 bg-card dark:bg-card rounded-2xl border border-border dark:border-border overflow-hidden flex flex-col"
        style={{
          top: 56, right: 16, width: 460, maxHeight: 640,
          boxShadow: "0 24px 64px -12px rgba(15,23,42,0.18), 0 4px 16px -4px rgba(15,23,42,0.08)",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold text-foreground dark:text-foreground leading-none">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="text-sm font-medium text-primary dark:text-primary hover:text-primary dark:hover:text-primary transition-colors whitespace-nowrap">
              Mark all as read
            </button>
            <button
              onClick={onClose}
              aria-label="Close notifications panel"
              className="flex items-center justify-center size-8 rounded-full bg-muted dark:bg-border text-muted-foreground dark:text-muted-foreground hover:bg-border dark:hover:bg-accent transition-colors"
            >
              <X size={15} aria-hidden />
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-0 px-5 border-b border-border dark:border-border flex-shrink-0">
          {TABS.map(({ key, label }) => {
            const cnt   = getFiltered(key).filter((n) => n.unread).length;
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setSelectedId(null); }}
                className={`relative flex items-center gap-1.5 mr-6 pb-3 text-sm font-medium transition-colors ${
                  active ? "text-primary dark:text-primary" : "text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground"
                }`}
              >
                {label}
                {cnt > 0 && (
                  <span
                    className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold ${
                      active ? "bg-primary text-primary-foreground" : "bg-muted dark:bg-border text-muted-foreground dark:text-muted-foreground"
                    }`}
                  >
                    {cnt}
                  </span>
                )}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary dark:bg-card rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── List ── */}
        <div className="flex-1 overflow-y-auto divide-y divide-muted dark:divide-card">
          {items.length === 0 && visibleKudos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CheckCircle2 size={32} className="text-foreground dark:text-muted-foreground" />
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            <>
              {/* Kudos approval section — injected at top when present */}
              {visibleKudos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-5 py-2 bg-card dark:bg-card">
                    <span className="text-xs font-bold tracking-[0.09em] uppercase text-primary dark:text-primary">
                      KUDOS
                    </span>
                    <div className="flex-1 h-px bg-muted dark:bg-border" />
                  </div>
                  {visibleKudos.map((approval) => (
                    <KudosApprovalRow
                      key={approval.id}
                      approval={approval}
                      onApprove={onKudosApprove}
                      onReject={onKudosReject}
                      onRequestChanges={onKudosRequestChanges}
                      onActionComplete={onKudosActionComplete}
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
                        <div className="flex items-center gap-2 px-5 py-2 bg-card dark:bg-card">
                          <span
                            className="text-xs font-bold tracking-[0.09em] uppercase"
                            style={{ color: cfg.labelColor }}
                          >
                            {cfg.label}
                          </span>
                          <div className="flex-1 h-px bg-muted dark:bg-border" />
                        </div>
                        <div className="divide-y divide-muted dark:divide-card">
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
        <div className="flex items-center justify-between px-5 py-3 border-t border-border dark:border-border flex-shrink-0 bg-card dark:bg-card">
          <span className="text-sm text-muted-foreground dark:text-muted-foreground">
            {items.length} Total &bull; {items.filter((n) => n.unread).length} unread
          </span>
          <button
            onClick={() => { onClose(); onNavigate?.("notifications"); }}
            className="flex items-center gap-1.5 text-sm font-semibold text-foreground dark:text-foreground hover:text-primary dark:hover:text-foreground transition-colors"
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
