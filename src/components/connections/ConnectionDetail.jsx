import { useState } from 'react'
import { motion } from 'motion/react'
import {
  CheckCircle2, XCircle, ArrowRight, Activity, BarChart3, Shield, Share2,
  ScrollText, Workflow, RefreshCw, Trash2, AlertTriangle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import ProviderAvatar from './ProviderAvatar.jsx'
import { ConnectionStatusBadge, ConnectionTypeBadge } from './ConnectionBadges.jsx'
import { useConnectionsStore } from '@/lib/connections/store.js'
import { CATALOG_PROVIDERS } from '@/lib/connections/constants.js'
import { cn } from '@/lib/utils'

function Sparkbar({ values = [], className = '' }) {
  if (!values.length) return null
  const max = Math.max(...values, 1)
  return (
    <div className={`flex h-10 items-end gap-0.5 ${className}`}>
      {values.map((v, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.05, duration: 0.3, ease: 'easeOut' }}
          style={{ originY: '100%', height: `${Math.max(4, (v / max) * 100)}%` }}
          className={`flex-1 rounded-sm ${i === values.length - 1 ? 'bg-primary' : 'bg-primary/30'}`}
        />
      ))}
    </div>
  )
}

function HealthChecks({ checks = [] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {checks.map((check, i) => (
        <div key={i} className="flex items-start gap-2.5 [&_svg]:size-3.5 [&_svg]:shrink-0">
          {check.ok ? (
            <CheckCircle2 className="mt-0.5 text-success" />
          ) : (
            <XCircle className="mt-0.5 text-destructive" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">{check.check}</p>
            {check.detail && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">{check.detail}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function MetricCard({ label, value, sub, className }) {
  return (
    <Card className={cn('border-border/40 bg-muted/40 py-0 shadow-none', className)}>
      <CardContent className="flex flex-col gap-0.5 p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold tabular-nums text-foreground ${className ?? ''}`}>{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function OverviewTab({ conn }) {
  const totalWeek = conn.callsWeek?.reduce((a, b) => a + b, 0) ?? 0
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Health checks</h3>
          <ConnectionStatusBadge status={conn.status} size="default" />
        </div>
        <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
          <HealthChecks checks={conn.health} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <MetricCard label="Today" value={conn.callsToday.toLocaleString()} sub="API calls" />
        <MetricCard label="This week" value={totalWeek.toLocaleString()} sub="API calls" />
        <MetricCard label="Last used" value={conn.lastUsed} sub="relative" />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">7-day call volume</h3>
        <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
          <Sparkbar values={conn.callsWeek} />
          <div className="mt-1.5 flex justify-between">
            {days.map((d, i) => (
              <span key={i} className="flex-1 text-center text-[9px] text-muted-foreground">{d}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Details</h3>
        {[
          { label: 'Added', value: conn.addedAt },
          { label: 'Added by', value: conn.addedBy },
          { label: 'Scope', value: conn.scope ?? '—' },
          { label: 'Visibility', value: conn.isPrivate ? 'Private' : 'Workspace' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between border-b border-border/30 py-1.5 last:border-0">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-xs font-medium capitalize text-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function UsedInFlowsTab({ conn }) {
  if (!conn.usedIn?.length) {
    return (
      <Empty className="border-none py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Workflow />
          </EmptyMedia>
          <EmptyTitle>Not used yet</EmptyTitle>
          <EmptyDescription>
            This connection isn&apos;t referenced in any flows or agents.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="mb-1 text-xs text-muted-foreground">
        Used in {conn.usedIn.length} flow{conn.usedIn.length !== 1 ? 's' : ''} / agent{conn.usedIn.length !== 1 ? 's' : ''}
      </p>
      {conn.usedIn.map(name => (
        <Button
          key={name}
          variant="outline"
          className="h-auto w-full justify-start gap-3 p-3"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 [&_svg]:size-3.5">
            <Workflow className="text-primary" />
          </span>
          <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">{name}</span>
          <ArrowRight className="shrink-0 text-muted-foreground" />
        </Button>
      ))}
    </div>
  )
}

function UsageStatsTab({ conn }) {
  const totalWeek = conn.callsWeek?.reduce((a, b) => a + b, 0) ?? 0
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2">
        <MetricCard label="Calls today" value={conn.callsToday.toLocaleString()} />
        <MetricCard label="Calls / week" value={totalWeek.toLocaleString()} />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Daily breakdown</h3>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
          const val = conn.callsWeek?.[i] ?? 0
          const max = Math.max(...(conn.callsWeek ?? [1]))
          const pct = max ? (val / max) * 100 : 0
          return (
            <div key={day} className="flex items-center gap-2">
              <span className="w-7 text-[10px] text-muted-foreground">{day}</span>
              <div className="h-1.5 flex-1 rounded-full bg-muted/60">
                <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-10 text-right text-[11px] tabular-nums text-muted-foreground">{val.toLocaleString()}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PermissionsTab({ conn }) {
  const provider = CATALOG_PROVIDERS.find(p => p.id === conn.providerId)
  const scopes = provider?.scopes ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Granted scopes</h3>
        {scopes.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No scope information available</p>
        )}
        {scopes.map(scope => (
          <div key={scope} className="flex items-center gap-2.5 border-b border-border/30 py-1.5 last:border-0 [&_svg]:size-3.5 [&_svg]:shrink-0">
            <Shield className="text-primary" />
            <span className="min-w-0 break-all font-mono text-xs text-foreground">{scope}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">granted</span>
          </div>
        ))}
        {conn.type === 'api_key' && (
          <div className="flex items-center gap-2.5 py-1.5 [&_svg]:size-3.5 [&_svg]:shrink-0">
            <Shield className="text-primary" />
            <span className="text-xs text-foreground">API key authentication</span>
            <span className="ml-auto text-[10px] text-muted-foreground">full access</span>
          </div>
        )}
      </div>

      <Alert>
        <AlertTriangle />
        <AlertTitle>Permission scope: {conn.scope ?? 'full'}</AlertTitle>
        <AlertDescription>
          {conn.scope === 'read'
            ? 'Read-only access. No write operations can be performed.'
            : 'Full access granted. Agents can read and write on your behalf.'}
        </AlertDescription>
      </Alert>
    </div>
  )
}

function SharingTab({ conn }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border/40 bg-card p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Visibility</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {conn.isPrivate ? 'Only you can use this connection' : 'All workspace members can use this connection'}
          </p>
        </div>
        <Badge variant="outline" className="w-fit shrink-0 self-start sm:self-auto">
          {conn.isPrivate ? 'Private' : 'Workspace'}
        </Badge>
      </div>
      <Alert>
        <AlertDescription>
          Connection credentials are managed through Aziron Vault and are never shared directly. Visibility only controls whether other workspace members can reference this connection in their flows.
        </AlertDescription>
      </Alert>
    </div>
  )
}

const MOCK_AUDIT = [
  { time: '2 hours ago', actor: 'vbagavan', action: 'Connection tested', ok: true },
  { time: '1 day ago', actor: 'agent/cs', action: 'Credentials accessed', ok: true },
  { time: '3 days ago', actor: 'vbagavan', action: 'Scope updated → read', ok: true },
  { time: '5 days ago', actor: 'jaysmith', action: 'Connection created', ok: true },
]

function AuditLogTab() {
  return (
    <div className="flex flex-col gap-1">
      {MOCK_AUDIT.map((entry, i) => (
        <div key={i} className="flex flex-col gap-1 border-b border-border/30 py-2.5 last:border-0 sm:flex-row sm:items-start sm:gap-2.5">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            <div className={`mt-1.5 size-1.5 shrink-0 rounded-full ${entry.ok ? 'bg-success' : 'bg-destructive'}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground">{entry.action}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                by <span className="font-medium">{entry.actor}</span>
              </p>
            </div>
          </div>
          <span className="pl-3.5 text-[11px] text-muted-foreground sm:shrink-0 sm:pl-0">{entry.time}</span>
        </div>
      ))}
    </div>
  )
}

const DETAIL_TABS = [
  { key: 'overview', label: 'Overview', shortLabel: 'Overview', icon: Activity },
  { key: 'flows', label: 'Flows', shortLabel: 'Flows', icon: Workflow },
  { key: 'stats', label: 'Usage stats', shortLabel: 'Stats', icon: BarChart3 },
  { key: 'permissions', label: 'Permissions', shortLabel: 'Perms', icon: Shield },
  { key: 'sharing', label: 'Sharing', shortLabel: 'Share', icon: Share2 },
  { key: 'audit', label: 'Audit log', shortLabel: 'Audit', icon: ScrollText },
]

export default function ConnectionDetail() {
  const { detail, closeDetail, setDetailTab, deleteConnection, testConnection, connections } = useConnectionsStore()
  const { open, connectionId, activeTab } = detail
  const [confirmDelete, setConfirmDelete] = useState(false)

  const conn = connections.find(c => c.id === connectionId)

  function handleDeleteConfirm() {
    if (conn) {
      deleteConnection(conn.id)
      closeDetail()
    }
    setConfirmDelete(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={v => { if (!v) closeDetail() }}>
        <DialogContent
          showCloseButton
          className="flex max-h-[min(92dvh,800px)] w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[720px]"
        >
          {conn ? (
            <>
              <DialogTitle className="sr-only">{conn.name} connection details</DialogTitle>
              <DialogDescription className="sr-only">
                View health, usage, permissions, and audit history for this connector.
              </DialogDescription>

              <div className="flex shrink-0 flex-col gap-3 border-b border-border/40 p-4 pr-12 sm:flex-row sm:items-start sm:gap-3 sm:p-5 sm:pr-14">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <ProviderAvatar providerId={conn.providerId} size="lg" className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-foreground">{conn.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <ConnectionTypeBadge type={conn.type} size="default" />
                      <ConnectionStatusBadge status={conn.status} size="default" />
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => testConnection(conn.id)}
                    aria-label="Test connection"
                  >
                    <RefreshCw />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setConfirmDelete(true)}
                    aria-label="Delete connection"
                    className="hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setDetailTab} className="flex min-h-0 flex-1 flex-col gap-0">
                <div className="overflow-x-auto border-b">
                  <TabsList className="inline-flex h-auto w-max min-w-full shrink-0 justify-start rounded-none border-0 bg-transparent p-0 px-4 sm:min-w-0 sm:w-full sm:px-5">
                    {DETAIL_TABS.map(({ key, label, shortLabel, icon: Icon }) => (
                      <TabsTrigger
                        key={key}
                        value={key}
                        aria-label={label}
                        className="shrink-0 gap-1.5 rounded-none border-b-2 border-transparent px-2.5 py-3 text-xs sm:px-3 sm:text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                      >
                        <Icon />
                        <span className="sm:hidden">{shortLabel}</span>
                        <span className="hidden sm:inline">{label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
                  <TabsContent value="overview" className="mt-0">
                    <OverviewTab conn={conn} />
                  </TabsContent>
                  <TabsContent value="flows" className="mt-0">
                    <UsedInFlowsTab conn={conn} />
                  </TabsContent>
                  <TabsContent value="stats" className="mt-0">
                    <UsageStatsTab conn={conn} />
                  </TabsContent>
                  <TabsContent value="permissions" className="mt-0">
                    <PermissionsTab conn={conn} />
                  </TabsContent>
                  <TabsContent value="sharing" className="mt-0">
                    <SharingTab conn={conn} />
                  </TabsContent>
                  <TabsContent value="audit" className="mt-0">
                    <AuditLogTab />
                  </TabsContent>
                </div>
              </Tabs>

              {(conn.status === 'expired' || conn.status === 'error') && (
                <div className="shrink-0 border-t border-border/40 bg-muted/30 p-4 sm:px-5">
                  <Button className="w-full">
                    {conn.status === 'expired' ? 'Re-authenticate' : 'Retry connection'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="p-6">
              <Empty className="border-none">
                <EmptyHeader>
                  <EmptyTitle>Connection not found</EmptyTitle>
                  <EmptyDescription>The selected connector may have been removed.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {confirmDelete && conn && (
        <ConfirmDialog
          title={`Delete "${conn.name}"?`}
          message="This cannot be undone. Flows and agents using this connector will lose access."
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  )
}
