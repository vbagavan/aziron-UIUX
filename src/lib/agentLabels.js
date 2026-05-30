/**
 * Agent label system — workspace-wide labels with localStorage persistence.
 * Labels use plain outline badges (no per-label colors).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const SEED_LABELS = [
  { id: 'l-1', name: 'HR & Recruitment' },
  { id: 'l-2', name: 'Customer Support' },
  { id: 'l-3', name: 'Finance' },
  { id: 'l-4', name: 'Analytics' },
  { id: 'l-5', name: 'Engineering' },
  { id: 'l-6', name: 'Marketing' },
]

function normalizeLabel(label) {
  return { id: label.id, name: label.name }
}

export const useLabelsStore = create(
  persist(
    (set, get) => ({
      labels: SEED_LABELS,

      getLabel: (id) => get().labels.find(l => l.id === id),

      createLabel: (name) => {
        const id = `l-${Date.now()}`
        const label = { id, name: name.trim() }
        set(s => ({ labels: [...s.labels, label] }))
        return label
      },

      renameLabel: (id, name) =>
        set(s => ({ labels: s.labels.map(l => l.id === id ? { ...l, name: name.trim() } : l) })),

      deleteLabel: (id) =>
        set(s => ({ labels: s.labels.filter(l => l.id !== id) })),
    }),
    {
      name: 'aziron_agent_labels_v1',
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        labels: (persisted?.labels ?? current.labels).map(normalizeLabel),
      }),
    },
  ),
)
