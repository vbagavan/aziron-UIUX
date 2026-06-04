import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatUploadBytes,
  fileNameToTypeIcon,
} from "@/components/features/knowledge/hubUploadProgress";

export function HubSourceUploadRow({ upload, onCancel }) {
  const isError = upload.status === "error";

  return (
    <li>
      <div className="rounded-lg px-2 py-2">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 text-base leading-none" aria-hidden>
            {fileNameToTypeIcon(upload.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground" title={upload.name}>
              {upload.name}
            </p>
            <div className="mt-2 flex flex-col gap-1">
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, upload.progress ?? 0))}%` }}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(upload.progress ?? 0)}
                  aria-label={`Uploading ${upload.name}`}
                />
              </div>
              <p className="text-[10px] tabular-nums text-muted-foreground">
                {isError
                  ? "Upload failed. Try again."
                  : `${formatUploadBytes(upload.loaded)} of ${formatUploadBytes(upload.total)}`}
              </p>
            </div>
          </div>
          {onCancel && upload.status === "uploading" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="shrink-0 text-primary"
              aria-label={`Cancel upload of ${upload.name}`}
              onClick={() => onCancel(upload.id)}
            >
              <X data-icon="inline-start" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function HubUploadProgressSummary({ uploads }) {
  const active = (uploads ?? []).filter((u) => u.status === "uploading");
  if (active.length === 0) return null;

  const totalBytes = active.reduce((sum, u) => sum + (u.total ?? 0), 0);
  const loadedBytes = active.reduce((sum, u) => sum + (u.loaded ?? 0), 0);
  const overallPct = totalBytes > 0 ? Math.round((loadedBytes / totalBytes) * 100) : 0;

  return (
    <div className="mb-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Progress</p>
        <span className="text-[10px] tabular-nums text-muted-foreground">{overallPct}%</span>
      </div>
      <p className="mt-1 text-[10px] tabular-nums text-muted-foreground">
        {formatUploadBytes(loadedBytes)} of {formatUploadBytes(totalBytes)}
      </p>
    </div>
  );
}
