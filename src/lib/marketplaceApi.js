/** Base URL for all marketplace API calls. Set VITE_API_BASE_URL in .env */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

async function apiFetch(path, options = {}) {
  const { headers: extraHeaders, ...rest } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...extraHeaders },
    ...rest,
  });

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail)  message = body.detail;
      else if (body?.message) message = body.message;
    } catch { /* ignore parse error */ }
    throw new Error(message);
  }

  return res.json();
}

/**
 * GET /api/v1/agents/public
 * @param {{ search?: string, limit?: number, offset?: number }} params
 * @returns {Promise<{ items: object[], metadata: { total_items: number, offset: number, limit: number } }>}
 */
export function fetchPublicAgents({ search = "", limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (search.trim()) params.set("search", search.trim());
  return apiFetch(`/api/v1/agents/public?${params}`);
}

/**
 * POST /api/v1/agents/{agentId}/fork
 * @param {string} agentId
 * @param {{ name: string, description?: string }} body
 * @returns {Promise<object>} the created forked agent
 */
export function forkAgent(agentId, body) {
  return apiFetch(`/api/v1/agents/${agentId}/fork`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
