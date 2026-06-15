import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFileThumbnail } from "@/components/features/knowledge/useFileThumbnail";

/**
 * Renders the true file preview when available (image, PDF page, video frame, EPUB cover, etc.).
 * Falls back to a minimal type placeholder only when no blob preview exists.
 */
export function HubFileThumbnail({
  hubId,
  file,
  cfg,
  className,
  imgClassName,
  placeholderClassName,
  iconSize = "size-8",
  fit: fitProp,
}) {
  const Icon = cfg.icon;
  const { thumbnail, loading, overlay, fit: detectedFit } = useFileThumbnail(hubId, file);
  const fit = fitProp ?? detectedFit;

  const imgFit =
    fit === "cover" ? "object-cover object-center" : "object-contain object-center";

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden bg-[#f8f9fb] dark:bg-muted/30",
        className,
      )}
    >
      {thumbnail ? (
        <>
          <img
            src={thumbnail}
            alt={file.name}
            className={cn(
              "h-full w-full",
              imgFit,
              fit === "contain" && !imgClassName && "p-2 sm:p-3",
              imgClassName,
            )}
            draggable={false}
            loading="lazy"
          />
          {overlay && (
            <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[9px] font-semibold tabular-nums text-white">
              {overlay}
            </span>
          )}
        </>
      ) : loading ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground/40" />
        </div>
      ) : (
        <div
          className={cn(
            "flex h-full w-full flex-col items-center justify-center gap-3 p-4",
            cfg.bg,
            placeholderClassName,
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-2xl bg-white/60 p-4 shadow-sm dark:bg-black/10",
              iconSize === "size-8" ? "size-14" : iconSize === "size-5" ? "size-10" : "size-12",
            )}
          >
            <Icon className={cn(iconSize, cfg.fg)} strokeWidth={1.35} />
          </div>
          <span className={cn("text-[10px] font-semibold uppercase tracking-widest", cfg.fg)}>
            {cfg.label}
          </span>
        </div>
      )}
    </div>
  );
}
