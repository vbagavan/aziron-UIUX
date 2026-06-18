import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

/** Prompt box styled like the agent conversation panel. */
export function SourceAskPromptBox({
  inputRef,
  value,
  onChange,
  onKeyDown,
  onSend,
  placeholder,
  disabled = false,
  loading = false,
  ariaLabel = "Message input",
  footer,
}) {
  const canSend = value.trim().length > 0 && !loading && !disabled;

  function handleKeyDown(e) {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend?.();
    }
  }

  return (
    <div className="shrink-0 px-4 pb-4 pt-2">
      <div className="overflow-hidden rounded-[12px] border border-border bg-card shadow-[0_4px_24px_0_rgba(37,99,235,0.10)]">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            aria-label={ariaLabel}
            className="flex-1 bg-transparent text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => onSend?.()}
            disabled={!canSend}
            aria-label="Send message"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors",
              canSend
                ? "border-border bg-primary text-primary-foreground hover:bg-primary"
                : "cursor-not-allowed border-border bg-card text-foreground",
            )}
          >
            <Send size={14} />
          </button>
        </div>
        {footer ? (
          <div className="flex flex-wrap items-center gap-1 px-3 py-2">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
