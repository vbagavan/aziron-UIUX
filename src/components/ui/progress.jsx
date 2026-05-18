import { cn } from "@/lib/utils";

function Progress({ className, value = 0, max = 100, ...props }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-success transition-all duration-700 motion-reduce:transition-none"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export { Progress };
