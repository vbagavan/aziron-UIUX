import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LINE_SPACING_OPTIONS,
  THEME_OPTIONS,
  WIDTH_OPTIONS,
} from "@/components/features/documents/readingSettings";

function SectionLabel({ children }) {
  return (
    <h6 className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
      {children}
    </h6>
  );
}

function SegmentedControl({ options, value, onChange, getValue, className }) {
  return (
    <div
      className={cn(
        "inline-flex gap-0.5 rounded-lg bg-muted p-0.5",
        className,
      )}
    >
      {options.map((option) => {
        const optionValue = getValue(option);
        const active = optionValue === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(optionValue)}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs transition-colors",
              active
                ? "bg-background font-semibold text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function DocumentReadingSettingsPopover({
  fontSize,
  lineHeight,
  width,
  theme,
  onFontSizeChange,
  onLineHeightChange,
  onWidthChange,
  onThemeChange,
  className,
}) {
  return (
    <div
      className={cn(
        "w-[268px] rounded-xl border border-border bg-popover p-3.5 shadow-lg",
        className,
      )}
      role="dialog"
      aria-label="Reading settings"
    >
      <SectionLabel>Font size</SectionLabel>
      <div className="mb-3.5 flex items-center gap-2">
        <span className="text-[13px] text-foreground">Text</span>
        <div className="ml-auto inline-flex items-center overflow-hidden rounded-lg border border-input">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-[30px] rounded-none"
            onClick={() => onFontSizeChange(fontSize - 1)}
            aria-label="Decrease font size"
          >
            <Minus className="size-3.5" aria-hidden />
          </Button>
          <span className="min-w-[34px] border-x border-input text-center text-xs tabular-nums leading-[30px] text-foreground">
            {fontSize}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-[30px] rounded-none"
            onClick={() => onFontSizeChange(fontSize + 1)}
            aria-label="Increase font size"
          >
            <Plus className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>

      <SectionLabel>Line spacing</SectionLabel>
      <div className="mb-3.5 flex items-center">
        <SegmentedControl
          className="ml-auto"
          options={LINE_SPACING_OPTIONS}
          value={lineHeight}
          getValue={(o) => o.value}
          onChange={onLineHeightChange}
        />
      </div>

      <SectionLabel>Width</SectionLabel>
      <div className="mb-3.5 flex items-center">
        <SegmentedControl
          className="ml-auto"
          options={WIDTH_OPTIONS}
          value={width}
          getValue={(o) => o.value}
          onChange={onWidthChange}
        />
      </div>

      <SectionLabel>Theme</SectionLabel>
      <div className="flex items-center gap-3">
        {THEME_OPTIONS.map((option) => {
          const active = theme === option.id;
          return (
            <button
              key={option.id}
              type="button"
              title={option.label}
              aria-label={option.label}
              aria-pressed={active}
              onClick={() => onThemeChange(option.id)}
              className={cn(
                "size-7 rounded-full border-2 transition-shadow",
                active
                  ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.25)]"
                  : "border-border hover:border-muted-foreground/40",
              )}
              style={{ backgroundColor: option.swatch }}
            />
          );
        })}
      </div>
    </div>
  );
}
