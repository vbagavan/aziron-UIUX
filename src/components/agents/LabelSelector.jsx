import { useState, useRef, useEffect } from 'react'
import { Plus, Check, X, Tag, ChevronDown } from 'lucide-react'
import { useLabelsStore, getLabelColor, LABEL_COLORS } from '@/lib/agentLabels.js'
import { cn } from '@/lib/utils'

// ─── Single label chip ─────────────────────────────────────────────────────────

export function LabelChip({ labelId, onRemove, size = 'sm' }) {
  const { getLabel } = useLabelsStore()
  const label = getLabel(labelId)
  if (!label) return null
  const { hex, light, border } = getLabelColor(label.color)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        size === 'xs' ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-xs',
      )}
      style={{ color: hex, backgroundColor: light, borderColor: border }}
    >
      {label.name}
      {onRemove && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onRemove(labelId) }}
          className="flex items-center justify-center rounded-full hover:opacity-70 transition-opacity"
          aria-label={`Remove label ${label.name}`}
        >
          <X size={9} strokeWidth={2.5} />
        </button>
      )}
    </span>
  )
}

// ─── Color picker row ─────────────────────────────────────────────────────────

function ColorPicker({ selected, onChange }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {LABEL_COLORS.map(({ id, hex }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'size-5 rounded-full transition-all hover:scale-110',
            selected === id && 'ring-2 ring-offset-1 ring-foreground scale-110',
          )}
          style={{ backgroundColor: hex }}
          aria-label={id}
        />
      ))}
    </div>
  )
}

// ─── Create label inline form ──────────────────────────────────────────────────

function CreateLabelForm({ onCreated, onCancel }) {
  const { createLabel } = useLabelsStore()
  const [name, setName] = useState('')
  const [color, setColor] = useState('indigo')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    const label = createLabel(name, color)
    onCreated(label.id)
    setName('')
  }

  return (
    <div className="flex flex-col gap-2.5 border-t border-border/40 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">New label</p>
      <form onSubmit={handleCreate} className="flex flex-col gap-2">
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Label name…"
          maxLength={32}
          className="h-7 w-full rounded-md border border-input bg-transparent px-2 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        <ColorPicker selected={color} onChange={setColor} />
        <div className="flex items-center gap-1.5">
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md bg-foreground px-2 text-xs font-semibold text-background hover:bg-foreground/85 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Check size={11} strokeWidth={2.5} /> Create
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-7 items-center justify-center rounded-md border border-border px-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Main LabelSelector ────────────────────────────────────────────────────────

/**
 * Multi-select label picker for agent create/edit forms.
 *
 * Props:
 *   value        – string[] of selected label ids
 *   onChange     – (ids: string[]) => void
 *   placeholder  – string (default "Add labels…")
 *   className    – optional wrapper class
 */
export default function LabelSelector({ value = [], onChange, placeholder = 'Add labels…', className = '' }) {
  const { labels } = useLabelsStore()
  const [open, setOpen]           = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [query, setQuery]         = useState('')
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
    !query || l.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* Trigger / selected chips */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => { setOpen(v => !v); setShowCreate(false) }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(v => !v) } }}
        className={cn(
          'flex min-h-8 w-full flex-wrap items-center gap-1.5 rounded-lg border bg-transparent px-2.5 py-1.5 cursor-pointer transition-colors',
          open ? 'border-ring ring-3 ring-ring/50' : 'border-input hover:border-ring/50',
        )}
      >
        {value.length === 0 && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Tag size={13} />
            {placeholder}
          </span>
        )}
        {value.map(id => (
          <LabelChip key={id} labelId={id} onRemove={id => { toggle(id) }} />
        ))}
        <ChevronDown
          size={13}
          className={cn('ml-auto text-muted-foreground flex-shrink-0 transition-transform', open && 'rotate-180')}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[220px] rounded-xl border border-border/60 bg-popover shadow-lg overflow-hidden">
          {/* Search */}
          <div className="px-3 pt-2.5 pb-1">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search labels…"
              className="h-7 w-full rounded-md border border-input bg-transparent px-2 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* Label list */}
          <div className="max-h-[200px] overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                {query ? `No labels match "${query}"` : 'No labels yet'}
              </p>
            )}
            {filtered.map(label => {
              const selected = value.includes(label.id)
              const { hex, light, border } = getLabelColor(label.color)
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={e => { e.stopPropagation(); toggle(label.id) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                >
                  <span
                    className="flex size-4 flex-shrink-0 items-center justify-center rounded border transition-colors"
                    style={selected
                      ? { backgroundColor: hex, borderColor: hex }
                      : { borderColor: border, backgroundColor: light }}
                  >
                    {selected && <Check size={10} className="text-white" strokeWidth={3} />}
                  </span>
                  <span
                    className="flex-1 truncate text-xs font-medium"
                    style={{ color: hex }}
                  >
                    {label.name}
                  </span>
                  <span
                    className="size-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: hex }}
                  />
                </button>
              )
            })}
          </div>

          {/* Create new */}
          {showCreate ? (
            <CreateLabelForm
              onCreated={handleCreated}
              onCancel={() => setShowCreate(false)}
            />
          ) : (
            <div className="border-t border-border/40">
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setShowCreate(true) }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <Plus size={12} /> Create new label
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
