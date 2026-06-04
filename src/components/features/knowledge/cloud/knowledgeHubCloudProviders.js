import { CONNECTOR_LOGOS } from "@/components/features/knowledge/connectorLogos";

/**
 * Cloud storage providers available when adding sources to a Knowledge Hub.
 * Set `enabled: true` when the connect / file-picker flow is wired for that id.
 */
export const KNOWLEDGE_HUB_CLOUD_PROVIDERS = [
  {
    id: "onedrive",
    label: "OneDrive",
    logo: CONNECTOR_LOGOS.onedrive,
    enabled: true,
    recommended: true,
  },
  {
    id: "google-drive",
    label: "Google Drive",
    logo: CONNECTOR_LOGOS.googleDrive,
    enabled: true,
  },
  {
    id: "dropbox",
    label: "Dropbox",
    logo: CONNECTOR_LOGOS.dropbox,
    enabled: false,
  },
  {
    id: "box",
    label: "Box",
    logo: CONNECTOR_LOGOS.box,
    enabled: false,
  },
];

export function getKnowledgeHubCloudProvider(providerId) {
  return KNOWLEDGE_HUB_CLOUD_PROVIDERS.find((p) => p.id === providerId);
}

export function getKnowledgeHubCloudProviderLabel(providerId) {
  return getKnowledgeHubCloudProvider(providerId)?.label ?? providerId;
}
