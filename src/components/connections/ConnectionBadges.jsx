import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { STATUS_CONFIG, TYPE_CONFIG } from '@/lib/connections/constants.js'

const STATUS_BADGE_CLASS = {
  active: 'border-success/30 bg-success/10 text-success',
  expiring: 'border-warning/35 bg-warning/10 text-warning',
  expired: 'border-destructive/30 bg-destructive/10 text-destructive',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  pending: 'border-border bg-muted/50 text-muted-foreground',
}

const TYPE_BADGE_CLASS = {
  oauth: 'border-primary/30 bg-primary/10 text-primary',
  api_key: 'border-warning/35 bg-warning/10 text-warning',
  mcp_server: 'border-secondary bg-secondary/50 text-secondary-foreground',
  custom: 'border-border bg-muted/50 text-muted-foreground',
}

export function ConnectionStatusBadge({ status, className, size = 'sm' }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-semibold',
        size === 'sm' ? 'text-[10px]' : 'text-xs',
        STATUS_BADGE_CLASS[status] ?? STATUS_BADGE_CLASS.pending,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', cfg.dot)} aria-hidden />
      {cfg.label}
    </Badge>
  )
}

export function ConnectionTypeBadge({ type, className, size = 'sm' }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.custom
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold',
        size === 'sm' ? 'text-[10px]' : 'text-xs',
        TYPE_BADGE_CLASS[type] ?? TYPE_BADGE_CLASS.custom,
        className,
      )}
    >
      {cfg.label}
    </Badge>
  )
}
