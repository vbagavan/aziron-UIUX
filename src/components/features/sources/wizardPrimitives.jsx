/**
 * Shared building blocks for the Add Source wizard steps.
 * Kept presentational — all state lives in the orchestrator.
 */

import { Check, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getWizardProviderLogo } from "@/lib/wizardProviderLogos";

/** Colored rounded monogram used for provider tiles (no brand logos needed). */
export function Monogram({ short, color, className }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white",
        className,
      )}
      style={{ backgroundColor: color ?? "#64748b" }}
      aria-hidden
    >
      {short}
    </span>
  );
}

/** Titled section wrapper with optional eyebrow + trailing slot. */
export function WizardSection({ title, hint, action, children, className }) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2">
          {title ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
          ) : <span />}
          {action}
        </div>
      )}
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      {children}
    </section>
  );
}

/**
 * Large selectable card — icon tile + title + description.
 * Used for the source-type chooser and any "pick one big thing" step.
 */
export function OptionCard({ icon: Icon, accent, title, description, selected, onClick, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/25"
          : "border-border bg-background hover:border-primary/40 hover:bg-muted/40",
      )}
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: accent ? `${accent}1a` : undefined, color: accent }}
        aria-hidden
      >
        {Icon ? <Icon className="size-5" strokeWidth={1.75} /> : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {badge ? <Badge variant="secondary" className="text-[10px]">{badge}</Badge> : null}
        </span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
        )}
        aria-hidden
      >
        {selected ? (
          <Check className="size-3" strokeWidth={3} />
        ) : (
          <ChevronRight className="size-3 text-muted-foreground/60" />
        )}
      </span>
    </button>
  );
}

/** Brand logo or monogram fallback for wizard provider tiles. */
export function ProviderMark({ provider, className }) {
  const logoSrc = getWizardProviderLogo(provider.id);

  if (logoSrc) {
    return (
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg bg-background p-1.5 ring-1 ring-border/60",
          className,
        )}
      >
        <img
          src={logoSrc}
          alt=""
          aria-hidden
          draggable={false}
          className="size-full object-contain"
        />
      </span>
    );
  }

  return <Monogram short={provider.short} color={provider.color} className={className} />;
}

/** Compact selectable provider tile (logo + label) for a grid. */
export function ProviderTile({ provider, selected, disabled, onClick, badge }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all",
        disabled && "cursor-not-allowed opacity-50",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/25"
          : "border-border bg-background hover:border-primary/40 hover:bg-muted/40",
      )}
    >
      <ProviderMark provider={provider} />
      <span className="min-w-0 w-full truncate text-xs font-semibold text-foreground">
        {provider.label}
      </span>
      {badge ? <Badge variant="outline" className="text-[10px]">{badge}</Badge> : null}
    </button>
  );
}

export function ProviderGrid({ children, className }) {
  return (
    <div className={cn("grid grid-cols-3 gap-2.5 sm:grid-cols-4", className)}>
      {children}
    </div>
  );
}

/** Radio-style row (single-select): filled dot + label + description. */
export function RadioRow({ label, description, selected, onClick, trailing }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:border-primary/30 hover:bg-muted/40",
      )}
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-primary" : "border-muted-foreground/40",
        )}
        aria-hidden
      >
        {selected ? <span className="size-2 rounded-full bg-primary" /> : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description ? (
          <span className="text-xs text-muted-foreground">{description}</span>
        ) : null}
      </span>
      {trailing}
    </button>
  );
}

/** Checkbox-style row (multi-select): square check + arbitrary content. */
export function CheckRow({ checked, onToggle, disabled, children, trailing, className }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors",
        disabled && "cursor-not-allowed opacity-50",
        checked
          ? "border-primary/60 bg-primary/5"
          : "border-border bg-background hover:border-primary/30 hover:bg-muted/40",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
        )}
        aria-hidden
      >
        {checked ? <Check className="size-2.5" strokeWidth={3} /> : null}
      </span>
      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
        {children}
      </span>
      {trailing}
    </button>
  );
}

/** Small labelled stat used on discovery + success screens. */
export function StatTile({ label, value, accent }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-muted/30 px-4 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className="text-lg font-semibold tabular-nums text-foreground"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
