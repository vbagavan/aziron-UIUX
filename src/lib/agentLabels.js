/**
 * Agent label system — system-wide labels with localStorage persistence.
 * Labels are shared across the workspace (any agent can use any label).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const LABEL_COLORS = [
  { id: 'indigo',  hex: '#6366f1', light: '#eef2ff', border: '#c7d2fe' },
  { id: 'emerald', hex: '#10b981', light: '#ecfdf5', border: '#a7f3d0' },
  { id: 'amber',   hex: '#f59e0b', light: '#fffbeb', border: '#fde68a' },
  { id: 'rose',    hex: '#f43f5e', light: '#fff1f2', border: '#fecdd3' },
  { id: 'sky',     hex: '#0ea5e9', light: '#f0f9ff', border: '#bae6fd' },
  { id: 'violet',  hex: '#8b5cf6', light: '#f5f3ff', border: '#ddd6fe' },
  { id: 'orange',  hex: '#f97316', light: '#fff7ed', border: '#fed7aa' },
  { id: 'teal',    hex: '#14b8a6', light: '#f0fdfa', border: '#99f6e4' },
]

export const SEED_LABELS = [
  { id: 'l-1', name: 'HR & Recruitment', color: 'indigo'  },
  { id: 'l-2', name: 'Customer Support', color: 'emerald' },
  { id: 'l-3', name: 'Finance',          color: 'amber'   },
  { id: 'l-4', name: 'Analytics',        color: 'sky'     },
  { id: 'l-5', name: 'Engineering',      color: 'violet'  },
  { id: 'l-6', name: 'Marketing',        color: 'orange'  },
]

export const useLabelsStore = create(
  persist(
    (set, get) => ({
      labels: SEED_LABELS,

      /** Returns a label by id. */
      getLabel: (id) => get().labels.find(l => l.id === id),

      /** Creates a new label and returns it. */
      createLabel: (name, color) => {
        const id = `l-${Date.now()}`
        const label = { id, name: name.trim(), color }
        set(s => ({ labels: [...s.labels, label] }))
        return label
      },

      /** Renames a label. */
      renameLabel: (id, name) =>
        set(s => ({ labels: s.labels.map(l => l.id === id ? { ...l, name: name.trim() } : l) })),

      /** Deletes a label (agents keep the id but it will resolve to undefined). */
      deleteLabel: (id) =>
        set(s => ({ labels: s.labels.filter(l => l.id !== id) })),
    }),
    { name: 'aziron_agent_labels_v1' }
  )
)

/** Returns the LABEL_COLORS config for a given color id. */
export function getLabelColor(colorId) {
  return LABEL_COLORS.find(c => c.id === colorId) ?? LABEL_COLORS[0]
}
