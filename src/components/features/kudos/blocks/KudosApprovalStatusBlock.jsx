import { Mail, Check, Clock, X, AlertCircle } from "lucide-react";
import {
  APPROVAL_STATUS,
  APPROVAL_STATUS_LABELS,
  PSP_APPROVAL_EXPLAINER,
  PSP_APPROVAL_HEADLINE,
  PSP_TEAM_LONG_LABEL,
} from "../constants";
import { UserAvatar } from "../kudosPrimitives";
import { cn } from "@/lib/utils";
import { KUDOS_BADGE, KUDOS_CAPTION, KUDOS_FIELD_LABEL, KUDOS_LABEL } from "../kudosTypography";

function ApprovalStatusBadge({ status }) {
  const styles = {
    [APPROVAL_STATUS.PENDING]: "bg-primary/10 text-primary border-primary/30",
    [APPROVAL_STATUS.APPROVED]: "bg-success/10 text-success border-success-ring",
    [APPROVAL_STATUS.REJECTED]: "bg-destructive/10 text-destructive border-destructive/30",
    [APPROVAL_STATUS.CHANGES_REQUESTED]: "bg-warning/10 text-warning border-warning-ring",
  };
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5",
        KUDOS_BADGE,
        styles[status] ?? styles[APPROVAL_STATUS.PENDING],
      )}
    >
      {APPROVAL_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function StatusIcon({ status }) {
  const iconProps = { size: 13, className: "flex-shrink-0" };
  switch (status) {
    case APPROVAL_STATUS.PENDING:
      return <Clock {...iconProps} className={cn(iconProps.className, "text-primary")} />;
    case APPROVAL_STATUS.APPROVED:
      return <Check {...iconProps} className={cn(iconProps.className, "text-success")} />;
    case APPROVAL_STATUS.REJECTED:
      return <X {...iconProps} className={cn(iconProps.className, "text-destructive")} />;
    case APPROVAL_STATUS.CHANGES_REQUESTED:
      return <AlertCircle {...iconProps} className={cn(iconProps.className, "text-warning")} />;
    default:
      return null;
  }
}

function NotificationChannelsSent({ notifications }) {
  if (!notifications) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {notifications.push?.sent && (
        <span className={cn("inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5", KUDOS_CAPTION)}>
          📱 Push
        </span>
      )}
      {notifications.teams?.sent && (
        <span className={cn("inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5", KUDOS_CAPTION)}>
          💬 Teams
        </span>
      )}
      {notifications.email?.sent && (
        <span className={cn("inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5", KUDOS_CAPTION)}>
          📧 Email
        </span>
      )}
    </div>
  );
}

function EmailTagChip({ email, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 bg-primary/10 border border-primary/30 rounded-full px-2.5 py-0.5 text-xs text-primary font-medium whitespace-nowrap">
      {email}
      <button
        type="button"
        onClick={() => onRemove(email)}
        className="text-foreground hover:text-primary transition-colors"
      >
        ×
      </button>
    </span>
  );
}

export default function KudosApprovalStatusBlock({
  approval,
  lastNotificationChannels,
  onUpdate,
}) {
  const isApproved = approval.status === APPROVAL_STATUS.APPROVED;
  const emailSent = approval.emailSent;

  if (emailSent) {
    return (
      <div className="bg-success/10 border border-success-ring rounded-[10px] p-3 flex items-center gap-2.5">
        <Check size={15} className="text-success flex-shrink-0" />
        <div className="flex flex-col gap-0.5">
          <p className={cn(KUDOS_LABEL, "font-semibold text-success")}>Email Sent!</p>
          <p className={KUDOS_CAPTION}>
            Delivered to {approval.emailTo.length} recipient{approval.emailTo.length !== 1 ? "s" : ""}
            {approval.emailCc.length > 0 ? ` + ${approval.emailCc.length} CC` : ""}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-[10px] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted">
        <StatusIcon status={approval.status} />
        <p className={cn("min-w-0 flex-1 leading-5", KUDOS_LABEL, "font-semibold")}>
          {approval.status === APPROVAL_STATUS.PENDING
            ? PSP_APPROVAL_HEADLINE
            : (APPROVAL_STATUS_LABELS[approval.status] ?? approval.status)}
        </p>
        <ApprovalStatusBadge status={approval.status} />
      </div>

      {/* Status Info */}
      <div className="px-3 py-2.5 border-b border-border">
        {approval.status === APPROVAL_STATUS.PENDING && (
          <p className={cn(KUDOS_CAPTION, "leading-5")}>{PSP_APPROVAL_EXPLAINER}</p>
        )}
        {approval.status === APPROVAL_STATUS.APPROVED && (
          <p className={cn(KUDOS_CAPTION, "leading-5")}>
            {PSP_TEAM_LONG_LABEL} approved your card. Confirm recipients below, then send email.
          </p>
        )}
        {approval.status === APPROVAL_STATUS.REJECTED && (
          <p className={cn(KUDOS_CAPTION, "leading-5")}>
            {PSP_TEAM_LONG_LABEL} declined this card. Update your design or message and submit again.
          </p>
        )}
        {approval.status === APPROVAL_STATUS.CHANGES_REQUESTED && (
          <p className={cn(KUDOS_CAPTION, "leading-5")}>
            {PSP_TEAM_LONG_LABEL} requested changes. Update your card and submit again.
          </p>
        )}
        <NotificationChannelsSent
          notifications={approval.notifications ?? lastNotificationChannels}
        />
        {approval.pspComment && (
          <p className={cn(KUDOS_CAPTION, "mt-1.5 leading-4")}>
            <span className="font-medium text-foreground">{PSP_TEAM_LONG_LABEL}:</span>{" "}
            {approval.pspComment}
          </p>
        )}
      </div>

      {/* Email Section (when approved) */}
      {isApproved && (
        <>
          <div className="flex items-start gap-2 px-3 py-2 border-b border-border">
            <span className={cn(KUDOS_FIELD_LABEL, "w-10 flex-shrink-0 pt-1.5")}>
              To
            </span>
            <div className="flex-1 min-w-0 pt-1.5">
              <div className="flex flex-wrap gap-1.5 items-center mb-2">
                {approval.emailTo.map((email) => (
                  <EmailTagChip
                    key={email}
                    email={email}
                    onRemove={(e) =>
                      onUpdate(approval.id, {
                        emailTo: approval.emailTo.filter((x) => x !== e),
                      })
                    }
                  />
                ))}
              </div>
              <input
                type="email"
                placeholder="Add recipient…"
                value={approval.toInput || ""}
                onChange={(e) =>
                  onUpdate(approval.id, { toInput: e.target.value })
                }
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === ",") && approval.toInput.trim()) {
                    e.preventDefault();
                    const email = approval.toInput.trim().replace(/,$/, "");
                    if (email && !approval.emailTo.includes(email)) {
                      onUpdate(approval.id, {
                        emailTo: [...approval.emailTo, email],
                        toInput: "",
                      });
                    }
                  }
                }}
                className="flex-1 min-w-[100px] text-xs text-foreground outline-none bg-transparent placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 px-3 py-2">
            <span className={cn(KUDOS_FIELD_LABEL, "w-10 flex-shrink-0 pt-1.5")}>
              CC
            </span>
            <div className="flex-1 min-w-0 pt-1.5">
              <div className="flex flex-wrap gap-1.5 items-center mb-2">
                {approval.emailCc.map((email) => (
                  <EmailTagChip
                    key={email}
                    email={email}
                    onRemove={(e) =>
                      onUpdate(approval.id, {
                        emailCc: approval.emailCc.filter((x) => x !== e),
                      })
                    }
                  />
                ))}
              </div>
              <input
                type="email"
                placeholder="Add CC…"
                value={approval.ccInput || ""}
                onChange={(e) =>
                  onUpdate(approval.id, { ccInput: e.target.value })
                }
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === ",") && approval.ccInput.trim()) {
                    e.preventDefault();
                    const email = approval.ccInput.trim().replace(/,$/, "");
                    if (email && !approval.emailCc.includes(email)) {
                      onUpdate(approval.id, {
                        emailCc: [...approval.emailCc, email],
                        ccInput: "",
                      });
                    }
                  }
                }}
                className="flex-1 min-w-[100px] text-xs text-foreground outline-none bg-transparent placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="px-3 py-2.5">
            <button
              type="button"
              onClick={() => onUpdate(approval.id, { emailSent: true })}
              disabled={approval.emailTo.length === 0}
              className="w-full flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-primary-foreground text-xs font-medium h-8 rounded-[6px] transition-colors"
            >
              <Mail size={12} /> Send Email
            </button>
          </div>
        </>
      )}
    </div>
  );
}
