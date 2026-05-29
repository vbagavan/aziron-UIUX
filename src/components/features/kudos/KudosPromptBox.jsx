import { useEffect, useMemo, useRef, useState } from "react";
import { History, MicOff, Paperclip, Plus, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { getActiveMention } from "@/lib/kudosEmailUtils";

import { KudosDriveFileList } from "./KudosDriveFileList";
import { USERS } from "./constants";
import { UserAvatar } from "./kudosPrimitives";
import {
  KUDOS_BODY,
  KUDOS_CAPTION,
  KUDOS_MENTION_EMAIL,
  KUDOS_MENTION_NAME,
} from "./kudosTypography";

const PROMPT_TEXTAREA_MAX_HEIGHT = 160;
const PROMPT_TEXTAREA_MIN_HEIGHT = 56;

function UserPickerDropdown({
  query,
  onSelect,
  selectedEmails = [],
  activeIndex = 0,
  listId,
}) {
  const filtered = USERS.filter(
    (u) =>
      !selectedEmails.includes(u.email) &&
      (u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <div
      id={listId}
      role="listbox"
      aria-label="Mention a colleague"
      className="mb-1 max-h-[260px] overflow-y-auto rounded-lg border border-border bg-popover shadow-md"
    >
      {filtered.length === 0 && (
        <p className={cn("px-3 py-2", KUDOS_CAPTION)}>No matching people</p>
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
            "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
            idx !== 0 && "border-t border-border",
            idx === activeIndex ? "bg-muted" : "hover:bg-muted",
          )}
        >
          <UserAvatar name={user.name} color={user.color} size={30} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className={cn("truncate", KUDOS_MENTION_NAME)}>{user.name}</span>
            <span className={cn("truncate", KUDOS_MENTION_EMAIL)}>{user.email}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

export function KudosPromptBox({
  value,
  onChange,
  onSend,
  showPicker,
  pickerQuery,
  onSelectUser,
  placeholder = "Ask anything, or describe your task…",
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
  const [driveListExpanded, setDriveListExpanded] = useState(false);
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
    if (showPicker) setDriveListExpanded(false);
  }, [showPicker]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const minH = PROMPT_TEXTAREA_MIN_HEIGHT;
    if (!value.trim()) {
      el.style.height = `${minH}px`;
      return;
    }
    el.style.height = "auto";
    const next = Math.min(Math.max(el.scrollHeight, minH), PROMPT_TEXTAREA_MAX_HEIGHT);
    el.style.height = `${next}px`;
  }, [value]);

  const handleSendClick = () => {
    if (!value.trim() || isSending) return;
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

  const canSend = Boolean(value.trim()) && !isSending;

  const showDrivePanel = templatesLoading || driveFiles.length > 0;

  return (
    <div className="w-full">
      {showPicker && (
        <UserPickerDropdown
          query={pickerQuery}
          onSelect={onSelectUser}
          selectedEmails={selectedEmails}
          activeIndex={pickerIndex}
          listId={listId}
        />
      )}

      <InputGroup
        className={cn(
          "h-auto w-full flex-col gap-0 overflow-hidden rounded-2xl border-border bg-card shadow-sm",
          "dark:bg-card has-disabled:opacity-100 has-disabled:bg-card",
          "has-[[data-slot=input-group-control]:focus-visible]:border-ring",
        )}
      >
        {showDrivePanel && (
          <InputGroupAddon
            align="block-start"
            className="w-full cursor-default !p-0 [&:has(.border-b)]:!pb-0"
          >
            <KudosDriveFileList
              files={driveFiles}
              activeFileId={activeTemplateId}
              contextFileIds={promptContextFileIds}
              onSelectFile={onSelectDriveFile}
              onRemoveFile={onRemoveContextFile}
              loading={templatesLoading}
              expanded={driveListExpanded}
              onExpandedChange={setDriveListExpanded}
              compact
              className="w-full border-0"
            />
          </InputGroupAddon>
        )}

        <InputGroupTextarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          aria-label="Message input"
          aria-controls={showPicker ? listId : undefined}
          aria-expanded={showPicker}
          aria-autocomplete={showPicker ? "list" : undefined}
          className={cn(
            "max-h-40 min-h-14 resize-none border-0 bg-transparent px-4 pt-4 pb-1 shadow-none dark:bg-transparent",
            KUDOS_BODY,
          )}
          style={{ height: `${PROMPT_TEXTAREA_MIN_HEIGHT}px` }}
        />

        <InputGroupAddon
          align="block-end"
          className="w-full cursor-default justify-between gap-2 px-3 pb-3 pt-1 text-foreground"
        >
          <div className="flex items-center gap-0.5">
            {showDrivePanel && (
              <InputGroupButton
                size="icon-sm"
                variant="outline"
                aria-label={driveListExpanded ? "Collapse template list" : "Expand template list"}
                aria-expanded={driveListExpanded}
                title={driveListExpanded ? "Collapse template list" : "Expand template list"}
                className={cn(driveListExpanded && "border-primary/40 bg-primary/10")}
                onClick={() => setDriveListExpanded((v) => !v)}
              >
                <Plus />
              </InputGroupButton>
            )}
            <InputGroupButton
              size="icon-sm"
              variant="outline"
              aria-label="Conversation history"
              title="Conversation history"
            >
              <History />
            </InputGroupButton>
          </div>

          <div className="flex items-center gap-0.5">
            <InputGroupButton
              size="icon-sm"
              variant="outline"
              aria-disabled
              tabIndex={-1}
              aria-label="Voice input unavailable"
              title="Voice input unavailable"
              className="pointer-events-none opacity-40"
            >
              <MicOff />
            </InputGroupButton>
            <InputGroupButton
              size="icon-sm"
              variant="outline"
              aria-label="Attach template"
              title="Attach template"
              onClick={() => showDrivePanel && setDriveListExpanded(true)}
            >
              <Paperclip />
            </InputGroupButton>
            <Button
              type="button"
              size="icon-lg"
              variant="default"
              className="rounded-full"
              onClick={handleSendClick}
              disabled={!canSend}
              aria-label={isSending ? "Sending" : "Send message"}
              aria-busy={isSending}
            >
              {isSending ? <Spinner /> : <Send />}
            </Button>
          </div>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
