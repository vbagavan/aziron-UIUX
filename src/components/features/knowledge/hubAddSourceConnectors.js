import { CONNECTOR_LOGOS } from "@/components/features/knowledge/connectorLogos";
import { getProviderLogo } from "@/lib/connections/providerLogos";

/** Popular connectors shown in the Add sources menu. */
export const HUB_POPULAR_CONNECTORS = [
  {
    id: "google-drive",
    label: "Google Workspace",
    logo: CONNECTOR_LOGOS.googleDrive,
    flow: "hub-wizard",
    enabled: true,
  },
  {
    id: "onedrive",
    label: "Microsoft 365",
    logo: CONNECTOR_LOGOS.onedrive,
    flow: "hub-wizard",
    enabled: true,
    recommended: true,
  },
  {
    id: "aws-s3",
    label: "AWS",
    logo: getProviderLogo("aws-s3"),
    flow: "integrations-wizard",
    catalogId: "aws-s3",
    enabled: true,
  },
  {
    id: "jira",
    label: "Atlassian",
    logo: getProviderLogo("jira"),
    flow: "integrations-wizard",
    catalogId: "jira",
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

export const HUB_CUSTOM_CONNECTOR_CATALOG_ID = "custom-mcp";
