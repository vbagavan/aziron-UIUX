import { useState, useRef, useEffect } from 'react'
import { Plus, Check, X, Tag, ChevronDown, Search, Settings2 } from 'lucide-react'
import { useLabelsStore } from '@/lib/agentLabels.js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { cn } from '@/lib/utils'

export function LabelChip({ labelId, onRemove, size = 'sm', className }) {
  const { getLabel } = useLabelsStore()
  const label = getLabel(labelId)
  if (!label) return null

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-medium',
        size === 'xs' ? 'h-5 text-xs' : 'text-xs',
        className,
      )}
    >
      {label.name}
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={e => { e.stopPropagation(); onRemove(labelId) }}
          aria-label={`Remove label ${label.name}`}
          className="size-4 min-w-0 p-0 hover:bg-transparent"
        >
          <X />
        </Button>
      )}
    </Badge>
  )
}

export function AgentLabelsRow({ labelIds, tags, max = 2, className }) {
  const ids = labelIds ?? []
  if (ids.length > 0) {
    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        {ids.slice(0, max).map(id => (
          <LabelChip key={id} labelId={id} size="xs" />
        ))}
        {ids.length > max && (
          <Badge variant="secondary" className="h-5 text-xs">
            +{ids.length - max}
          </Badge>
        )}
      </div>
    )
  }

  const tagList = tags ?? []
  if (tagList.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {tagList.slice(0, max).map(tag => (
        <Badge key={tag} variant="outline" className="h-5 gap-1 text-xs font-medium">
          {tag}
        </Badge>
      ))}
      {tagList.length > max && (
        <Badge variant="secondary" className="h-5 text-xs">
          +{tagList.length - max}
        </Badge>
      )}
    </div>
  )
}

export function LabelFilterButton({ label, active, count, onClick, unused = false }) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'outline'}
      size="xs"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'h-auto rounded-full px-2.5 py-0.5 text-xs font-medium',
        unused && !active && 'opacity-60',
      )}
    >
      {label.name}
      <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] font-bold">
        {count}
      </Badge>
    </Button>
  )
}

function CreateLabelForm({ onCreated, onCancel }) {
  const { createLabel } = useLabelsStore()
  const [name, setName] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    const label = createLabel(name)
    onCreated(label.id)
    setName('')
  }

  return (
    <form onSubmit={handleCreate} className="flex flex-col gap-3 border-t border-border px-3 py-3">
      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel htmlFor="new-label-name" className="type-section-eyebrow">
            New label
          </FieldLabel>
          <Input
            id="new-label-name"
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Label name…"
            maxLength={32}
          />
        </Field>
      </FieldGroup>
      <div className="flex shrink-0 items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" className="min-w-20" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!name.trim()} className="min-w-20">
          <Check data-icon="inline-start" />
          Create
        </Button>
      </div>
    </form>
  )
}

/**
 * Multi-select label picker for agent create/edit forms.
 */
export default function LabelSelector({
  value = [],
  onChange,
  placeholder = 'Add labels…',
  className,
  onManageLabels,
}) {
  const { labels } = useLabelsStore()
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setShowCreate(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function toggle(id) {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
  }

  function handleCreated(id) {
    onChange([...value, id])
    setShowCreate(false)
    setQuery('')
  }

  const filtered = labels.filter(l =>
    !query || l.name.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div ref={ref} className={cn('relative', className)}>
      <Button
        type="button"
        variant="outline"
        aria-expanded={open}
        onClick={() => { setOpen(v => !v); setShowCreate(false) }}
        className={cn(
          'h-auto min-h-8 w-full justify-start gap-1.5 px-2.5 py-1.5 font-normal',
          open && 'border-ring ring-3 ring-ring/50',
        )}
      >
        {value.length === 0 ? (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Tag />
            {placeholder}
          </span>
        ) : (
          <span className="flex flex-1 flex-wrap items-center gap-1.5">
            {value.map(id => (
              <LabelChip key={id} labelId={id} onRemove={toggle} />
            ))}
          </span>
        )}
        <ChevronDown className={cn('ml-auto shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </Button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[240px] overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          <div className="p-2">
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search labels…"
                onClick={e => e.stopPropagation()}
              />
            </InputGroup>
          </div>

          <div className="max-h-[200px] overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                {query ? `No labels match "${query}"` : 'No labels yet'}
              </p>
            )}
            {filtered.map(label => {
              const selected = value.includes(label.id)
              return (
                <Button
                  key={label.id}
                  type="button"
                  variant="ghost"
                  onClick={e => { e.stopPropagation(); toggle(label.id) }}
                  className="h-auto w-full justify-start gap-2.5 rounded-none px-3 py-2 text-sm font-normal"
                >
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded border border-border bg-background',
                      selected && 'border-primary bg-primary text-primary-foreground',
                    )}
                  >
                    {selected && <Check strokeWidth={3} />}
                  </span>
                  <Badge variant="outline" className="font-normal">
                    {label.name}
                  </Badge>
                </Button>
              )
            })}
          </div>

          {showCreate ? (
            <CreateLabelForm
              onCreated={handleCreated}
              onCancel={() => setShowCreate(false)}
            />
          ) : (
            <>
              <Separator />
              <Button
                type="button"
                variant="ghost"
                onClick={e => { e.stopPropagation(); setShowCreate(true) }}
                className="h-auto w-full justify-start gap-2 rounded-none px-3 py-2.5 text-xs font-medium text-muted-foreground"
              >
                <Plus data-icon="inline-start" />
                Create new label
              </Button>
              {onManageLabels && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={e => { e.stopPropagation(); setOpen(false); onManageLabels() }}
                  className="h-auto w-full justify-start gap-2 rounded-none px-3 py-2.5 text-xs font-medium text-muted-foreground"
                >
                  <Settings2 data-icon="inline-start" />
                  Manage labels
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
