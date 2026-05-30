/**
 * Helpers for agent label search, filtering, and agent cleanup.
 */

/** Count agents assigned a label id. */
export function countAgentsWithLabel(agents, labelId) {
  return agents.filter(a => (a.labels ?? []).includes(labelId)).length
}

/** Remove a label id from every agent (returns new array). */
export function stripLabelFromAgents(agents, labelId) {
  return agents.map(a => {
    const labels = a.labels ?? []
    if (!labels.includes(labelId)) return a
    return { ...a, labels: labels.filter(id => id !== labelId) }
  })
}

/**
 * Search agents by name, description, or assigned label names.
 * @param {object} agent
 * @param {string} query
 * @param {(id: string) => { name?: string } | undefined} getLabel
 */
export function agentMatchesSearch(agent, query, getLabel) {
  const q = query.trim().toLowerCase()
  if (!q) return true

  if (agent.name?.toLowerCase().includes(q)) return true
  if (agent.description?.toLowerCase().includes(q)) return true

  return (agent.labels ?? []).some(id => {
    const name = getLabel(id)?.name?.toLowerCase()
    return name?.includes(q)
  })
}

/**
 * @param {'any' | 'all'} mode — any = OR, all = AND
 */
export function agentMatchesLabelFilter(agent, labelFilters, mode = 'any') {
  if (!labelFilters.length) return true
  const agentLabels = agent.labels ?? []
  if (mode === 'all') return labelFilters.every(id => agentLabels.includes(id))
  return labelFilters.some(id => agentLabels.includes(id))
}
