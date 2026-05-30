import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { CATALOG_PROVIDERS } from '@/lib/connections/constants.js'
import { getProviderLogo } from '@/lib/connections/providerLogos.js'

const SIZE_MAP = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
}

/**
 * Provider brand logo with initials fallback.
 * size: 'sm' (24px) | 'md' (32px) | 'lg' (40px)
 */
export default function ProviderAvatar({ providerId, size = 'md', className = '' }) {
  const provider = CATALOG_PROVIDERS.find(p => p.id === providerId)
  const logoSrc = getProviderLogo(providerId)
  const initials = provider?.initials ?? providerId?.slice(0, 2).toUpperCase() ?? '??'
  const color = provider?.color ?? '#6366F1'

  return (
    <Avatar
      size={SIZE_MAP[size] ?? 'default'}
      className={cn('rounded-md after:rounded-md', className)}
    >
      {logoSrc ? (
        <AvatarImage src={logoSrc} alt="" className="rounded-md object-contain p-0.5" />
      ) : null}
      <AvatarFallback
        className="rounded-md text-xs font-bold text-primary-foreground"
        style={{ backgroundColor: color }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
