import { CONNECTOR_LOGOS } from "@/components/features/knowledge/connectorLogos";
import { getProviderLogo } from "@/lib/connections/providerLogos";

/** Popular connectors shown in the Add sources menu. */
export const HUB_POPULAR_CONNECTORS = [
  {
    id: "google-drive",
    label: "Google Drive",
    logo: CONNECTOR_LOGOS.googleDrive,
    flow: "hub-wizard",
    enabled: true,
  },
  {
    id: "onedrive",
    label: "OneDrive",
    logo: CONNECTOR_LOGOS.onedrive,
    flow: "hub-wizard",
    enabled: true,
    recommended: true,
  },
  {
    id: "sharepoint",
    label: "SharePoint",
    logo: getProviderLogo("sharepoint"),
    flow: "integrations-wizard",
    catalogId: "sharepoint",
    enabled: false,
  },
  {
    id: "dropbox",
    label: "Dropbox",
    logo: CONNECTOR_LOGOS.dropbox,
    flow: "integrations-wizard",
    catalogId: "dropbox",
    enabled: false,
  },
  {
    id: "aws-s3",
    label: "AWS S3",
    logo: getProviderLogo("aws-s3"),
    flow: "integrations-wizard",
    catalogId: "aws-s3",
    enabled: true,
  },
  {
    id: "salesforce",
    label: "Salesforce",
    logo: getProviderLogo("salesforce"),
    flow: "integrations-wizard",
    catalogId: "salesforce",
    enabled: true,
  },
];

/** Cloud file connectors supported inline during hub / library upload (no extra modal). */
export const HUB_FILE_CLOUD_CONNECTORS = HUB_POPULAR_CONNECTORS.filter(
  (c) => c.flow === "hub-wizard" && c.enabled,
);

export const HUB_CUSTOM_CONNECTOR_CATALOG_ID = "custom-mcp";
