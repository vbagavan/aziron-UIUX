/** Agent publish scope — org-wide vs cross-tenant marketplace listing. */

export const PUBLISH_SCOPES = {
  PRIVATE: "private",
  ORG: "org",
  MARKETPLACE: "marketplace",
};

export function getAgentPublishScope(agent) {
  if (agent?.publishScope) return agent.publishScope;
  return agent?.visibility === "public" ? PUBLISH_SCOPES.ORG : PUBLISH_SCOPES.PRIVATE;
}

export function isAgentPublished(agent) {
  const scope = getAgentPublishScope(agent);
  return scope === PUBLISH_SCOPES.ORG || scope === PUBLISH_SCOPES.MARKETPLACE;
}

export function isAgentMarketplaceListed(agent) {
  return getAgentPublishScope(agent) === PUBLISH_SCOPES.MARKETPLACE;
}

export function agentPublishScopePatch(scope) {
  if (scope === PUBLISH_SCOPES.PRIVATE) {
    return { publishScope: PUBLISH_SCOPES.PRIVATE, visibility: "private" };
  }
  return { publishScope: scope, visibility: "public" };
}

export function unpublishScopeMessage(agent, orgName = "your organization") {
  const scope = getAgentPublishScope(agent);
  if (scope === PUBLISH_SCOPES.MARKETPLACE) {
    return `${agent?.name ?? "This agent"} will be removed from the Marketplace and hidden from other organizations. Your workspace copy stays private.`;
  }
  return `${agent?.name ?? "This agent"} will be hidden from other users in ${orgName} and no longer listed as public.`;
}

export function publishSuccessMessage(agentName, scope, orgName = "your organization") {
  if (scope === PUBLISH_SCOPES.MARKETPLACE) {
    return `"${agentName}" is live on the Marketplace for all organizations.`;
  }
  return `"${agentName}" is published to ${orgName}.`;
}
