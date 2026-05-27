import { useRef, useEffect, useState, useMemo } from "react";
import {
  Bot,
  X,
  Check,
  Send,
  Mail,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import RichMessage from "@/components/common/RichMessage";
import UserMessage from "@/components/features/chat/UserMessage";
import AIMessage from "@/components/features/chat/AIMessage";
import KudosRecipientsTableBlock from "./blocks/KudosRecipientsTableBlock";
import KudosApprovalStatusBlock from "./blocks/KudosApprovalStatusBlock";
import KudosTemplatePreviewBlock from "./blocks/KudosTemplatePreviewBlock";
import { getActiveMention } from "@/lib/kudosEmailUtils";
import { buildIntroBlocks } from "./kudosConversation";
import {
  USERS,
  TEMPLATES,
  PREVIEW_COMMAND_CHIPS,
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

function UserPickerDropdown({
  query,
  onSelect,
  selectedEmails = [],
  activeIndex = 0,
  listId,
}) {
  const filtered = USERS.filter(
    (u) =>
      !selectedEmails.includes(u.email) && (
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())
      ),
  );

  return (
    <div
      id={listId}
      role="listbox"
      aria-label="Mention a colleague"
      className="bg-card border border-border rounded-[8px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.08)] overflow-y-auto"
      style={{ maxHeight: 260 }}
    >
      {filtered.length === 0 && (
        <p className="px-3 py-2 text-xs text-muted-foreground">No matching people</p>
      )}
      {filtered.map((user, idx) => (
        <button
          key={user.id}
          type="button"
          role="option"
          aria-selected={idx === activeIndex}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(user);
          }}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
            idx !== 0 ? "border-t border-border" : "",
            idx === activeIndex ? "bg-muted" : "hover:bg-muted",
          )}
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

function PromptBox({
  value,
  onChange,
  onSend,
  showPicker,
  pickerQuery,
  onSelectUser,
  placeholder = "Describe who you are recognizing. Include an email or @name…",
  isSending = false,
  selectedEmails = [],
}) {
  const textareaRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const [pickerIndex, setPickerIndex] = useState(0);
  const listId = "kudos-mention-list";

  const filteredUsers = useMemo(
    () =>
      USERS.filter(
        (u) =>
          !selectedEmails.includes(u.email) &&
          (u.name.toLowerCase().includes(pickerQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(pickerQuery.toLowerCase())),
      ),
    [pickerQuery, selectedEmails],
  );

  useEffect(() => {
    setPickerIndex(0);
  }, [pickerQuery, showPicker]);

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
    if (showPicker && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setPickerIndex((i) => (i + 1) % filteredUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setPickerIndex((i) => (i - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSelectUser(filteredUsers[pickerIndex]);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
      return;
    }
    if (e.key === "Escape" && showPicker) {
      e.preventDefault();
      const mention = getActiveMention(value);
      if (mention) onChange(value.slice(0, mention.atIdx));
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
            <UserPickerDropdown
              query={pickerQuery}
              onSelect={onSelectUser}
              selectedEmails={selectedEmails}
              activeIndex={pickerIndex}
              listId={listId}
            />
          </div>
        )}

        {/* Row 1: Input Controls */}
        <div className="border border-border rounded-t-[12px] flex items-end gap-2 p-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            rows={1}
            aria-controls={showPicker ? listId : undefined}
            aria-expanded={showPicker}
            aria-autocomplete={showPicker ? "list" : undefined}
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
      </div>
    </div>
  );
}

function hydrateKudosBlocks(blocks, ctx) {
  if (!blocks?.length) return blocks;
  return blocks.map((block) => {
    if (block.type === "kudos_template_preview") {
      return {
        ...block,
        templateId: ctx.activeTemplate,
        templates: ctx.onedriveTemplates?.length ? ctx.onedriveTemplates : TEMPLATES,
        recommendedTemplateId: ctx.recommendedTemplateId,
        recommended: ctx.activeTemplate === ctx.recommendedTemplateId,
        onSelectTemplate: ctx.selectTemplate ?? ctx.setActiveTemplate,
      };
    }
    if (block.type === "kudos_recipients_table") {
      return {
        ...block,
        recipients: ctx.selectedRecipients,
        emailTo: ctx.compose.emailTo,
        emailCc: ctx.compose.emailCc,
      };
    }
    if (block.type === "kudos_approval_status") {
      return {
        ...block,
        lastNotificationChannels: ctx.lastNotificationChannels,
        onUpdate: ctx.handleUpdateApproval,
      };
    }
    return block;
  });
}

export function KudosConversationBody({ workflow, isExpanded = false }) {
  const {
    stage,
    activeTemplate,
    setActiveTemplate,
    selectTemplate,
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
    chatMessages,
    selectedRecipients,
    isSending,
    liveStatus,
    handleUpdateApproval,
    chatScrollEpoch,
    reset,
  } = workflow;

  const messagesEndRef = useRef(null);

  const hydrateCtx = useMemo(
    () => ({
      activeTemplate,
      setActiveTemplate,
      selectTemplate,
      onedriveTemplates,
      recommendedTemplateId,
      selectedRecipients,
      compose,
      lastNotificationChannels,
      handleUpdateApproval,
    }),
    [
      activeTemplate,
      setActiveTemplate,
      selectTemplate,
      onedriveTemplates,
      recommendedTemplateId,
      selectedRecipients,
      compose,
      lastNotificationChannels,
      handleUpdateApproval,
    ],
  );

  const conversationMessages = useMemo(() => {
    const msgs = [];

    const history = chatMessages ?? [];

    if (history.length === 0 && stage === "idle" && !inputValue) {
      msgs.push({
        id: "intro",
        role: "assistant",
        blocks: buildIntroBlocks(),
      });
    }

    msgs.push(...history);

    approvals.forEach((approval) => {
      if (history.some((m) => m.id === `approval-request-${approval.id}`)) return;

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
          },
        ],
      });
    });

    return msgs;
  }, [chatMessages, stage, inputValue, approvals]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatScrollEpoch]);

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
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-3 py-3">
        <div className="flex min-h-full flex-col justify-end gap-3">
        {conversationMessages.map((msg) => {
          if (msg.role === "user") {
            return (
              <UserMessage key={msg.id}>
                <p className="whitespace-pre-wrap text-sm leading-6">{msg.content}</p>
              </UserMessage>
            );
          }

          const blocks = hydrateKudosBlocks(msg.blocks, hydrateCtx);
          const hasProtectedBlocks = blocks?.some((block) =>
            ["thinking", "timeline", "tool_execution", "generating"].includes(block.type),
          );

          return (
            <AIMessage
              key={msg.id}
              className={
                hasProtectedBlocks ? "max-w-none bg-transparent px-0 py-0 ring-0" : undefined
              }
            >
              <RichMessage blocks={blocks} />
            </AIMessage>
          );
        })}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Footer */}
      {showPrompt && (
        <div
          className={cn(
            "flex-shrink-0 border-t border-border bg-muted",
            "p-3 flex flex-col gap-2",
          )}
        >
          <div className="w-full flex flex-col gap-2">
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

            <PromptBox
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              showPicker={showPicker}
              pickerQuery={pickerQuery}
              onSelectUser={handleSelectUser}
              isSending={isSending}
              selectedEmails={selectedRecipients.map((r) => r.email)}
              placeholder={
                stage === "preview"
                  ? 'Try "blue background" or "dark theme", or use the chips above…'
                  : "@Zoya Baum — thank you for… name@company.com"
              }
            />
          </div>
        </div>
      )}

    </div>
  );
}

export function KudosPanelHeader({
  onToggleExpand,
  onClose,
  onReset,
  isExpanded,
  expandPreviewLabel = false,
}) {
  return (
    <div className="flex items-center gap-2 h-14 px-3 border-b border-border flex-shrink-0 bg-card">
      <AgentPlaceholder />
      <span className="flex-1 text-sm font-medium text-foreground leading-5 truncate">
        Customer Appreciation
      </span>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          title="Start over"
          aria-label="Start over"
          className="flex items-center justify-center size-7 rounded-[6px] text-muted-foreground hover:bg-muted transition-colors"
        >
          <RotateCcw size={14} aria-hidden />
        </button>
      )}
      {onToggleExpand && (
        <button
          type="button"
          aria-label={expandPreviewLabel ? "Expand preview to full width" : "Expand panel"}
          title={expandPreviewLabel ? "Expand preview" : "Expand"}
          onClick={onToggleExpand}
          className="flex items-center justify-center size-7 rounded-[6px] text-muted-foreground hover:bg-muted transition-colors"
        >
          {isExpanded && !expandPreviewLabel ? (
            <Minimize2 size={15} />
          ) : (
            <Maximize2 size={15} />
          )}
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
