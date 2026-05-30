import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { STATUS_CONFIG, TYPE_CONFIG } from '@/lib/connections/constants.js'

export function ConnectionStatusBadge({ status, className, size = 'sm' }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <Badge
      className={cn(
        'gap-1 border font-semibold',
        size === 'sm' ? 'text-xs' : 'text-sm',
        cfg.bg,
        cfg.text,
        cfg.border,
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
      className={cn(
        'border font-semibold',
        size === 'sm' ? 'text-xs' : 'text-sm',
        cfg.bg,
        cfg.text,
        cfg.border,
        className,
      )}
    >
      {cfg.label}
    </Badge>
  )
}
