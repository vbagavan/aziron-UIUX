import { useRef, useEffect, useState } from "react";
import {
  Bot,
  X,
  Check,
  Paperclip,
  Send,
  Wrench,
  Database,
  Cpu,
  Mail,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Bell,
  Smartphone,
} from "lucide-react";
import {
  USERS,
  TEMPLATES,
  APPROVAL_STATUS,
  APPROVAL_STATUS_LABELS,
  PREVIEW_COMMAND_CHIPS,
  PSP_TEAM_DESCRIPTION,
  PSP_TEAM_LABEL,
  SUBMIT_APPROVAL_COMMAND,
} from "./constants";
import { cn } from "@/lib/utils";
import TemplateThumbnailGallery from "./TemplateThumbnailGallery";
import KudosPreviewModal from "./KudosPreviewModal";

export function getInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserAvatar({ name, color, size = 32 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: size * 0.35,
        fontWeight: 600,
        color: "var(--primary-foreground)",
        userSelect: "none",
      }}
    >
      {getInitials(name)}
    </div>
  );
}

export function SparkLogo({ size = 18 }) {
  const s = size;
  return (
    <svg
      width={s}
      height={Math.round(s * 1.09)}
      viewBox="0 0 22 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <path d="M0 14L9 8.5V19.5L0 14Z" fill="var(--primary)" />
      <path d="M13 0L22 5.5V14.5L13 9V0Z" fill="var(--primary)" />
      <path d="M13 15L22 9.5V20.5L13 15Z" fill="var(--chart-chart-2)" />
    </svg>
  );
}

function AgentPlaceholder() {
  return (
    <div className="bg-muted border border-border rounded-[4px] size-9 flex items-center justify-center flex-shrink-0">
      <Bot size={18} className="text-muted-foreground" />
    </div>
  );
}

function UserPickerDropdown({ query, onSelect }) {
  const filtered = USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()),
  );

  if (filtered.length === 0) return null;

  return (
    <div
      className="bg-card border border-border rounded-[8px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.08)] overflow-y-auto"
      style={{ maxHeight: 260 }}
    >
      {filtered.map((user, idx) => (
        <button
          key={user.id}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(user);
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted text-left transition-colors ${
            idx !== 0 ? "border-t border-border" : ""
          }`}
        >
          <UserAvatar name={user.name} color={user.color} size={30} />
          <div className="flex flex-col min-w-0 gap-0.5">
            <span className="text-sm font-medium text-foreground leading-5 truncate">{user.name}</span>
            <span className="text-xs text-muted-foreground leading-4 truncate">{user.email}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

const PROMPT_TEXTAREA_MAX_HEIGHT = 120;

function PromptCommandChips({ chips, onSelect, onSubmitApproval, showSubmitApproval }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onSelect(chip.command)}
          className="text-[10px] font-medium px-2 py-1 rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors"
        >
          {chip.label}
        </button>
      ))}
      {showSubmitApproval && (
        <button
          type="button"
          onClick={onSubmitApproval}
          className="text-[10px] font-semibold px-2 py-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Submit for approval
        </button>
      )}
    </div>
  );
}

function PromptBox({
  value,
  onChange,
  onSend,
  showPicker,
  pickerQuery,
  onSelectUser,
  placeholder = "Type /kudos @Name — describe your appreciation…",
  isSending = false,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const minH = 36;
    if (!value.trim()) {
      el.style.height = `${minH}px`;
      return;
    }
    el.style.height = "auto";
    const next = Math.min(Math.max(el.scrollHeight, minH), PROMPT_TEXTAREA_MAX_HEIGHT);
    el.style.height = `${next}px`;
  }, [value]);

  const handleSendClick = () => {
    if (!value.trim()) return;
    onSend?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  return (
    <div
      className="bg-muted rounded-[12px] w-full"
      style={{ boxShadow: "8px 6px 130px 0px rgba(37,99,235,0.16)" }}
    >
      {showPicker && (
        <div className="mb-1">
          <UserPickerDropdown query={pickerQuery} onSelect={onSelectUser} />
        </div>
      )}

      <div className="border border-border rounded-t-[12px] flex items-end gap-2 p-3">
        <button
          type="button"
          disabled
          title="Coming soon"
          aria-label="Attach file (coming soon)"
          className="flex items-center justify-center size-8 rounded-full text-muted-foreground flex-shrink-0 opacity-40 cursor-not-allowed"
        >
          <Paperclip size={14} aria-hidden />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 min-w-0 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none leading-6 min-h-[36px] max-h-[120px] py-1 overflow-y-auto"
        />

        <button
          type="button"
          onClick={handleSendClick}
          disabled={!value.trim() || isSending}
          aria-label={isSending ? "Sending" : "Send message"}
          aria-busy={isSending}
          className="flex items-center justify-center size-8 rounded-full border border-border bg-card text-muted-foreground hover:bg-muted flex-shrink-0 mt-0.5 disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed"
        >
          <Send size={14} aria-hidden className={isSending ? "animate-pulse" : ""} />
        </button>
      </div>

      <div className="border-b border-l border-r border-border rounded-b-[12px] h-8 flex items-center justify-between px-3">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-muted-foreground hover:bg-muted transition-colors"
          >
            <Wrench size={12} aria-hidden />
            <span className="text-[10px] text-muted-foreground">Tools</span>
          </button>
          <div className="w-px h-3 bg-border mx-0.5" aria-hidden />
          <button
            type="button"
            aria-label="Browse knowledge hub"
            className="flex items-center justify-center size-6 rounded-[6px] text-muted-foreground hover:bg-muted transition-colors"
          >
            <Database size={12} aria-hidden />
          </button>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] text-muted-foreground hover:bg-muted transition-colors"
        >
          <Cpu size={12} aria-hidden />
          <span className="text-[10px] text-muted-foreground">Claude-sonnet</span>
        </button>
      </div>
    </div>
  );
}

function EmailTagInput({ tags, onAdd, onRemove, inputValue, onInputChange, placeholder }) {
  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      const email = inputValue.trim().replace(/,$/, "");
      if (email && !tags.includes(email)) onAdd(email);
      onInputChange("");
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 items-center min-h-[28px] py-0.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 bg-primary/10 border border-primary/30 rounded-full px-2.5 py-0.5 text-xs text-primary font-medium whitespace-nowrap"
        >
          {tag}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onRemove(tag);
            }}
            aria-label={`Remove ${tag}`}
            className="text-foreground hover:text-primary transition-colors"
          >
            <X size={10} aria-hidden />
          </button>
        </span>
      ))}
      <input
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[100px] text-xs text-foreground outline-none bg-transparent placeholder:text-muted-foreground"
      />
    </div>
  );
}

function InlineEmailCard({ approval, onUpdate }) {
  if (approval.emailSent) {
    return (
      <div className="bg-success/10 border border-success-ring rounded-[10px] p-3 flex items-center gap-2.5">
        <CheckCircle2 size={15} className="text-success flex-shrink-0" />
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold text-success">Email Sent!</p>
          <p className="text-xs text-muted-foreground">
            Delivered to {approval.emailTo.length} recipient{approval.emailTo.length !== 1 ? "s" : ""}
            {approval.emailCc.length > 0 ? ` + ${approval.emailCc.length} CC` : ""}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-[10px] overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted">
        <Mail size={13} className="text-primary flex-shrink-0" />
        <span className="text-xs font-semibold text-foreground flex-1">Send appreciation email</span>
        <span className="text-xs font-medium text-success bg-success/10 border border-success-ring rounded-full px-2 py-0.5">
          Approved ✓
        </span>
      </div>
      <div className="flex items-start gap-2 px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-5 pt-1.5 flex-shrink-0">To</span>
        <div className="flex-1 min-w-0">
          <EmailTagInput
            tags={approval.emailTo}
            onAdd={(e) => onUpdate(approval.id, { emailTo: [...approval.emailTo, e] })}
            onRemove={(e) => onUpdate(approval.id, { emailTo: approval.emailTo.filter((x) => x !== e) })}
            inputValue={approval.toInput}
            onInputChange={(v) => onUpdate(approval.id, { toInput: v })}
            placeholder="Add recipients…"
          />
        </div>
      </div>
      <div className="flex items-start gap-2 px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-5 pt-1.5 flex-shrink-0">CC</span>
        <div className="flex-1 min-w-0">
          <EmailTagInput
            tags={approval.emailCc}
            onAdd={(e) => onUpdate(approval.id, { emailCc: [...approval.emailCc, e] })}
            onRemove={(e) => onUpdate(approval.id, { emailCc: approval.emailCc.filter((x) => x !== e) })}
            inputValue={approval.ccInput}
            onInputChange={(v) => onUpdate(approval.id, { ccInput: v })}
            placeholder="Add CC…"
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
    </div>
  );
}

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
        "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
        styles[status] ?? styles[APPROVAL_STATUS.PENDING],
      )}
    >
      {APPROVAL_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function NotificationChannelsSent({ notifications }) {
  if (!notifications) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {notifications.push?.sent && (
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          <Smartphone size={10} /> Push
        </span>
      )}
      {notifications.teams?.sent && (
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          <Bell size={10} /> Teams
        </span>
      )}
      {notifications.email?.sent && (
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          <Mail size={10} /> Email
        </span>
      )}
    </div>
  );
}

function PromptEventThread({ events }) {
  if (!events?.length) return null;
  return events.map((update) => (
    <div key={update.id} className="flex flex-col gap-2">
      {update.userText && (
        <div className="flex justify-end">
          <div className="bg-primary/10 border border-primary/30 rounded-[12px] rounded-tr-[4px] px-3 py-2 max-w-[90%]">
            <p className="text-xs text-foreground leading-5">{update.userText}</p>
          </div>
        </div>
      )}
      {update.summary && (
        <div className="flex items-start gap-2">
          <SparkLogo size={14} />
          <div
            className={cn(
              "rounded-[10px] px-3 py-2 border flex-1 min-w-0",
              update.isError
                ? "bg-destructive/10 border-destructive/30"
                : update.isHint
                  ? "bg-muted border-border"
                  : "bg-card border-border",
            )}
          >
            <p
              className={cn(
                "text-xs leading-5",
                update.isError ? "text-destructive font-medium" : "text-foreground",
              )}
            >
              {update.isHint || update.isError ? update.summary : `Preview updated — ${update.summary}`}
            </p>
            {!update.isHint && !update.isError && (
              <p className="text-[10px] text-muted-foreground mt-1 leading-4">
                Changes appear in the template on the left.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  ));
}

export function KudosConversationBody({ workflow, isExpanded = false }) {
  const {
    stage,
    activeTemplate,
    setActiveTemplate,
    onedriveTemplates,
    recommendedTemplateId,
    approvals,
    compose,
    inputValue,
    setInputValue,
    handleSend,
    runPreviewCommand,
    handleRequestApproval,
    showPicker,
    pickerQuery,
    handleSelectUser,
    lastNotificationChannels,
    promptEvents,
    templateContent,
    selectedRecipients,
    isSending,
    liveStatus,
  } = workflow;

  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const activeLabel =
    onedriveTemplates.find((t) => t.id === activeTemplate)?.label ??
    TEMPLATES.find((t) => t.id === activeTemplate)?.label ??
    "Template";
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (["generating", "preview", "loading-templates"].includes(stage)) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [stage, approvals, activeTemplate, promptEvents]);

  const showPrompt = ["idle", "compose", "empty", "preview"].includes(stage);
  const previewChips = PREVIEW_COMMAND_CHIPS.filter(
    (c) => c.command !== "__reset_styles__" && c.command !== "__undo_style__",
  );
  const styleUtilityChips = PREVIEW_COMMAND_CHIPS.filter((c) =>
    ["__reset_styles__", "__undo_style__"].includes(c.command),
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveStatus}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 flex flex-col gap-3">
        {["idle", "compose", "empty"].includes(stage) && (
          <>
            <div className="flex flex-col items-center justify-center gap-3 text-center px-1 py-8 flex-shrink-0">
              <h2 className="text-lg font-medium text-foreground leading-tight">
                Create a customer appreciation
              </h2>
              <p className="text-xs text-muted-foreground leading-5 max-w-[300px]">
                Describe who you&apos;re recognizing and include{" "}
                <strong className="font-medium text-foreground">at least one email</strong>. Example:{" "}
                <code className="bg-muted px-1 rounded text-[11px]">
                  /kudos @Zoya — thank you! zbaum@aziro.com
                </code>
              </p>
            </div>
            <PromptEventThread events={promptEvents} />
          </>
        )}

        {(stage === "loading-templates" || stage === "generating" || stage === "preview") && (
          <div className="flex flex-col gap-3">
            {compose.message && (
              <div className="flex justify-end">
                <div className="bg-primary/10 border border-primary/30 rounded-[12px] rounded-tr-[4px] px-3 py-2 max-w-[90%]">
                  <p className="text-xs text-foreground leading-5">{compose.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    To: {compose.emailTo.join(", ")}
                    {compose.emailCc.length > 0 && ` · CC: ${compose.emailCc.join(", ")}`}
                  </p>
                </div>
              </div>
            )}

            {(stage === "loading-templates" || stage === "generating") && (
              <div className="flex items-center gap-2" role="status" aria-live="polite">
                <SparkLogo size={16} />
                <span className="text-xs text-foreground">
                  {stage === "loading-templates"
                    ? "Step 1 of 2 — Loading OneDrive templates…"
                    : "Step 2 of 2 — Generating your card…"}
                </span>
                <span className="flex gap-0.5 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-1 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
                    />
                  ))}
                </span>
              </div>
            )}

            {stage === "preview" && (
              <>
                <div className="bg-card border border-border rounded-md p-3 flex items-start gap-2">
                  <div className="flex items-center justify-center size-4 rounded-full bg-success/10 flex-shrink-0 mt-0.5">
                    <Check size={10} className="text-success" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-medium text-xs text-foreground">
                      {activeLabel} ready for review
                    </span>
                    <span className="text-xs text-muted-foreground leading-4">
                      Check the preview on the left. Use quick actions below or type a style command, then
                      submit for {PSP_TEAM_LABEL} review ({PSP_TEAM_DESCRIPTION}).
                    </span>
                  </div>
                </div>

                <PromptEventThread events={promptEvents} />

                <TemplateThumbnailGallery
                  templates={onedriveTemplates}
                  activeTemplate={activeTemplate}
                  recommendedTemplateId={recommendedTemplateId}
                  onSelect={setActiveTemplate}
                  onOpenFullPreview={() => setPreviewModalOpen(true)}
                />
              </>
            )}

            {approvals.map((approval) => (
              <div key={approval.id} className="flex flex-col gap-2">
                <div className="flex justify-end">
                  <div className="bg-primary/10 border border-primary/30 rounded-[12px] rounded-tr-[4px] px-3 py-2 max-w-[90%]">
                    <p className="text-xs text-foreground leading-5">{approval.userMessage}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <SparkLogo size={14} />
                  <div className="rounded-[10px] px-3 py-2 border bg-card border-border flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-medium text-foreground leading-5">
                        Sent to {PSP_TEAM_LABEL} for review
                      </p>
                      <ApprovalStatusBadge status={approval.status} />
                    </div>
                    <NotificationChannelsSent
                      notifications={approval.notifications ?? lastNotificationChannels}
                    />
                    {approval.pspComment && (
                      <p className="text-xs text-muted-foreground mt-1.5 leading-4">
                        PSP: {approval.pspComment}
                      </p>
                    )}
                  </div>
                </div>
                {approval.status === APPROVAL_STATUS.APPROVED && (
                  <InlineEmailCard approval={approval} onUpdate={workflow.handleUpdateApproval} />
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {showPrompt && (
        <div
          className={cn(
            "flex-shrink-0 border-t border-border bg-muted",
            isExpanded ? "flex flex-col items-center px-4 py-4 gap-2" : "p-3 flex flex-col gap-2",
          )}
        >
          <div className={cn("w-full flex flex-col gap-2", isExpanded && "max-w-lg")}>
            {stage === "preview" && (
              <div className="flex flex-col gap-1.5">
                <PromptCommandChips
                  chips={previewChips}
                  onSelect={(cmd) => runPreviewCommand(cmd)}
                  showSubmitApproval
                  onSubmitApproval={() => handleRequestApproval(SUBMIT_APPROVAL_COMMAND)}
                />
                <PromptCommandChips
                  chips={styleUtilityChips}
                  onSelect={(cmd) => runPreviewCommand(cmd)}
                />
              </div>
            )}
            <PromptBox
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              showPicker={showPicker}
              pickerQuery={pickerQuery}
              onSelectUser={handleSelectUser}
              isSending={isSending}
              placeholder={
                stage === "preview"
                  ? "Type a style command or use the chips above…"
                  : "/kudos @Name — your message and at least one email…"
              }
            />
          </div>
        </div>
      )}

      <KudosPreviewModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        templateId={activeTemplate}
        recipients={selectedRecipients}
        content={templateContent}
      />
    </div>
  );
}

export function KudosPanelHeader({ onToggleExpand, onClose, isExpanded }) {
  return (
    <div className="flex items-center gap-2 h-14 px-3 border-b border-border flex-shrink-0 bg-card">
      <AgentPlaceholder />
      <span className="flex-1 text-sm font-medium text-foreground leading-5 truncate">
        Customer Appreciation
      </span>
      {onToggleExpand && (
        <button
          type="button"
          aria-label={isExpanded ? "Restore panel size" : "Maximize"}
          onClick={onToggleExpand}
          className="flex items-center justify-center size-7 rounded-[6px] text-muted-foreground hover:bg-muted transition-colors"
        >
          {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close conversation"
        className="flex items-center justify-center size-7 rounded-[6px] text-muted-foreground hover:bg-muted transition-colors"
      >
        <X size={15} aria-hidden />
      </button>
    </div>
  );
}
