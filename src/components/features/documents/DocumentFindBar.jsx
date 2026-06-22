import { useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function DocumentFindBar({
  value,
  onChange,
  hitCount = 0,
  activeHitIndex = -1,
  onPrev,
  onNext,
  onClose,
  className,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const countLabel =
    value.trim()
      ? hitCount > 0
        ? `${activeHitIndex + 1}/${hitCount}`
        : "0/0"
      : "";

  return (
    <div
      className={cn(
        "absolute right-3.5 top-2 z-30 flex items-center gap-1.5 rounded-lg border border-border bg-popover px-2 py-1 shadow-lg",
        className,
      )}
      role="search"
      aria-label="Find in document"
    >
      <Search className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) onPrev?.();
            else onNext?.();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            onClose?.();
          }
        }}
        placeholder="Find in document…"
        aria-label="Find in document"
        className="h-7 w-[180px] border-0 bg-transparent px-1 text-[13px] shadow-none focus-visible:ring-0"
      />
      <span className="min-w-[44px] text-center text-xs tabular-nums text-muted-foreground">
        {countLabel}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onPrev}
        disabled={hitCount === 0}
        title="Previous match"
        aria-label="Previous match"
      >
        <ChevronUp className="size-3.5" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onNext}
        disabled={hitCount === 0}
        title="Next match"
        aria-label="Next match"
      >
        <ChevronDown className="size-3.5" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onClose}
        title="Close find"
        aria-label="Close find"
      >
        <X className="size-3.5" aria-hidden />
      </Button>
    </div>
  );
}
