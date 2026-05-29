/**
 * Resolve which template(s) the UI should show based on prompt-box attachment.
 */
export function resolvePromptTemplateSelection(catalog, promptContextFileIds, activeTemplate) {
  const all = catalog ?? [];
  const ids = promptContextFileIds ?? [];

  if (ids.length > 0) {
    const templates = all.filter((t) => ids.includes(t.id));
    const templateId = ids.includes(activeTemplate)
      ? activeTemplate
      : ids[ids.length - 1];
    return { templateId, templates };
  }

  return { templateId: null, templates: [] };
}

/** Template id for the main card canvas (falls back before any prompt attachment). */
export function resolveCanvasTemplateId(
  promptContextFileIds,
  activeTemplate,
  recommendedTemplateId,
  fallbackId,
) {
  const ids = promptContextFileIds ?? [];
  if (ids.length > 0) {
    if (ids.includes(activeTemplate)) return activeTemplate;
    return ids[ids.length - 1];
  }
  return activeTemplate ?? recommendedTemplateId ?? fallbackId;
}
