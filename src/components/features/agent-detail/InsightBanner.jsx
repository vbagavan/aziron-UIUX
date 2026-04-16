import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

const BANNER_STYLES = {
  healthy: {
    wrap: "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534] dark:border-[#14532d] dark:bg-[#052e16] dark:text-[#bbf7d0]",
    icon: CheckCircle2,
  },
  warning: {
    wrap: "border-[#fde68a] bg-[#fffbeb] text-[#a16207] dark:border-[#854d0e] dark:bg-[#422006] dark:text-[#fde68a]",
    icon: AlertTriangle,
  },
  critical: {
    wrap: "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c] dark:border-[#7f1d1d] dark:bg-[#450a0a] dark:text-[#fecaca]",
    icon: AlertTriangle,
  },
};

export default function InsightBanner({ insight }) {
  const style = BANNER_STYLES[insight.state] || BANNER_STYLES.healthy;
  const Icon = style.icon;

  return (
    <div className={`rounded-2xl border px-4 py-4 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.35)] ${style.wrap}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-white/70 p-2 dark:bg-white/10">
            <Icon size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] opacity-70">System Insight</p>
            <h2 className="mt-1 text-lg font-semibold">{insight.title}</h2>
            <p className="mt-1 text-sm leading-6 opacity-90">{insight.message}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium dark:bg-white/10">
          <TrendingUp size={14} />
          {insight.meta}
        </div>
      </div>
    </div>
  );
}
