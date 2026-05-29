import { AlertCircle, CheckCircle2, Link2, Loader2 } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TOOLTIPS = {
  linked: "Cloud link — click to save to your knowledge base",
  loading: "Saving to your knowledge base…",
  failed: "Save failed — click to retry",
  success: "In your knowledge base",
};

function IconWithTooltip({ tip, children, asButton, onClick, ariaLabel }) {
  if (asButton) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className="shrink-0 rounded-sm outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
              onClick={onClick}
              aria-label={ariaLabel}
            />
          }
        >
          {children}
        </TooltipTrigger>
        <TooltipContent>{tip}</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex shrink-0" aria-label={ariaLabel} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}

export function HubFileSyncIcon({ status, fileName, canActivate, onActivate }) {
  const name = fileName ?? "file";
  const tip = TOOLTIPS[status] ?? TOOLTIPS.success;

  if (status === "loading") {
    return (
      <IconWithTooltip tip={tip} ariaLabel={`Saving ${name}`}>
        <Loader2 size={16} className="animate-spin text-muted-foreground" aria-hidden />
      </IconWithTooltip>
    );
  }
  if (status === "failed") {
    if (!canActivate) {
      return (
        <IconWithTooltip tip={tip} ariaLabel={`Save failed for ${name}`}>
          <AlertCircle size={16} className="text-destructive" aria-hidden />
        </IconWithTooltip>
      );
    }
    return (
      <IconWithTooltip
        tip={tip}
        asButton
        onClick={onActivate}
        ariaLabel={`Retry saving ${name}`}
      >
        <AlertCircle size={16} className="text-destructive" aria-hidden />
      </IconWithTooltip>
    );
  }
  if (status === "linked") {
    if (!canActivate) {
      return (
        <IconWithTooltip tip={tip} ariaLabel={`${name} — cloud link`}>
          <Link2 size={16} className="text-muted-foreground" aria-hidden />
        </IconWithTooltip>
      );
    }
    return (
      <IconWithTooltip
        tip={tip}
        asButton
        onClick={onActivate}
        ariaLabel={`Save ${name} to knowledge base`}
      >
        <Link2 size={16} className="text-primary" aria-hidden />
      </IconWithTooltip>
    );
  }
  return (
    <IconWithTooltip tip={tip} ariaLabel={`${name} is in knowledge base`}>
      <CheckCircle2 size={16} className="text-success" aria-hidden />
    </IconWithTooltip>
  );
}

export function hubSyncStatusForRow(row) {
  if (row.source === "upload" || row.source === "user") return "success";
  return row.syncStatus === "stored"
    ? "success"
    : row.syncStatus === "loading"
      ? "loading"
      : row.syncStatus === "failed"
        ? "failed"
        : "linked";
}
