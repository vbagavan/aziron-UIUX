import { useRef, useEffect, useState, useMemo } from "react";
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
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import TemplateThumbnailGallery from "./TemplateThumbnailGallery";
import KudosPreviewModal from "./KudosPreviewModal";
import RichMessage from "@/components/common/RichMessage";
import UserMessage from "@/components/features/chat/UserMessage";
import AIMessage from "@/components/features/chat/AIMessage";
import KudosRecipientsTableBlock from "./blocks/KudosRecipientsTableBlock";
import KudosApprovalStatusBlock from "./blocks/KudosApprovalStatusBlock";
import KudosTemplatePreviewBlock from "./blocks/KudosTemplatePreviewBlock";
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

/* ── Context-aware Tools & Timeline ────────────────────────────── */
function getContextualTools(inputValue, stage, compose) {
  const tools = [];
  const lowerInput = (inputValue || "").toLowerCase();

  // Detect intent from user input
  if (lowerInput.includes("template") || lowerInput.includes("design")) {
    tools.push({ icon: "🎨", label: "Change Template", id: "template" });
  }
  if (lowerInput.includes("style") || lowerInput.includes("color") || lowerInput.includes("theme")) {
    tools.push({ icon: "🎨", label: "Style Options", id: "style" });
  }
  if (lowerInput.includes("approve") || lowerInput.includes("send")) {
    tools.push({ icon: "✓", label: "Request Approval", id: "approval" });
  }
  if (lowerInput.includes("recipient") || lowerInput.includes("@")) {
    tools.push({ icon: "👥", label: "Manage Recipients", id: "recipients" });
  }
  if (stage === "preview") {
    tools.push({ icon: "🔍", label: "Preview", id: "preview" });
  }

  // Default tools
  if (tools.length === 0) {
    tools.push(
      { icon: "💬", label: "Message", id: "message" },
      { icon: "📅", label: "Timeline", id: "timeline" },
      { icon: "🎨", label: "Template", id: "template" }
    );
  }

  return tools;
}

function getContextualTimeline(stage, compose, approvals) {
  const timeline = [];

  timeline.push({
    step: 1,
    title: "Draft",
    status: compose.message ? "done" : "pending",
  });

  if (["loading-templates", "generating", "preview"].includes(stage)) {
    timeline.push({
      step: 2,
      title: "Generate",
      status: stage === "preview" ? "done" : "active",
    });
  }

  if (approvals.length > 0 || stage === "preview") {
    timeline.push({
      step: 3,
      title: "Approval",
      status: approvals.some(a => a.status === APPROVAL_STATUS.APPROVED) ? "done" : "pending",
    });
  }

  return timeline;
}

function UserPickerDropdown({ query, onSelect, selectedEmails = [] }) {
  const filtered = USERS.filter(
    (u) =>
      !selectedEmails.includes(u.email) && (
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())
      ),
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

function FooterChip({ icon: Icon, iconSize = 13, label, chevron = true, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-md px-1.5 py-1
        text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
    >
      {Icon && <Icon size={iconSize} className="shrink-0 opacity-70" />}
      <span>{label}</span>
      {chevron && <ChevronDown size={10} className="shrink-0 opacity-50" />}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-4 bg-border shrink-0" />;
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
  selectedEmails = [],
  workflow,
}) {
  const textareaRef = useRef(null);
  const [focused, setFocused] = useState(false);

  const { stage, compose, approvals } = workflow;
  const contextualTools = useMemo(() => getContextualTools(value, stage, compose), [value, stage, compose]);
  const contextualTimeline = useMemo(() => getContextualTimeline(stage, compose, approvals), [stage, compose, approvals]);

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

  const shellClass = cn(
    "rounded-[12px] border bg-card transition-all duration-150",
    "shadow-[0px_5px_10px_-2px_rgba(0,0,0,0.08)]",
    "dark:bg-card",
    focused
      ? "border-primary border-2 shadow-[0_0_0_4px_color-mix(in_oklch,var(--color-primary)_8%,transparent)]"
      : "border-border",
  );

  return (
    <div className="w-full">
      <div className={shellClass}>
        {/* User Picker Dropdown */}
        {showPicker && (
          <div className="mb-1">
            <UserPickerDropdown query={pickerQuery} onSelect={onSelectUser} selectedEmails={selectedEmails} />
          </div>
        )}

        {/* Row 1: Input Controls */}
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
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
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

        {/* Divider */}
        <div className="h-px bg-muted" />

        {/* Row 2: Footer Toolbar with Context-Aware Tools */}
        <div className="border-b border-l border-r border-border rounded-b-[12px] flex items-center justify-between px-3 py-2 gap-2 flex-wrap">
          <div className="flex items-center gap-0.5">
            <FooterChip icon={Wrench} label="Tools" />
          </div>

          {/* Right: Model selector */}
          <FooterChip icon={Cpu} iconSize={12} label="Claude-sonnet" />
        </div>
      </div>
    </div>
  );
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
    handleUpdateApproval,
  } = workflow;

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (["generating", "preview", "loading-templates"].includes(stage)) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [stage, approvals, activeTemplate, promptEvents]);

  // Build conversational messages from workflow state
  const conversationMessages = useMemo(() => {
    const msgs = [];

    // Initial intro message
    if (stage === "idle" && !compose.message && !inputValue) {
      msgs.push({
        id: "intro",
        role: "assistant",
        blocks: [
          {
            type: "heading",
            level: 2,
            content: "Create a customer appreciation",
          },
          {
            type: "text",
            content: `Describe who you're recognizing and include at least one email. Example: /kudos @Zoya — thank you! zbaum@aziro.com`,
          },
        ],
      });
    }

    // User message with their input
    if (compose.message && stage !== "idle") {
      msgs.push({
        id: "user-compose",
        role: "user",
        content: compose.message,
      });
    }

    // Template loading + preview message
    if (["loading-templates", "generating", "preview"].includes(stage)) {
      const blocks = [];

      if (stage === "loading-templates") {
        blocks.push({ type: "thinking", duration: "2.4s" });
      }
      if (stage === "generating") {
        blocks.push({ type: "generating" });
      }

      blocks.push({
        type: "heading",
        level: 3,
        content: "Preview ready for review",
      });

      // Recipients table
      blocks.push({
        type: "kudos_recipients_table",
        recipients: selectedRecipients,
        emailTo: compose.emailTo,
        emailCc: compose.emailCc,
      });

      // Template preview
      blocks.push({
        type: "kudos_template_preview",
        templateId: activeTemplate,
        recommended: activeTemplate === recommendedTemplateId,
        onSelectTemplate: setActiveTemplate,
        onViewFullPreview: () => setPreviewModalOpen(true),
      });

      // Template gallery
      blocks.push({
        type: "text",
        content: "Select a different template or adjust the style:",
      });

      msgs.push({
        id: "templates",
        role: "assistant",
        blocks,
      });
    }

    // Approval messages
    if (approvals.length > 0) {
      approvals.forEach((approval) => {
        msgs.push({
          id: `approval-request-${approval.id}`,
          role: "user",
          content: approval.userMessage,
        });

        msgs.push({
          id: `approval-response-${approval.id}`,
          role: "assistant",
          blocks: [
            {
              type: "kudos_approval_status",
              approval,
              lastNotificationChannels,
              onUpdate: handleUpdateApproval,
            },
          ],
        });
      });
    }

    return msgs;
  }, [
    stage,
    compose.message,
    compose.emailTo,
    compose.emailCc,
    inputValue,
    approvals,
    activeTemplate,
    recommendedTemplateId,
    selectedRecipients,
    lastNotificationChannels,
    handleUpdateApproval,
  ]);

  const activeLabel =
    onedriveTemplates.find((t) => t.id === activeTemplate)?.label ??
    TEMPLATES.find((t) => t.id === activeTemplate)?.label ??
    "Template";

  const showPrompt = ["idle", "compose", "empty", "preview"].includes(stage);

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

      {/* Message Thread */}
      <div className="flex-1 min-h-0 overflow-hidden px-3 py-3 flex flex-col gap-3 justify-end">
        {conversationMessages.map((msg) => {
          if (msg.role === "user") {
            return (
              <UserMessage key={msg.id}>
                <p className="text-sm">{msg.content}</p>
              </UserMessage>
            );
          }

          return (
            <AIMessage key={msg.id}>
              <RichMessage blocks={msg.blocks} />
            </AIMessage>
          );
        })}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      {showPrompt && (
        <div
          className={cn(
            "flex-shrink-0 border-t border-border bg-muted",
            isExpanded ? "flex flex-col items-center px-4 py-4 gap-2" : "p-3 flex flex-col gap-2",
          )}
        >
          <div className={cn("w-full flex flex-col gap-2", isExpanded && "max-w-lg")}>
            <PromptBox
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              showPicker={showPicker}
              pickerQuery={pickerQuery}
              onSelectUser={handleSelectUser}
              isSending={isSending}
              selectedEmails={selectedRecipients.map((r) => r.email)}
              workflow={workflow}
              placeholder={
                stage === "preview"
                  ? "Type a style command or use the chips above…"
                  : "/kudos @Name — your message and at least one email…"
              }
            />

            {/* Style command chips - shown in preview stage */}
            {stage === "preview" && (
              <div className="flex flex-wrap gap-1.5">
                {PREVIEW_COMMAND_CHIPS.filter(
                  (c) => c.command !== "__reset_styles__" && c.command !== "__undo_style__",
                ).map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => runPreviewCommand(chip.command)}
                    className="text-[10px] font-medium px-2 py-1 rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors"
                  >
                    {chip.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleRequestApproval(SUBMIT_APPROVAL_COMMAND)}
                  className="text-[10px] font-semibold px-2 py-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Submit for approval
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
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
