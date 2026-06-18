import { create } from 'zustand'
import { CATALOG_PROVIDERS, MOCK_CONNECTIONS } from './constants.js'

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
  credentials:      {},         // field key → value (cleared on wizard reset)
  oauthAuthorized:  false,
  testStatus:       null,       // null | 'testing' | 'success' | 'error'
  testMessage:      '',
  saving:           false,
  newConnectionId:  null,       // set after successful creation
}

function providerCredentialsComplete(provider, credentials = {}) {
  if (!provider) return false
  if (provider.type === 'oauth') return true
  const fields = provider.fields ?? []
  return fields.every((field) => String(credentials[field.key] ?? '').trim().length > 0)
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

  openWizardWithProvider: (providerId) => {
    const selectedProvider = CATALOG_PROVIDERS.find((p) => p.id === providerId) ?? null
    set({
      wizard: {
        ...INITIAL_WIZARD,
        open: true,
        step: selectedProvider ? 2 : 1,
        selectedProvider,
        name: selectedProvider?.name ?? '',
      },
    })
  },

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

  setWizardCredential: (key, value) =>
    set(s => ({
      wizard: {
        ...s.wizard,
        credentials: { ...s.wizard.credentials, [key]: value },
        testStatus: null,
        testMessage: '',
        oauthAuthorized: false,
      },
    })),

  setTestStatus: (testStatus, testMessage = '') =>
    set(s => ({ wizard: { ...s.wizard, testStatus, testMessage } })),

  authorizeOAuth: async () => {
    const { wizard } = get()
    if (!wizard.selectedProvider) return
    set(s => ({
      wizard: {
        ...s.wizard,
        testStatus: 'testing',
        testMessage: '',
        oauthAuthorized: false,
      },
    }))
    await new Promise(r => setTimeout(r, 1200))
    set(s => ({
      wizard: {
        ...s.wizard,
        oauthAuthorized: true,
        testStatus: 'success',
        testMessage: 'Authorization simulated — ready to save.',
      },
    }))
  },

  // ── Credential test (no credential state stored after save) ─────────────────
  testCredentials: async () => {
    const { wizard } = get()
    const provider = wizard.selectedProvider
    if (!providerCredentialsComplete(provider, wizard.credentials)) {
      set(s => ({
        wizard: {
          ...s.wizard,
          testStatus: 'error',
          testMessage: 'Fill in all required credential fields before testing.',
        },
      }))
      return
    }

    set(s => ({ wizard: { ...s.wizard, testStatus: 'testing', testMessage: '' } }))
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
    const provider = wizard.selectedProvider
    const isOauth = provider?.type === 'oauth'
    if (isOauth && !wizard.oauthAuthorized) return
    if (!isOauth && wizard.testStatus !== 'success') return

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
      wizard: {
        ...INITIAL_WIZARD,
        open: true,
        step: 5,
        direction: 1,
        selectedProvider: wizard.selectedProvider,
        name: wizard.name,
        isPrivate: wizard.isPrivate,
        scope: wizard.scope,
        newConnectionId: newConn.id,
      },
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

  reauthenticateConnection: async (id) => {
    await get().testConnection(id)
  },

  // ── Detail panel ──────────────────────────────────────────────────────────
  openDetail: (connectionId, activeTab = 'overview') =>
    set({ detail: { open: true, connectionId, activeTab } }),

  closeDetail: () =>
    set({ detail: { open: false, connectionId: null, activeTab: 'overview' } }),

  setDetailTab: (tab) =>
    set(s => ({ detail: { ...s.detail, activeTab: tab } })),
}))

export { providerCredentialsComplete }
