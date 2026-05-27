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
  Paperclip,
  Wrench,
  Database,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import RichMessage from "@/components/common/RichMessage";
import UserMessage from "@/components/features/chat/UserMessage";
import AIMessage from "@/components/features/chat/AIMessage";
import KudosRecipientsTableBlock from "./blocks/KudosRecipientsTableBlock";
import KudosApprovalStatusBlock from "./blocks/KudosApprovalStatusBlock";
import KudosTemplatePreviewBlock from "./blocks/KudosTemplatePreviewBlock";
import { getActiveMention } from "@/lib/kudosEmailUtils";
import { templatesToDriveFiles } from "@/services/oneDriveTemplates";
import { buildIntroBlocks } from "./kudosConversation";
import {
  KudosDriveContextChip,
  KudosDriveFileList,
} from "./KudosDriveFileList";
import {
  USERS,
  TEMPLATES,
  PREVIEW_COMMAND_CHIPS,
  SUBMIT_FOR_APPROVAL_COMMAND,
  SUBMIT_FOR_APPROVAL_LABEL,
} from "./constants";
import { UserAvatar } from "./kudosPrimitives";

export { UserAvatar, SparkLogo, getInitials } from "./kudosPrimitives";

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
  driveFiles = [],
  activeTemplateId,
  promptContextFileIds = [],
  onSelectDriveFile,
  onRemoveContextFile,
  templatesLoading = false,
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
    "w-full overflow-hidden rounded-[12px] border bg-card transition-all duration-150",
    "shadow-[0_4px_24px_0_rgba(37,99,235,0.10)] dark:shadow-none",
    focused
      ? "border-primary border-2 shadow-[0_0_0_4px_color-mix(in_oklch,var(--color-primary)_8%,transparent)]"
      : "border-border",
  );

  const canSend = Boolean(value.trim()) && !isSending;

  const promptContextFiles = useMemo(
    () =>
      promptContextFileIds
        .map((id) => driveFiles.find((f) => f.id === id))
        .filter(Boolean),
    [driveFiles, promptContextFileIds],
  );

  const showDrivePanel = templatesLoading || driveFiles.length > 0;

  return (
    <div className="w-full">
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

      <div className={shellClass}>
        {showDrivePanel && (
          <KudosDriveFileList
            files={driveFiles}
            activeFileId={activeTemplateId}
            contextFileIds={promptContextFileIds}
            onSelectFile={onSelectDriveFile}
            loading={templatesLoading}
          />
        )}

        {promptContextFiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
            {promptContextFiles.map((file) => (
              <KudosDriveContextChip
                key={file.id}
                file={file}
                onRemove={onRemoveContextFile}
              />
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 px-3 py-3">
          <button
            type="button"
            aria-label="Attach file"
            title="Attach file"
            className="mb-0.5 flex size-9 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <Paperclip size={16} aria-hidden />
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
            aria-label="Message input"
            aria-controls={showPicker ? listId : undefined}
            aria-expanded={showPicker}
            aria-autocomplete={showPicker ? "list" : undefined}
            className="min-h-[36px] max-h-[120px] min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-1 text-sm leading-6 text-foreground placeholder:text-muted-foreground outline-none"
          />

          <button
            type="button"
            onClick={handleSendClick}
            disabled={!canSend}
            aria-label={isSending ? "Sending" : "Send message"}
            aria-busy={isSending}
            className={cn(
              "mb-0.5 flex size-9 flex-shrink-0 items-center justify-center rounded-full border transition-colors",
              canSend
                ? "border-border bg-primary text-primary-foreground hover:bg-primary"
                : "cursor-not-allowed border-border bg-card text-muted-foreground",
            )}
          >
            <Send size={14} aria-hidden className={isSending ? "animate-pulse" : ""} />
          </button>
        </div>

        <div className="flex h-9 items-center justify-between px-3">
          <div className="flex min-w-0 items-center gap-0.5">
            <button
              type="button"
              className="flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-xs text-muted-foreground transition-colors hover:bg-muted"
            >
              <Wrench size={14} aria-hidden />
              <span>Tools</span>
            </button>
            <div className="mx-0.5 h-4 w-px bg-border" />
            <button
              type="button"
              aria-label="Browse knowledge hub"
              title="Knowledge Hub"
              className="flex size-7 items-center justify-center rounded-[6px] text-muted-foreground transition-colors hover:bg-muted"
            >
              <Database size={14} aria-hidden />
            </button>
            <div className="mx-0.5 h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5 px-1.5" title="Context window usage">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <circle cx="7" cy="7" r="5" stroke="var(--border)" strokeWidth="3" fill="none" />
                <circle
                  cx="7"
                  cy="7"
                  r="5"
                  stroke="var(--primary)"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${0.65 * 2 * Math.PI * 5} ${2 * Math.PI * 5}`}
                  strokeDashoffset={2 * Math.PI * 5 * 0.25}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-xs text-muted-foreground">65% used</span>
            </div>
          </div>

          <button
            type="button"
            aria-label="Select AI model"
            className="flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            <Cpu size={14} aria-hidden />
            <span className="hidden sm:inline">Claude-sonnet</span>
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
    templatesLoading,
    promptContextFileIds,
    handleDriveFileSelect,
    detachDriveFileFromPrompt,
  } = workflow;

  const driveFiles = useMemo(
    () => templatesToDriveFiles(onedriveTemplates?.length ? onedriveTemplates : TEMPLATES),
    [onedriveTemplates],
  );

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

      {/* Prompt box — matches agent chat footer */}
      {showPrompt && (
        <div className="flex flex-shrink-0 flex-col gap-2 px-3 pb-3 pt-2">
          {stage === "preview" && (
            <div className="flex flex-wrap gap-1.5">
              {PREVIEW_COMMAND_CHIPS.filter(
                (c) => c.command !== "__reset_styles__" && c.command !== "__undo_style__",
              ).map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => runPreviewCommand(chip.command)}
                  className="rounded-full border border-border bg-card px-2 py-1 text-[10px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {chip.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleRequestApproval(SUBMIT_FOR_APPROVAL_COMMAND)}
                className="rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {SUBMIT_FOR_APPROVAL_LABEL}
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
            driveFiles={driveFiles}
            activeTemplateId={activeTemplate}
            promptContextFileIds={promptContextFileIds}
            onSelectDriveFile={handleDriveFileSelect}
            onRemoveContextFile={detachDriveFileFromPrompt}
            templatesLoading={templatesLoading && onedriveTemplates.length === 0}
            placeholder={
              stage === "preview"
                ? `Try "blue background", "dark theme", the chips above, or type "${SUBMIT_FOR_APPROVAL_COMMAND}"…`
                : "@Zoya Baum — thank you for… name@company.com"
            }
          />
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
