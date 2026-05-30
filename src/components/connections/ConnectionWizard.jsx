import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Check, Eye, EyeOff, ChevronLeft, Loader2, CheckCircle2, AlertCircle,
  Lock, Users, ShieldCheck, Zap, ArrowRight, Plus, Search,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import VaultSecurityNote from './VaultSecurityNote.jsx'
import ProviderAvatar from './ProviderAvatar.jsx'
import { useConnectionsStore } from '@/lib/connections/store.js'
import { CATALOG_PROVIDERS } from '@/lib/connections/constants.js'
import { cn } from '@/lib/utils'

const WIZARD_STEPS = ['Catalog', 'Configure', 'Scope', 'Credentials']

function WizardStepper({ step }) {
  const currentLabel = WIZARD_STEPS[step - 1] ?? WIZARD_STEPS[0]

  return (
    <div
      className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-4 sm:px-6"
      aria-label={`Step ${step} of ${WIZARD_STEPS.length}: ${currentLabel}`}
    >
      <div className="flex items-center">
        {WIZARD_STEPS.map((label, i) => {
          const n = i + 1
          const done = n < step
          const current = n === step
          return (
            <div key={label} className="flex min-w-0 flex-1 items-center last:flex-none">
              <div
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  done && 'bg-primary text-primary-foreground',
                  current && !done && 'bg-primary text-primary-foreground ring-4 ring-ring',
                  !done && !current && 'bg-muted text-muted-foreground',
                )}
                aria-hidden
              >
                {done ? <Check strokeWidth={3} /> : n}
              </div>
              {i < WIZARD_STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-1.5 h-0.5 min-w-3 flex-1 rounded-full transition-colors',
                    n < step ? 'bg-primary' : 'bg-border',
                  )}
                  aria-hidden
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">
          Step {step} of {WIZARD_STEPS.length}
        </span>
        <span className="truncate font-medium text-foreground">{currentLabel}</span>
      </div>
    </div>
  )
}

function Step1Catalog() {
  const { wizard, setWizardField, wizardNext } = useConnectionsStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')

  const filtered = CATALOG_PROVIDERS.filter(p => {
    const matchCat = category === 'All' || p.category === category
    const q = query.toLowerCase()
    return !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
  })

  const usedCats = ['All', ...new Set(CATALOG_PROVIDERS.map(p => p.category))]

  function selectProvider(provider) {
    setWizardField('selectedProvider', provider)
    wizardNext()
  }

  return (
    <div className="flex flex-col gap-4">
      <DialogHeader className="p-0 text-left">
        <DialogTitle className="text-base">Choose a provider</DialogTitle>
        <DialogDescription>Connect to an external service or data source</DialogDescription>
      </DialogHeader>

      <InputGroup>
        <InputGroupAddon align="inline-start">
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search providers…"
        />
      </InputGroup>

      <div className="flex flex-wrap gap-1.5">
        {usedCats.map(cat => (
          <Button
            key={cat}
            type="button"
            size="xs"
            variant={category === cat ? 'default' : 'outline'}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="grid max-h-[min(50vh,320px)] grid-cols-2 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-3">
        {filtered.length === 0 && (
          <p className="col-span-2 py-10 text-center text-sm text-muted-foreground sm:col-span-3">
            No providers match &ldquo;{query}&rdquo;
          </p>
        )}
        {filtered.map(provider => (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            className={cn(
              'flex h-auto flex-col items-center gap-2 p-3',
              wizard.selectedProvider?.id === provider.id && 'border-primary bg-accent text-accent-foreground',
            )}
            onClick={() => selectProvider(provider)}
          >
            <ProviderAvatar providerId={provider.id} size="md" />
            <div className="min-w-0 w-full text-center">
              <p className="truncate text-xs font-semibold">{provider.name}</p>
              <p className="type-caption mt-0.5 capitalize">
                {provider.type.replace('_', ' ')}
              </p>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}

function Step2Configure() {
  const { wizard, setWizardField } = useConnectionsStore()
  const provider = wizard.selectedProvider

  return (
    <div className="flex flex-col gap-5">
      <DialogHeader className="p-0 text-left">
        <DialogTitle className="text-base">Configure connection</DialogTitle>
        <DialogDescription>Name this connection and set its visibility</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted p-3 sm:flex-row sm:items-center">
        <ProviderAvatar providerId={provider?.id} size="md" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{provider?.name}</p>
          <p className="text-xs text-muted-foreground">{provider?.description}</p>
        </div>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="connection-name">Connection name</FieldLabel>
          <Input
            id="connection-name"
            value={wizard.name}
            onChange={e => setWizardField('name', e.target.value)}
            placeholder={provider?.name ?? 'My Connection'}
            maxLength={64}
          />
          <FieldDescription>A memorable name to identify this connection in flows and agents</FieldDescription>
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          {wizard.isPrivate ? <Lock className="mt-0.5 sm:mt-0" /> : <Users className="mt-0.5 sm:mt-0" />}
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {wizard.isPrivate ? 'Private' : 'Workspace'}
            </p>
            <p className="text-xs text-muted-foreground">
              {wizard.isPrivate
                ? 'Only you can use this connection'
                : 'All workspace members can use this connection'}
            </p>
          </div>
        </div>
        <Switch
          checked={wizard.isPrivate}
          onCheckedChange={v => setWizardField('isPrivate', v)}
          aria-label="Private connection"
          className="shrink-0 self-end sm:self-auto"
        />
      </div>

      <VaultSecurityNote />
    </div>
  )
}

const SCOPE_OPTIONS = [
  {
    id: 'full',
    label: 'Full access',
    tag: 'Recommended',
    icon: Zap,
    desc: 'All permissions required for this integration to function fully. Best for most use cases.',
  },
  {
    id: 'read',
    label: 'Read only',
    tag: null,
    icon: ShieldCheck,
    desc: 'Read-only access only. Your data cannot be modified through this connection.',
  },
  {
    id: 'custom',
    label: 'Custom scopes',
    tag: 'OAuth only',
    icon: Lock,
    desc: 'Manually select the exact permission scopes you want to grant.',
  },
]

function Step3Scope() {
  const { wizard, setWizardField } = useConnectionsStore()
  const provider = wizard.selectedProvider
  const isOauth = provider?.type === 'oauth'

  return (
    <div className="flex flex-col gap-5">
      <DialogHeader className="p-0 text-left">
        <DialogTitle className="text-base">Permission scope</DialogTitle>
        <DialogDescription>Control what level of access to grant</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        {SCOPE_OPTIONS.map(({ id, label, tag, icon: Icon, desc }) => {
          const disabled = id === 'custom' && !isOauth
          const selected = wizard.scope === id
          return (
            <Button
              key={id}
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                'flex h-auto items-start justify-start gap-3 p-3.5 text-left',
                selected && 'border-primary bg-accent text-accent-foreground',
              )}
              onClick={() => !disabled && setWizardField('scope', id)}
            >
              <span className={cn(
                'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
                selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}>
                <Icon />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{label}</span>
                  {tag && (
                    <Badge variant={tag === 'Recommended' ? 'secondary' : 'outline'}>
                      {tag}
                    </Badge>
                  )}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{desc}</span>
              </span>
              {selected && <Check className="mt-1 shrink-0 text-primary" strokeWidth={2.5} />}
            </Button>
          )
        })}
      </div>

      {wizard.scope === 'custom' && isOauth && provider?.scopes && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available scopes</p>
          <div className="flex flex-wrap gap-1.5">
            {provider.scopes.map(scope => (
              <Badge key={scope} variant="outline" className="font-mono text-xs">
                {scope}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SecretField({ field }) {
  const [show, setShow] = useState(false)
  const [val, setVal] = useState('')

  return (
    <Field>
      <FieldLabel htmlFor={field.key}>{field.label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={field.key}
          type={show || !field.secret ? 'text' : 'password'}
          value={val}
          onChange={e => setVal(e.target.value)}
          placeholder={field.placeholder}
          autoComplete="off"
          className="font-mono"
        />
        {field.secret && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setShow(v => !v)}
              aria-label={show ? 'Hide value' : 'Show value'}
            >
              {show ? <EyeOff /> : <Eye />}
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    </Field>
  )
}

function OAuthField() {
  const { wizard } = useConnectionsStore()
  const provider = wizard.selectedProvider

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <ProviderAvatar providerId={provider?.id} size="lg" />
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">Authorize with {provider?.name}</p>
        <p className="mx-auto mt-1 max-w-[260px] text-xs leading-relaxed text-muted-foreground">
          You&apos;ll be redirected to {provider?.name} to grant access. The token will be stored encrypted in Aziron Vault.
        </p>
      </div>
      <Button type="button" onClick={e => e.preventDefault()}>
        <ArrowRight data-icon="inline-start" />
        Connect to {provider?.name}
      </Button>
    </div>
  )
}

function Step4Credentials() {
  const { wizard, testCredentials } = useConnectionsStore()
  const provider = wizard.selectedProvider
  const isOauth = provider?.type === 'oauth'

  return (
    <div className="flex flex-col gap-5">
      <DialogHeader className="p-0 text-left">
        <DialogTitle className="text-base">Add credentials</DialogTitle>
        <DialogDescription>
          {isOauth ? 'Authorize via OAuth redirect' : 'Enter your API credentials below'}
        </DialogDescription>
      </DialogHeader>

      {isOauth ? (
        <OAuthField />
      ) : (
        <FieldGroup>
          {(provider?.fields ?? []).map(field => (
            <SecretField key={field.key} field={field} />
          ))}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={testCredentials}
              disabled={wizard.testStatus === 'testing'}
            >
              {wizard.testStatus === 'testing' ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Zap data-icon="inline-start" />
              )}
              {wizard.testStatus === 'testing' ? 'Testing…' : 'Test connection'}
            </Button>

            {wizard.testStatus === 'success' && (
              <Alert className="w-full min-w-0 flex-1 border-success-ring bg-success py-2 text-success-foreground sm:w-auto">
                <CheckCircle2 />
                <AlertDescription>{wizard.testMessage}</AlertDescription>
              </Alert>
            )}
            {wizard.testStatus === 'error' && (
              <Alert variant="destructive" className="w-full min-w-0 flex-1 py-2 sm:w-auto">
                <AlertCircle />
                <AlertDescription>{wizard.testMessage}</AlertDescription>
              </Alert>
            )}
          </div>
        </FieldGroup>
      )}

      <VaultSecurityNote />
    </div>
  )
}

function Step5Success() {
  const { wizard, resetWizard, openDetail, connections } = useConnectionsStore()
  const provider = wizard.selectedProvider
  const newConn = connections.find(c => c.id === wizard.newConnectionId)

  function handleViewDetail() {
    resetWizard()
    if (newConn) openDetail(newConn.id)
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
        className="flex size-20 items-center justify-center rounded-full bg-muted"
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 260, delay: 0.25 }}
        >
          <CheckCircle2 className="text-success" strokeWidth={1.5} />
        </motion.div>
      </motion.div>

      <DialogHeader className="p-0 text-center">
        <DialogTitle className="text-lg">Connection added!</DialogTitle>
        <DialogDescription>
          <span className="font-medium text-foreground">{newConn?.name ?? provider?.name}</span>
          {' '}is ready to use in your flows and agents.
        </DialogDescription>
      </DialogHeader>

      <div className="w-full divide-y divide-border rounded-lg border border-border bg-card">
        {[
          { label: 'Provider', value: provider?.name },
          { label: 'Name', value: newConn?.name ?? provider?.name },
          { label: 'Type', value: provider?.type.replace('_', ' ') },
          { label: 'Scope', value: wizard.scope },
          { label: 'Visibility', value: wizard.isPrivate ? 'Private' : 'Workspace' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-xs font-medium capitalize text-foreground">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex w-full flex-col gap-2">
        <Button onClick={handleViewDetail} className="w-full">
          View connection details
        </Button>
        <Button variant="outline" onClick={resetWizard} className="w-full">
          Done
        </Button>
        <Button
          variant="link"
          size="sm"
          onClick={() => {
            const store = useConnectionsStore.getState()
            store.setWizardField('step', 1)
            store.setWizardField('direction', 1)
            store.setWizardField('selectedProvider', null)
          }}
        >
          <Plus data-icon="inline-start" />
          Add another connection
        </Button>
      </div>
    </div>
  )
}

const STEP_COMPONENTS = [null, Step1Catalog, Step2Configure, Step3Scope, Step4Credentials, Step5Success]

function AnimatedStep({ step, direction }) {
  const StepComponent = STEP_COMPONENTS[step] ?? Step1Catalog
  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={step}
        custom={direction}
        initial={{ x: direction * 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: direction * -40, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
      >
        <StepComponent />
      </motion.div>
    </AnimatePresence>
  )
}

function WizardFooter() {
  const { wizard, wizardBack, wizardNext, saveConnection, resetWizard } = useConnectionsStore()
  const { step, selectedProvider, testStatus, saving } = wizard
  const isOauth = selectedProvider?.type === 'oauth'

  if (step === 5) return null

  const canProceed = {
    1: !!selectedProvider,
    2: true,
    3: true,
    4: isOauth ? true : (testStatus === 'success' || testStatus === null),
  }[step]

  const nextLabel = { 1: 'Next', 2: 'Next', 3: 'Next', 4: 'Save connection' }[step]
  const isLastStep = step === 4

  async function handleNext() {
    if (isLastStep) {
      await saveConnection()
    } else {
      wizardNext()
    }
  }

  return (
    <DialogFooter className="flex shrink-0 flex-row items-center justify-between gap-2 sm:justify-between">
      <Button
        type="button"
        variant="outline"
        onClick={step === 1 ? resetWizard : wizardBack}
        className="min-w-0 flex-1 sm:flex-none"
      >
        {step === 1 ? (
          <>Cancel</>
        ) : (
          <>
            <ChevronLeft data-icon="inline-start" />
            Back
          </>
        )}
      </Button>

      <Button type="button" onClick={handleNext} disabled={!canProceed || saving} className="min-w-0 flex-1 sm:flex-none">
        {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
        {nextLabel}
      </Button>
    </DialogFooter>
  )
}

export default function ConnectionWizard() {
  const { wizard, resetWizard } = useConnectionsStore()
  const { open, step, direction } = wizard

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) resetWizard() }}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(92dvh,720px)] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>New connector</DialogTitle>
          <DialogDescription>
            Step {step} of {WIZARD_STEPS.length} — add a new external connection
          </DialogDescription>
        </DialogHeader>
        {step < 5 && <WizardStepper step={step} />}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          <AnimatedStep step={step} direction={direction} />
        </div>
        <WizardFooter />
      </DialogContent>
    </Dialog>
  )
}
