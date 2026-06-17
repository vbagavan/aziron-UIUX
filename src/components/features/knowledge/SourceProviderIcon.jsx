import { Cloud, Database, HardDrive, Zap } from "lucide-react";
import { getCloudProviderLogoSrc } from "@/lib/cloudFileOrigin";
import { getDbProviderLogo, getDbProviderMeta } from "@/lib/dbProviderLogos";
import { resolveSourceCategory, resolveSourceKind } from "@/lib/sourceCategories";
import { cn } from "@/lib/utils";

function resolveProviderId(record) {
  return record?.provider ?? record?.cloudProvider ?? record?.dbProvider ?? record?.apiProvider;
}

function ProviderLogoImage({ src, label, className }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

function ProviderLogoFallback({ label, color, className }) {
  const initials = label?.slice(0, 2) ?? "??";

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm text-[9px] font-bold text-white",
        className,
      )}
      style={{ backgroundColor: color ?? "#6366f1" }}
    >
      {initials}
    </span>
  );
}

function CategoryFallbackIcon({ record, className }) {
  const category = resolveSourceCategory(record);
  if (category === "dbs") return <Database data-icon="inline-start" aria-hidden className={className} />;
  if (category === "apis") return <Zap data-icon="inline-start" aria-hidden className={className} />;
  const kind = resolveSourceKind(record);
  if (kind === "cloud-storage" || record?.source === "cloud") {
    return <Cloud data-icon="inline-start" aria-hidden className={className} />;
  }
  return <HardDrive data-icon="inline-start" aria-hidden className={className} />;
}

/**
 * Category-aware provider mark — brand logo when available, lucide fallback otherwise.
 */
export function SourceProviderIcon({ record, className, size = "sm" }) {
  const category = resolveSourceCategory(record);
  const providerId = resolveProviderId(record);
  const sizeClass = size === "xs" ? "size-3" : size === "md" ? "size-4" : "size-3.5";

  if (category === "dbs" && providerId) {
    const logoSrc = getDbProviderLogo(providerId);
    if (logoSrc) {
      return <ProviderLogoImage src={logoSrc} label={providerId} className={cn(sizeClass, className)} />;
    }
    const meta = getDbProviderMeta(providerId);
    return (
      <ProviderLogoFallback
        label={meta?.short ?? meta?.label ?? providerId}
        color={meta?.color}
        className={cn(sizeClass, className)}
      />
    );
  }

  if (category === "files" && (record?.source === "cloud" || providerId)) {
    const logoSrc = getCloudProviderLogoSrc(providerId);
    if (logoSrc) {
      return <ProviderLogoImage src={logoSrc} label={providerId} className={cn(sizeClass, className)} />;
    }
  }

  return <CategoryFallbackIcon record={record} className={cn(sizeClass, className)} />;
}
