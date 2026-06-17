import { CONNECTOR_LOGOS } from "@/components/features/knowledge/connectorLogos";
import { getProviderLogo } from "@/lib/connections/providerLogos";
import { getDbProviderLogo } from "@/lib/dbProviderLogos";

const API_PROVIDER_LOGOS = {
  rest: "/logos/providers/rest-api.svg",
  graphql: "/logos/providers/graphql.svg",
  openapi: "/logos/providers/openapi.svg",
  webhook: "/logos/providers/webhook.svg",
  custom: "/logos/providers/custom-mcp.svg",
};

const CLOUD_PROVIDER_LOGOS = {
  "google-drive": CONNECTOR_LOGOS.googleDrive,
  onedrive: CONNECTOR_LOGOS.onedrive,
  dropbox: CONNECTOR_LOGOS.dropbox,
  box: CONNECTOR_LOGOS.box,
  sharepoint: "/logos/connectors/sharepoint.svg",
  notion: "/logos/providers/notion.svg",
};

const ENTERPRISE_PROVIDER_LOGOS = {
  salesforce: "/logos/providers/salesforce.svg",
  jira: "/logos/providers/jira.svg",
  confluence: "/logos/providers/confluence.svg",
  sap: "/logos/providers/sap.svg",
  zendesk: "/logos/providers/zendesk.svg",
};

/** Brand logo for wizard provider tiles (API, DB, cloud, enterprise). */
export function getWizardProviderLogo(providerId) {
  if (!providerId) return null;

  return (
    API_PROVIDER_LOGOS[providerId]
    ?? getDbProviderLogo(providerId)
    ?? CLOUD_PROVIDER_LOGOS[providerId]
    ?? ENTERPRISE_PROVIDER_LOGOS[providerId]
    ?? getProviderLogo(providerId)
    ?? null
  );
}
