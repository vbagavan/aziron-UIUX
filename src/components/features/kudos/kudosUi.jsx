import { useRef, useEffect, useMemo } from "react";
import {
  Bot,
  X,
  Check,
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
import { templatesToDriveFiles } from "@/services/oneDriveTemplates";
import { buildIntroBlocks } from "./kudosConversation";
import { KudosPromptBox } from "./KudosPromptBox";
import {
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

          <KudosPromptBox
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
