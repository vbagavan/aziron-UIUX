import { TrendingDown, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Token-aligned icon tiles for insurance / admin metric strips */
export const METRIC_VARIANT_STYLES = {
  primary: { icon: "text-primary", iconBg: "bg-primary/10", bar: "bg-primary" },
  success: { icon: "text-success", iconBg: "bg-success/10", bar: "bg-success" },
  warning: { icon: "text-warning", iconBg: "bg-warning/10", bar: "bg-warning" },
  destructive: { icon: "text-destructive", iconBg: "bg-destructive/10", bar: "bg-destructive" },
  info: { icon: "text-info", iconBg: "bg-info/10", bar: "bg-info" },
  muted: { icon: "text-muted-foreground", iconBg: "bg-muted", bar: "bg-muted-foreground" },
};

/**
 * KPI / stat tile — shadcn Card + type-metric-value.
 * Supports Usage/Tenant row layout and Insurance interactive variants.
 */
export function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "var(--primary)",
  variant,
  trend,
  onClick,
  active,
  alertLevel,
  className,
  flat = false,
  trailing,
  iconSize = 18,
  valueClassName,
}) {
  const isZero = value === 0 || value === "0";
  const interactive = Boolean(onClick);
  const variantStyles = variant ? METRIC_VARIANT_STYLES[variant] ?? METRIC_VARIANT_STYLES.primary : null;

  const alertDotColor =
    alertLevel === "danger" ? "var(--destructive)" : alertLevel === "warning" ? "var(--warning)" : null;

  const borderCls =
    alertLevel === "danger" && !isZero
      ? "border-destructive/30"
      : alertLevel === "warning" && !isZero
        ? "border-warning-ring"
        : undefined;

  const bgCls =
    alertLevel === "danger" && !isZero
      ? "bg-muted"
      : alertLevel === "warning" && !isZero
        ? "bg-warning/10"
        : undefined;

  const content = (
    <>
      {alertDotColor && !isZero && (
        <span
          className="absolute top-2.5 right-2.5 size-1.5 rounded-full animate-pulse"
          style={{ background: alertDotColor }}
          aria-hidden
        />
      )}
      {variantStyles ? (
        <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5", variantStyles.iconBg)}>
          <Icon size={iconSize - 1} className={variantStyles.icon} />
        </div>
      ) : (
        <div
          className="size-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}18` }}
        >
          <Icon size={iconSize} style={{ color }} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground leading-none mb-1.5">{label}</p>
        <p
          className={cn(
            "type-metric-value leading-none",
            isZero && alertLevel ? "text-muted-foreground" : "",
            valueClassName,
          )}
        >
          {value}
        </p>
        {sub && <p className="type-caption mt-1">{sub}</p>}
      </div>
      {trend != null && (
        <div
          className={cn(
            "flex items-center gap-0.5 text-xs font-semibold mt-1 shrink-0",
            trend >= 0 ? "text-success" : "text-destructive",
          )}
        >
          {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(trend)}%
        </div>
      )}
      {trailing}
      {variantStyles?.bar && (
        <div className={cn("absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl opacity-20", variantStyles.bar)} />
      )}
    </>
  );

  return (
    <Card
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        "relative flex items-center gap-3 p-4 flex-1 min-w-0 transition-all",
        flat ? "shadow-none" : "shadow-sm",
        interactive && "cursor-pointer hover:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        interactive && !flat && "hover:shadow-elevation-sm active:scale-[0.99]",
        active && "ring-2 ring-ring border-primary/30 bg-primary/5",
        borderCls,
        bgCls,
        className,
      )}
    >
      {content}
    </Card>
  );
}
