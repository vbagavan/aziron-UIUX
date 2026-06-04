import { CONNECTOR_LOGOS } from "@/components/features/knowledge/connectorLogos";
import { getKnowledgeHubCloudProvider } from "@/components/features/knowledge/cloud/knowledgeHubCloudProviders";
import {
  getMockOneDriveFilesForConnection,
  getOneDriveConnections,
  MOCK_EXISTING_CONNECTIONS,
  MOCK_ONEDRIVE_FILES,
  ONEDRIVE_LOGO,
} from "@/components/features/knowledge/onedrive/oneDriveMockData";
import {
  GOOGLE_DRIVE_LOGO,
  MOCK_GOOGLE_DRIVE_FILES,
  MOCK_GOOGLE_EXISTING_CONNECTIONS,
} from "@/components/features/knowledge/googledrive/googleDriveMockData";

export const CLOUD_PROVIDER_CONFIG = {
  onedrive: {
    id: "onedrive",
    label: "OneDrive",
    logo: ONEDRIVE_LOGO,
    connectorLogo: CONNECTOR_LOGOS.onedrive,
    defaultConnectionName: "Microsoft OneDrive",
    mockFiles: MOCK_ONEDRIVE_FILES,
    getMockFilesForConnection: getMockOneDriveFilesForConnection,
    mockConnections: getOneDriveConnections(MOCK_EXISTING_CONNECTIONS),
    signInTitle: "Sign in with Microsoft",
    accountPickerTitle: "Sign in with Microsoft",
  },
  "google-drive": {
    id: "google-drive",
    label: "Google Drive",
    logo: GOOGLE_DRIVE_LOGO,
    connectorLogo: CONNECTOR_LOGOS.googleDrive,
    defaultConnectionName: "Google Drive",
    mockFiles: MOCK_GOOGLE_DRIVE_FILES,
    mockConnections: MOCK_GOOGLE_EXISTING_CONNECTIONS,
    signInTitle: "Sign in with Google",
    accountPickerTitle: "Sign in with Google",
  },
};

export function getCloudProviderConfig(provider) {
  if (CLOUD_PROVIDER_CONFIG[provider]) {
    return CLOUD_PROVIDER_CONFIG[provider];
  }
  const hubProvider = getKnowledgeHubCloudProvider(provider);
  return {
    id: provider,
    label: hubProvider?.label ?? provider,
    logo: hubProvider?.logo,
    connectorLogo: hubProvider?.logo,
    defaultConnectionName: hubProvider?.label ?? "Cloud storage",
    mockFiles: [],
    mockConnections: [],
    signInTitle: `Connect ${hubProvider?.label ?? "cloud storage"}`,
    accountPickerTitle: `Connect ${hubProvider?.label ?? "cloud storage"}`,
  };
}
