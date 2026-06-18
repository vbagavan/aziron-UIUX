import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  CheckCircle2, XCircle, ArrowRight, Activity, BarChart3, Shield, Share2,
  ScrollText, Workflow, RefreshCw, Trash2, AlertTriangle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SourceWizardFooter } from '@/components/features/knowledge/source-intake/SourceWizardFooter'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import ProviderAvatar from './ProviderAvatar.jsx'
import { ConnectionStatusBadge, ConnectionTypeBadge } from './ConnectionBadges.jsx'
import { useConnectionsStore } from '@/lib/connections/store.js'
import { CATALOG_PROVIDERS } from '@/lib/connections/constants.js'
import { cn } from '@/lib/utils'

function SectionLabel({ children, className }) {
  return (
    <h3 className={cn('type-section-eyebrow', className)}>
      {children}
    </h3>
  )
}

function Sparkbar({ values = [], className }) {
  if (!values.length) return null
  const max = Math.max(...values, 1)
  return (
    <div className={cn('flex h-10 items-end gap-0.5', className)}>
      {values.map((v, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.05, duration: 0.3, ease: 'easeOut' }}
          style={{ originY: '100%', height: `${Math.max(4, (v / max) * 100)}%` }}
          className={cn(
            'flex-1 rounded-sm',
            i === values.length - 1 ? 'bg-primary' : 'bg-accent',
          )}
        />
      ))}
    </div>
  )
}

function HealthChecks({ checks = [] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {checks.map((check, i) => (
        <div key={i} className="flex items-start gap-2.5">
          {check.ok ? (
            <CheckCircle2 className="mt-0.5 shrink-0 text-success" />
          ) : (
            <XCircle className="mt-0.5 shrink-0 text-destructive" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">{check.check}</p>
            {check.detail && (
              <p className="type-caption mt-0.5">{check.detail}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function MetricCard({ label, value, sub }) {
  return (
    <Card className="border-border bg-muted py-0 shadow-none">
      <CardContent className="flex flex-col gap-0.5 p-3">
        <CardDescription className="font-medium uppercase tracking-wide">
          {label}
        </CardDescription>
        <p className="text-lg font-bold tabular-nums text-foreground">{value}</p>
        {sub && <p className="type-caption">{sub}</p>}
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
          <SectionLabel>Health checks</SectionLabel>
          <ConnectionStatusBadge status={conn.status} size="default" />
        </div>
        <Card className="border-border bg-muted py-0 shadow-none">
          <CardContent className="p-3">
            <HealthChecks checks={conn.health} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <MetricCard label="Today" value={conn.callsToday.toLocaleString()} sub="API calls" />
        <MetricCard label="This week" value={totalWeek.toLocaleString()} sub="API calls" />
        <MetricCard label="Last used" value={conn.lastUsed} sub="relative" />
      </div>

      <div className="flex flex-col gap-2">
        <SectionLabel>7-day call volume</SectionLabel>
        <Card className="border-border bg-muted py-0 shadow-none">
          <CardContent className="p-3">
            <Sparkbar values={conn.callsWeek} />
            <div className="mt-1.5 flex justify-between">
              {days.map((d, i) => (
                <span key={i} className="type-caption flex-1 text-center">{d}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-0">
        <SectionLabel className="mb-2">Details</SectionLabel>
        {[
          { label: 'Added', value: conn.addedAt },
          { label: 'Added by', value: conn.addedBy },
          { label: 'Scope', value: conn.scope ?? '—' },
          { label: 'Visibility', value: conn.isPrivate ? 'Private' : 'Workspace' },
        ].map(({ label, value }, i, arr) => (
          <div key={label}>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-xs font-medium capitalize text-foreground">{value}</span>
            </div>
            {i < arr.length - 1 && <Separator />}
          </div>
        ))}
      </div>
    </div>
  )
}

function UsedInFlowsTab({ conn }) {
  const navigate = useNavigate()

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
      <p className="text-xs text-muted-foreground">
        Used in {conn.usedIn.length} flow{conn.usedIn.length !== 1 ? 's' : ''} / agent{conn.usedIn.length !== 1 ? 's' : ''}
      </p>
      {conn.usedIn.map(name => (
        <Button
          key={name}
          variant="outline"
          className="h-auto w-full justify-start gap-3 p-3"
          onClick={() => navigate('/flows')}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <Workflow />
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
  const max = Math.max(...(conn.callsWeek ?? [1]))

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2">
        <MetricCard label="Calls today" value={conn.callsToday.toLocaleString()} />
        <MetricCard label="Calls / week" value={totalWeek.toLocaleString()} />
      </div>
      <div className="flex flex-col gap-3">
        <SectionLabel>Daily breakdown</SectionLabel>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
          const val = conn.callsWeek?.[i] ?? 0
          return (
            <div key={day} className="flex items-center gap-3">
              <span className="type-caption w-7">{day}</span>
              <Progress value={val} max={max} className="h-1.5 flex-1" />
              <span className="type-caption w-10 text-right tabular-nums">
                {val.toLocaleString()}
              </span>
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
      <div className="flex flex-col gap-0">
        <SectionLabel className="mb-2">Granted scopes</SectionLabel>
        {scopes.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No scope information available</p>
        )}
        {scopes.map((scope, i) => (
          <div key={scope}>
            <div className="flex items-center gap-2.5 py-2">
              <Shield className="shrink-0 text-primary" />
              <span className="min-w-0 break-all font-mono text-xs text-foreground">{scope}</span>
              <Badge variant="secondary" className="ml-auto shrink-0">
                granted
              </Badge>
            </div>
            {i < scopes.length - 1 && <Separator />}
          </div>
        ))}
        {conn.type === 'api_key' && (
          <>
            {scopes.length > 0 && <Separator />}
            <div className="flex items-center gap-2.5 py-2">
              <Shield className="shrink-0 text-primary" />
              <span className="text-xs text-foreground">API key authentication</span>
              <Badge variant="secondary" className="ml-auto shrink-0">
                full access
              </Badge>
            </div>
          </>
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
      <Card className="py-0 shadow-none">
        <CardHeader className="flex flex-col gap-3 border-b-0 p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-sm">Visibility</CardTitle>
            <CardDescription className="mt-0.5">
              {conn.isPrivate ? 'Only you can use this connection' : 'All workspace members can use this connection'}
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit shrink-0">
            {conn.isPrivate ? 'Private' : 'Workspace'}
          </Badge>
        </CardHeader>
      </Card>
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
    <div className="flex flex-col gap-0">
      {MOCK_AUDIT.map((entry, i) => (
        <div key={i}>
          <div className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-start sm:gap-2.5">
            <div className="flex min-w-0 flex-1 items-start gap-2.5">
              <div
                className={cn(
                  'mt-1.5 size-1.5 shrink-0 rounded-full',
                  entry.ok ? 'bg-success' : 'bg-destructive',
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">{entry.action}</p>
                <p className="type-caption mt-0.5">
                  by <span className="font-medium text-foreground">{entry.actor}</span>
                </p>
              </div>
            </div>
            <span className="type-caption pl-3.5 sm:shrink-0 sm:pl-0">{entry.time}</span>
          </div>
          {i < MOCK_AUDIT.length - 1 && <Separator />}
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
  const navigate = useNavigate()
  const { detail, closeDetail, setDetailTab, deleteConnection, testConnection, reauthenticateConnection, connections } = useConnectionsStore()
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
      <Dialog
        open={open && !confirmDelete}
        onOpenChange={v => { if (!v) closeDetail() }}
      >
        <DialogContent
          showCloseButton
          className="flex max-h-[min(92dvh,800px)] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          {conn ? (
            <>
              <DialogHeader className="relative shrink-0 border-b border-border px-5 pt-5 pb-4 pr-14 sm:px-6 sm:pt-6 sm:pr-16">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <ProviderAvatar providerId={conn.providerId} size="lg" className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <DialogTitle className="truncate text-left text-base font-semibold sm:text-lg">
                        {conn.name}
                      </DialogTitle>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
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
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setDetailTab} className="flex min-h-0 flex-1 flex-col gap-0">
                <div className="shrink-0 overflow-x-auto px-4 py-3 sm:px-6">
                  <TabsList className="inline-flex h-auto w-max min-w-full sm:min-w-0 sm:w-full">
                    {DETAIL_TABS.map(({ key, label, shortLabel, icon: Icon }) => (
                      <TabsTrigger key={key} value={key} aria-label={label}>
                        <Icon />
                        <span className="sm:hidden">{shortLabel}</span>
                        <span className="hidden sm:inline">{label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <Separator />

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
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
                <SourceWizardFooter className="[&>div]:justify-end">
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() =>
                      conn.status === 'expired'
                        ? reauthenticateConnection(conn.id)
                        : testConnection(conn.id)
                    }
                  >
                    {conn.status === 'expired' ? 'Re-authenticate' : 'Retry connection'}
                  </Button>
                </SourceWizardFooter>
              )}
            </>
          ) : (
            <>
              <DialogHeader className="border-b border-border px-5 py-5 sm:px-6">
                <DialogTitle>Connection not found</DialogTitle>
                <DialogDescription>The selected connector may have been removed.</DialogDescription>
              </DialogHeader>
              <div className="p-6">
                <Empty className="border-none">
                  <EmptyHeader>
                    <EmptyTitle>No connector selected</EmptyTitle>
                    <EmptyDescription>Choose a connector from the list to view its details.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </div>
            </>
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
