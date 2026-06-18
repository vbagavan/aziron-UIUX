/** Settings URL helpers for the workspace Connectors registry. */

export const CONNECTORS_SECTION = "connectors";

export function connectorsSettingsPath({ openNew = false, providerId = null } = {}) {
  const params = new URLSearchParams({ section: CONNECTORS_SECTION });
  if (openNew) params.set("new", "1");
  if (providerId) params.set("provider", providerId);
  return `/settings?${params.toString()}`;
}

/**
 * Navigate to Settings → Connectors and optionally open the connection wizard.
 * Requires `navigate` from react-router and store actions from useConnectionsStore.
 */
export function goToConnectorsCatalog(
  navigate,
  { openNew = false, providerId = null, openWizard, openWizardWithProvider } = {},
) {
  if (providerId && openWizardWithProvider) {
    openWizardWithProvider(providerId);
  } else if (openNew && openWizard) {
    openWizard();
  }
  navigate(connectorsSettingsPath({ openNew: openNew && !providerId, providerId }));
}
