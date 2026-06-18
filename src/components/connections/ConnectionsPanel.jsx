import { useMemo, useState } from 'react'
import { Plus, Search, Filter, MoreHorizontal, RefreshCw, Pencil, LogIn, Trash2, Loader2, Plug, ArrowUpDown } from 'lucide-react'
import { useConnectionsStore } from '@/lib/connections/store.js'
import { CATALOG_PROVIDERS, STATUS_CONFIG, CONN_TYPE_TABS } from '@/lib/connections/constants.js'
import { ConnectionStatusBadge, ConnectionTypeBadge } from './ConnectionBadges.jsx'
import ProviderAvatar from './ProviderAvatar.jsx'
import ConnectionWizard from './ConnectionWizard.jsx'
import ConnectionDetail from './ConnectionDetail.jsx'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KNOWLEDGE_TERMS } from '@/lib/knowledgeTerminology'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = ['all', 'active', 'expiring', 'expired', 'error', 'pending']

function connectionRowLabel(conn) {
  const provider = CATALOG_PROVIDERS.find(p => p.id === conn.providerId)
  return `${conn.name}, ${provider?.name ?? conn.providerId}, ${conn.status}`
}

function sortConnections(list, sortDir) {
  return [...list].sort((a, b) => {
    const cmp = String(b.addedAt).localeCompare(String(a.addedAt))
    return sortDir === 'asc' ? -cmp : cmp
  })
}

function ConnectionRowActions({ conn }) {
  const { testConnection, deleteConnection, openDetail } = useConnectionsStore()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon-sm" aria-label={`Actions for ${conn.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => openDetail(conn.id)}>
            <Pencil data-icon="inline-start" />
            View details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => testConnection(conn.id)}>
            <RefreshCw data-icon="inline-start" />
            Test
          </DropdownMenuItem>
          {conn.type === 'oauth' && (
            <DropdownMenuItem onClick={() => openDetail(conn.id, 'permissions')}>
              <LogIn data-icon="inline-start" />
              Update credentials
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" onClick={() => deleteConnection(conn.id)}>
            <Trash2 data-icon="inline-start" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ConnectionRow({ conn }) {
  const { openDetail } = useConnectionsStore()
  const provider = CATALOG_PROVIDERS.find(p => p.id === conn.providerId)
  const isLoading = conn.status === 'pending'

  return (
    <TableRow
      className="cursor-pointer"
      onClick={() => openDetail(conn.id)}
      tabIndex={0}
      aria-label={connectionRowLabel(conn)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openDetail(conn.id)
        }
      }}
    >
      <TableCell className="min-w-[10rem]">
        <div className="flex items-center gap-2.5">
          <ProviderAvatar providerId={conn.providerId} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">{provider?.name ?? conn.providerId}</p>
            <p className="type-caption capitalize">{provider?.category}</p>
          </div>
        </div>
      </TableCell>

      <TableCell className="min-w-[8rem]">
        <p className="truncate text-xs font-medium text-foreground">{conn.name}</p>
        {conn.isPrivate && (
          <p className="type-caption mt-0.5">Private</p>
        )}
      </TableCell>

      <TableCell className="whitespace-nowrap">
        <ConnectionTypeBadge type={conn.type} />
      </TableCell>

      <TableCell className="whitespace-nowrap">
        <p className="text-xs tabular-nums text-muted-foreground">{conn.addedAt}</p>
      </TableCell>

      <TableCell className="whitespace-nowrap">
        {isLoading ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground [&_svg]:size-3.5" role="status" aria-live="polite">
            <Loader2 className="animate-spin" />
            Testing…
          </span>
        ) : (
          <ConnectionStatusBadge status={conn.status} />
        )}
      </TableCell>

      <TableCell className="w-12" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-end">
          <ConnectionRowActions conn={conn} />
        </div>
      </TableCell>
    </TableRow>
  )
}

function ConnectionMobileCard({ conn }) {
  const { openDetail } = useConnectionsStore()
  const provider = CATALOG_PROVIDERS.find(p => p.id === conn.providerId)
  const isLoading = conn.status === 'pending'

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={connectionRowLabel(conn)}
      className="flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
      onClick={() => openDetail(conn.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openDetail(conn.id)
        }
      }}
    >
      <div className="flex items-start gap-3">
        <ProviderAvatar providerId={conn.providerId} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{conn.name}</p>
          <p className="truncate text-xs text-muted-foreground">{provider?.name ?? conn.providerId}</p>
          {conn.isPrivate && (
            <p className="type-caption mt-0.5">Private</p>
          )}
        </div>
        <div onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
          <ConnectionRowActions conn={conn} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ConnectionTypeBadge type={conn.type} />
        {isLoading ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground [&_svg]:size-3.5" role="status" aria-live="polite">
            <Loader2 className="animate-spin" />
            Testing…
          </span>
        ) : (
          <ConnectionStatusBadge status={conn.status} />
        )}
      </div>

      <p className="type-caption tabular-nums">Added {conn.addedAt}</p>
    </div>
  )
}

function MobileSkeletonCards() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-xl border border-border p-4">
          <div className="flex gap-3">
            <Skeleton className="size-8 rounded-md" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  )
}

function ConnectionsEmptyState({ hasFilters, onAdd, onClear, mobile = false }) {
  const content = hasFilters ? (
    <Empty className="border-none py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Filter />
        </EmptyMedia>
        <EmptyTitle>No connectors match</EmptyTitle>
        <EmptyDescription>
          Try clearing the type tab, status filter, or search. Filters combine — all must match.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="link" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      </EmptyContent>
    </Empty>
  ) : (
    <Empty className="border-none py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Plug />
        </EmptyMedia>
        <EmptyTitle>No connectors yet</EmptyTitle>
        <EmptyDescription>
          {KNOWLEDGE_TERMS.connectorsEmptyDescription}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onAdd}>
          <Plus data-icon="inline-start" />
          Add your first connector
        </Button>
      </EmptyContent>
    </Empty>
  )

  if (mobile) return content

  return (
    <TableRow>
      <TableCell colSpan={6} className="h-56">
        {content}
      </TableCell>
    </TableRow>
  )
}

function TableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          {[52, 48, 28, 28, 28, 16].map((w, j) => (
            <TableCell key={j}>
              <Skeleton className="h-3 rounded-full" style={{ width: `${w * 2}px` }} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function StatusFilterSelect({ value, onChange, className }) {
  const active = value !== 'all'
  const label = value === 'all' ? 'Status' : (STATUS_CONFIG[value]?.label ?? value)

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        size="sm"
        className={cn(
          'w-full min-w-[7.5rem] sm:w-[7.5rem] [&_svg:not([class*="size-"])]:size-3.5',
          active && 'border-primary bg-accent text-accent-foreground',
          className,
        )}
      >
        <span className="flex items-center gap-1.5 truncate text-sm">
          <Filter />
          {label}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {STATUS_OPTIONS.map(s => (
            <SelectItem key={s} value={s}>
              {s === 'all' ? 'All statuses' : (STATUS_CONFIG[s]?.label ?? s)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default function ConnectionsPanel() {
  const {
    search, setSearch, statusFilter, setStatusFilter,
    typeTab, setTypeTab, openWizard, getFiltered,
    connections, loading,
  } = useConnectionsStore()

  const [sortDir, setSortDir] = useState('desc')
  const baseFiltered = getFiltered()
  const filtered = useMemo(
    () => sortConnections(baseFiltered, sortDir),
    [baseFiltered, sortDir],
  )
  const hasFilters = !!search || statusFilter !== 'all' || typeTab !== 'all'

  const typeCounts = CONN_TYPE_TABS.reduce((acc, t) => {
    acc[t.key] = t.key === 'all'
      ? connections.length
      : connections.filter(c => c.type === t.key).length
    return acc
  }, {})

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    setTypeTab('all')
  }

  const activeCount = connections.filter(c => c.status === 'active').length

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-medium leading-7 text-foreground">Connectors</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {connections.length > 0
              ? `${connections.length} connector${connections.length !== 1 ? 's' : ''} · ${activeCount} active`
              : 'Connect to external services and APIs'}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {KNOWLEDGE_TERMS.connectorsRegistryHint}
          </p>
        </div>
        <Button onClick={openWizard} className="w-full shrink-0 sm:w-auto">
          <Plus data-icon="inline-start" />
          New connector
        </Button>
      </div>

      <p className="text-center text-[11px] text-muted-foreground sm:text-left">
        {KNOWLEDGE_TERMS.connectorsDemoHint}
      </p>

      <Tabs value={typeTab} onValueChange={setTypeTab}>
        <div className="-mx-1 overflow-x-auto px-1 pb-px">
          <TabsList className="inline-flex h-auto w-max min-w-full justify-start rounded-none border-b bg-transparent p-0 sm:min-w-0 sm:w-full">
            {CONN_TYPE_TABS.map(({ key, label }) => {
              const count = typeCounts[key] ?? 0
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="shrink-0 rounded-none border-b-2 border-transparent px-3 py-2.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  {label}
                  {count > 0 && (
                    <Badge variant={typeTab === key ? 'default' : 'secondary'} className="ml-1.5 h-[18px] min-w-[18px] px-1 text-xs">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>
      </Tabs>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <InputGroup className="w-full sm:max-w-[320px] sm:min-w-[200px] sm:flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search connectors…"
            aria-label="Search connectors"
          />
        </InputGroup>

        <div className="flex items-center gap-2">
          <StatusFilterSelect value={statusFilter} onChange={setStatusFilter} className="flex-1 sm:flex-none" />
          {hasFilters && (
            <Button variant="link" size="sm" onClick={clearFilters} className="shrink-0 text-muted-foreground">
              Clear
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground sm:ml-auto">
          {filtered.length !== connections.length && `${filtered.length} of `}
          {connections.length} connector{connections.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Mobile card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading ? (
          <MobileSkeletonCards />
        ) : filtered.length === 0 ? (
          <ConnectionsEmptyState hasFilters={hasFilters} onAdd={openWizard} onClear={clearFilters} mobile />
        ) : (
          filtered.map(conn => <ConnectionMobileCard key={conn.id} conn={conn} />)
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden rounded-xl border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              {[
                { key: 'provider', label: 'Provider' },
                { key: 'name', label: 'Connection Name' },
                { key: 'type', label: 'Type' },
                { key: 'added', label: 'Added', sortable: true },
                { key: 'status', label: 'Status' },
                { key: 'actions', label: '' },
              ].map(({ key, label, sortable }) => (
                <TableHead key={key} className="type-section-eyebrow">
                  {sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() => setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))}
                      aria-label={`Sort by date ${sortDir === 'desc' ? 'ascending' : 'descending'}`}
                    >
                      {label}
                      <ArrowUpDown className="size-3" aria-hidden />
                    </button>
                  ) : (
                    label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeletonRows />
            ) : filtered.length === 0 ? (
              <ConnectionsEmptyState hasFilters={hasFilters} onAdd={openWizard} onClear={clearFilters} />
            ) : (
              filtered.map(conn => <ConnectionRow key={conn.id} conn={conn} />)
            )}
          </TableBody>
        </Table>
      </div>

      <ConnectionWizard />
      <ConnectionDetail />
    </div>
  )
}
