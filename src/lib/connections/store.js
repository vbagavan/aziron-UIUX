import { create } from 'zustand'
import { MOCK_CONNECTIONS } from './constants.js'

// ─── Initial wizard state ─────────────────────────────────────────────────────
// Credentials are NEVER stored here — they POST directly to the API layer.

const INITIAL_WIZARD = {
  open:             false,
  step:             1,          // 1–5
  direction:        1,          // 1 = forward, -1 = backward (for animation)
  selectedProvider: null,       // provider object from CATALOG_PROVIDERS
  name:             '',
  isPrivate:        false,
  scope:            'full',     // 'full' | 'read' | 'custom'
  testStatus:       null,       // null | 'testing' | 'success' | 'error'
  testMessage:      '',
  saving:           false,
  newConnectionId:  null,       // set after successful creation
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useConnectionsStore = create((set, get) => ({
  // ── Data ──────────────────────────────────────────────────────────────────
  connections: MOCK_CONNECTIONS,
  loading:     false,
  error:       null,

  // ── Table filters ─────────────────────────────────────────────────────────
  search:       '',
  statusFilter: 'all',   // 'all' | status values
  typeTab:      'all',   // 'all' | 'oauth' | 'api_key' | 'mcp_server'

  // ── Wizard ────────────────────────────────────────────────────────────────
  wizard: { ...INITIAL_WIZARD },

  // ── Detail panel ─────────────────────────────────────────────────────────
  detail: {
    open:         false,
    connectionId: null,
    activeTab:    'overview',
  },

  // ── Filter actions ─────────────────────────────────────────────────────────
  setSearch:       (search)       => set({ search }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setTypeTab:      (typeTab)      => set({ typeTab }),

  // ── Derived: filtered connections ──────────────────────────────────────────
  getFiltered: () => {
    const { connections, search, statusFilter, typeTab } = get()
    return connections.filter(c => {
      const matchesType   = typeTab      === 'all' || c.type   === typeTab
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.providerId.toLowerCase().includes(search.toLowerCase())
      return matchesType && matchesStatus && matchesSearch
    })
  },

  // ── Wizard actions ─────────────────────────────────────────────────────────
  openWizard: () =>
    set({ wizard: { ...INITIAL_WIZARD, open: true } }),

  closeWizard: () =>
    set({ wizard: { ...INITIAL_WIZARD, open: false } }),

  resetWizard: () =>
    set({ wizard: { ...INITIAL_WIZARD, open: false } }),

  wizardNext: () =>
    set(s => ({
      wizard: { ...s.wizard, step: s.wizard.step + 1, direction: 1, testStatus: null, testMessage: '' }
    })),

  wizardBack: () =>
    set(s => ({
      wizard: { ...s.wizard, step: s.wizard.step - 1, direction: -1, testStatus: null, testMessage: '' }
    })),

  setWizardField: (field, value) =>
    set(s => ({ wizard: { ...s.wizard, [field]: value } })),

  setTestStatus: (testStatus, testMessage = '') =>
    set(s => ({ wizard: { ...s.wizard, testStatus, testMessage } })),

  // ── Credential test (no credential state stored) ──────────────────────────
  testCredentials: async () => {
    set(s => ({ wizard: { ...s.wizard, testStatus: 'testing', testMessage: '' } }))
    // Simulate API call — credentials are submitted directly, not held in state
    await new Promise(r => setTimeout(r, 1800))
    const pass = Math.random() > 0.2
    set(s => ({
      wizard: {
        ...s.wizard,
        testStatus: pass ? 'success' : 'error',
        testMessage: pass ? 'Connection verified successfully.' : 'Could not authenticate. Please check your credentials.',
      }
    }))
  },

  // ── Save connection (step 4 → 5) ──────────────────────────────────────────
  saveConnection: async () => {
    const { wizard } = get()
    set(s => ({ wizard: { ...s.wizard, saving: true } }))
    await new Promise(r => setTimeout(r, 1200))

    const newConn = {
      id:         `conn-${Date.now()}`,
      providerId: wizard.selectedProvider.id,
      name:       wizard.name || wizard.selectedProvider.name,
      type:       wizard.selectedProvider.type,
      status:     'active',
      scope:      wizard.scope,
      addedAt:    new Date().toISOString().split('T')[0],
      addedBy:    'vbagavan',
      lastUsed:   'Just now',
      callsToday: 0,
      callsWeek:  [0, 0, 0, 0, 0, 0, 0],
      health:     [{ check: 'Credentials verified', ok: true }],
      usedIn:     [],
      isPrivate:  wizard.isPrivate,
    }

    set(s => ({
      connections: [newConn, ...s.connections],
      wizard: { ...s.wizard, saving: false, step: 5, direction: 1, newConnectionId: newConn.id },
    }))
  },

  // ── Connection actions ──────────────────────────────────────────────────────
  deleteConnection: (id) =>
    set(s => ({ connections: s.connections.filter(c => c.id !== id) })),

  updateConnectionStatus: (id, status) =>
    set(s => ({
      connections: s.connections.map(c => c.id === id ? { ...c, status } : c)
    })),

  testConnection: async (id) => {
    set(s => ({
      connections: s.connections.map(c => c.id === id ? { ...c, status: 'pending' } : c)
    }))
    await new Promise(r => setTimeout(r, 1500))
    const pass = Math.random() > 0.15
    set(s => ({
      connections: s.connections.map(c =>
        c.id === id ? { ...c, status: pass ? 'active' : 'error' } : c
      )
    }))
  },

  // ── Detail panel ──────────────────────────────────────────────────────────
  openDetail: (connectionId) =>
    set({ detail: { open: true, connectionId, activeTab: 'overview' } }),

  closeDetail: () =>
    set({ detail: { open: false, connectionId: null, activeTab: 'overview' } }),

  setDetailTab: (tab) =>
    set(s => ({ detail: { ...s.detail, activeTab: tab } })),
}))
