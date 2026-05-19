import { Info, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ConfigSectionCard({ title, description, fields, onFieldChange, onTestConfiguration }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.4)] dark:border-border dark:bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:text-muted-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onTestConfiguration}>
          <PlayCircle size={14} />
          Test configuration
        </Button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground dark:text-foreground">
              {field.label}
              <span className="group relative inline-flex">
                <Info size={14} className="text-muted-foreground" />
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden w-56 -translate-x-1/2 rounded-xl bg-foreground px-3 py-2 text-xs leading-5 text-background shadow-xl group-hover:block">
                  {field.tooltip}
                </span>
              </span>
            </span>
            <Input value={field.value} onChange={(e) => onFieldChange(field.key, e.target.value)} className="h-10" />
          </label>
        ))}
      </div>
    </div>
  );
}
