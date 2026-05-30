import { useState } from 'react'
import { Pencil, Trash2, Settings2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LabelChip } from '@/components/agents/LabelSelector.jsx'
import { useLabelsStore } from '@/lib/agentLabels.js'
import { countAgentsWithLabel, stripLabelFromAgents } from '@/lib/agentLabelUtils.js'

function LabelManageRow({ label, agentCount, onRename, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(label.name)

  function saveRename() {
    const next = draft.trim()
    if (next && next !== label.name) onRename(label.id, next)
    setEditing(false)
  }

  function cancelEdit() {
    setDraft(label.name)
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
      <LabelChip labelId={label.id} className="shrink-0" />
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              maxLength={32}
              className="h-8 text-sm"
              aria-label={`Rename ${label.name}`}
            />
            <div className="flex items-center gap-1.5">
              <Button type="button" size="sm" onClick={saveRename} disabled={!draft.trim()}>
                Save
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">{label.name}</p>
            <Badge variant="secondary" className="text-xs">
              {agentCount} agent{agentCount !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}
      </div>
      {!editing && (
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`Rename ${label.name}`}
            onClick={() => setEditing(true)}
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`Delete ${label.name}`}
            onClick={() => onDelete(label)}
          >
            <Trash2 />
          </Button>
        </div>
      )}
    </div>
  )
}

export default function LabelManageDialog({ open, onOpenChange, agents = [], onAgentsChange }) {
  const { labels, renameLabel, deleteLabel } = useLabelsStore()
  const [pendingDelete, setPendingDelete] = useState(null)

  function handleDeleteConfirm() {
    if (!pendingDelete) return
    deleteLabel(pendingDelete.id)
    if (onAgentsChange) {
      onAgentsChange(stripLabelFromAgents(agents, pendingDelete.id))
    }
    setPendingDelete(null)
  }

  const deleteCount = pendingDelete ? countAgentsWithLabel(agents, pendingDelete.id) : 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[min(90dvh,640px)] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-border px-5 py-4 sm:px-6">
            <DialogTitle className="flex items-center gap-2 text-left">
              <Settings2 className="text-muted-foreground" />
              Manage labels
            </DialogTitle>
            <DialogDescription className="text-left">
              Rename or delete workspace labels. Deleting removes the label from all agents.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4 sm:p-5">
            {labels.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No labels yet. Create one when editing an agent.
              </p>
            ) : (
              labels.map(label => (
                <LabelManageRow
                  key={label.id}
                  label={label}
                  agentCount={countAgentsWithLabel(agents, label.id)}
                  onRename={renameLabel}
                  onDelete={setPendingDelete}
                />
              ))
            )}
          </div>

          <DialogFooter className="border-t border-border px-5 py-4 sm:px-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete "${pendingDelete.name}"?`}
          message={
            deleteCount > 0
              ? `This label is on ${deleteCount} agent(s). It will be removed from all of them.`
              : 'This label is not assigned to any agents.'
          }
          confirmLabel="Delete label"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </>
  )
}
