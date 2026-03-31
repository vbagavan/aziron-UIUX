import { useMemo, useState } from "react";
import { ChevronDown, Cpu, Database, Mic, Paperclip, Send, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/* ── Usage donut (65%) ───────────────────────────────────────────── */
function UsageDonut({ pct = 0.65, size = 13 }) {
  const r = 4.5;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r={r} stroke="var(--color-border)" strokeWidth="2.5" />
      <circle
        cx="6.5" cy="6.5" r={r}
        stroke="var(--color-primary)"
        strokeWidth="2.5"
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        transform="rotate(-90 6.5 6.5)"
      />
    </svg>
  );
}

/* ── Vertical separator ──────────────────────────────────────────── */
function Sep() {
  return <div className="w-px h-4 bg-border shrink-0" />;
}

/* ── Footer chip button ──────────────────────────────────────────── */
function FooterChip({ icon: Icon, iconSize = 13, label, chevron = true, onClick }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      onClick={onClick}
      className="flex items-center gap-1 rounded-md px-1.5 py-1
        text-xs text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
    >
      {Icon && <Icon size={iconSize} className="shrink-0 opacity-70" />}
      <span>{label}</span>
      {chevron && <ChevronDown size={10} className="shrink-0 opacity-50" />}
    </Button>
  );
}

/* ── Main ChatInput ──────────────────────────────────────────────── */
export default function ChatInput({
  value,
  onChange,
  onKeyDown,
  onSend,
  onVoice,
  onAttach,
  onSuggestionSelect,
  disabled,
  suggestions = [],
  textareaRef,
}) {
  const [focused, setFocused] = useState(false);

  /* Figma: rounded-[12px], border-2 border-primary on focus */
  const shellClass = useMemo(() => cn(
    "rounded-[12px] border bg-white transition-all duration-150",
    "shadow-[0px_5px_10px_-2px_rgba(0,0,0,0.08)]",
    "dark:bg-[#111827]",
    focused
      ? "border-primary border-2 shadow-[0_0_0_4px_color-mix(in_oklch,var(--color-primary)_8%,transparent)]"
      : "border-border",
  ), [focused]);

  return (
    <div className="w-full">
      {/* Suggestion chips */}
      {suggestions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <Button
              key={s}
              type="button"
              variant="outline"
              size="xs"
              onClick={() => onSuggestionSelect?.(s)}
              className="rounded-full border border-border bg-white px-3 py-1.5 text-xs
                font-medium text-muted-foreground transition-colors
                hover:border-primary/40 hover:text-primary dark:bg-muted/20"
            >
              {s}
            </Button>
          ))}
        </div>
      )}

      <div className={shellClass}>

        {/* ── Row 1: Attach · Textarea · Voice · Send ── */}
        <div className="flex items-end gap-2 px-3 pt-3 pb-2.5">

          {/* Attach */}
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border
              bg-white text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary
              dark:bg-muted/20"
            aria-label="Attach file"
            onClick={onAttach}
          >
            <Paperclip size={14} />
          </Button>

          {/* Textarea — DS text-sm (14 px) */}
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={1}
            placeholder="Continue the conversation…"
            className="min-h-[44px] resize-none border-0 bg-transparent px-0 py-1.5
              text-sm leading-6 shadow-none ring-0 placeholder:text-muted-foreground/60
              focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
          />

          {/* Voice + Send — both outlined circles per Figma */}
          <div className="flex shrink-0 items-center gap-1.5 pb-0.5">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Start voice input"
              onClick={onVoice}
              className="flex size-8 items-center justify-center rounded-full border border-border
                bg-white text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary
                dark:bg-muted/20"
            >
              <Mic size={14} />
            </Button>

            <Button
              type="button"
              size="icon-sm"
              aria-label="Send message"
              onClick={onSend}
              disabled={disabled}
              className={cn(
                "flex size-8 items-center justify-center rounded-full border transition-colors",
                disabled
                  ? "border-border bg-white text-muted-foreground/40 cursor-not-allowed dark:bg-muted/20"
                  : "border-primary bg-primary text-primary-foreground shadow-[0_4px_12px_-4px_color-mix(in_oklch,var(--color-primary)_60%,transparent)] hover:opacity-90",
              )}
            >
              <Send size={13} />
            </Button>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-muted" />

        {/* ── Row 2: Footer toolbar ── */}
        <div className="flex h-9 items-center justify-between px-3">

          {/* Left: Tools · Knowledge hub · Usage */}
          <div className="flex items-center gap-0.5">
            <FooterChip icon={Wrench} label="Tools" />
            <Sep />
            <FooterChip icon={Database} iconSize={12} label="Knowledge hub" />
            <Sep />
            {/* Usage meter */}
            <div className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground">
              <UsageDonut pct={0.65} />
              <span>65% used</span>
            </div>
          </div>

          {/* Right: Model selector */}
          <FooterChip icon={Cpu} iconSize={12} label="Claude-sonnet" />
        </div>

      </div>
    </div>
  );
}
