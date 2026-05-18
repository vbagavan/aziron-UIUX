/**
 * Shared design-token helpers for Tailwind/shadcn semantic colors.
 * Use CSS variables where inline styles or canvas/SVG require raw color values.
 */

export const CHART = {
  grid: "var(--border)",
  tick: "var(--muted-foreground)",
  primary: "var(--primary)",
  primaryMuted: "var(--chart-chart-2)",
  chart3: "var(--chart-chart-3)",
  chart4: "var(--chart-chart-4)",
  chart5: "var(--chart-chart-5)",
  success: "var(--success)",
  destructive: "var(--destructive)",
  warning: "var(--warning)",
  muted: "var(--muted-foreground)",
  border: "var(--border)",
  card: "var(--card)",
  foreground: "var(--foreground)",
};

export const METRIC_VARIANT = {
  primary:     { icon: "text-primary",     iconBg: "bg-primary/10",     bar: "bg-primary" },
  success:     { icon: "text-success",     iconBg: "bg-success/10",     bar: "bg-success" },
  warning:     { icon: "text-warning",     iconBg: "bg-warning/10",     bar: "bg-warning" },
  destructive: { icon: "text-destructive", iconBg: "bg-destructive/10", bar: "bg-destructive" },
  info:        { icon: "text-info",        iconBg: "bg-info/10",        bar: "bg-info" },
  muted:       { icon: "text-muted-foreground", iconBg: "bg-muted", bar: "bg-muted-foreground" },
};

/** Role badges (Sidebar, rbac SCOPE_COLORS) */
export const ROLE_BADGE = {
  superadmin:  { pill: "bg-primary/10 text-primary border border-primary/20", dot: "bg-primary" },
  tenantadmin: { pill: "bg-info/10 text-info border border-info-ring", dot: "bg-info" },
  tenantuser:  { pill: "bg-muted text-muted-foreground border border-border", dot: "bg-muted-foreground" },
};

export const SCOPE_COLORS = {
  violet: ROLE_BADGE.superadmin,
  blue:   ROLE_BADGE.tenantadmin,
  slate:  ROLE_BADGE.tenantuser,
};

/** Notification severity stripes */
export const NOTIFICATION_SEVERITY = {
  critical: { bar: "bg-destructive", dot: "bg-destructive", label: "text-destructive" },
  warning:  { bar: "bg-warning", dot: "bg-warning", label: "text-warning" },
  success:  { bar: "bg-success", dot: "bg-success", label: "text-success" },
  approval: { bar: "bg-primary", dot: "bg-primary", label: "text-primary" },
};

/** Notification action button classes */
export const NOTIFICATION_ACTIONS = {
  Approve: "bg-success text-primary-foreground hover:bg-success/90",
  Reject:  "border border-destructive text-destructive bg-card hover:bg-destructive/10",
  Review:  "border border-primary text-primary bg-card hover:bg-primary/10",
};

/** Avatar fills for notification mock data (inline style fallback) */
export const NOTIFICATION_AVATAR = {
  muted:    "var(--muted-foreground)",
  destructive: "var(--destructive)",
  primary:  "var(--primary)",
  success:  "var(--success)",
  warning:  "var(--warning)",
  accent:   "var(--chart-chart-4)",
};

/** Flow builder node icon colors (SVG/canvas) */
export const FLOW_ICON_COLOR = {
  Bot: "var(--chart-chart-4)",
  Webhook: "var(--chart-chart-3)",
  Zap: "var(--warning)",
  Globe: "var(--primary)",
  Database: "var(--info)",
  Mail: "var(--info)",
  FileText: "var(--warning)",
  GitBranch: "var(--info)",
  GitMerge: "var(--info)",
  Terminal: "var(--warning)",
  Cpu: "var(--warning)",
  Filter: "var(--success)",
  Code2: "var(--success)",
  Network: "var(--chart-chart-4)",
  Braces: "var(--success)",
  Bell: "var(--destructive)",
  UserCheck: "var(--warning)",
  Shield: "var(--info)",
  Wrench: "var(--muted-foreground)",
  Brain: "var(--chart-chart-4)",
  MessageCircle: "var(--success)",
  Upload: "var(--destructive)",
  HardDrive: "var(--warning)",
  Building2: "var(--primary)",
};

export const FLOW_STATUS = {
  success: { color: "var(--success)", bg: "var(--success)", ring: "var(--success-ring)" },
  error:   { color: "var(--destructive)", bg: "var(--destructive)", ring: "var(--destructive)" },
  pending: { color: "var(--muted-foreground)", bg: "var(--muted)", ring: "var(--border)" },
  running: { color: "var(--primary)", bg: "var(--primary)", ring: "var(--chart-chart-2)" },
};
