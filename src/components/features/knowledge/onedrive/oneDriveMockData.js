/** Mock data for the OneDrive connection prototype flow. */

export const ONEDRIVE_LOGO = "/logos/connectors/onedrive.svg";
export const GOOGLE_DRIVE_LOGO = "/logos/connectors/google-drive.svg";
export const AZIRON_LOGO = "/logo.svg";

export const CLOUD_ENVIRONMENTS = [
  { value: "commercial", label: "Commercial (Global)" },
  { value: "gcc", label: "US Government (GCC)" },
  { value: "gcc-high", label: "US Government (GCC High)" },
  { value: "dod", label: "US Department of Defense" },
  { value: "china", label: "China (21Vianet)" },
];

export const MOCK_ACCOUNTS = [
  {
    id: "personal",
    name: "Elisa Beckett",
    email: "elisa.g.beckett@gmail.com",
    initials: "EB",
    requiresAdmin: false,
  },
  {
    id: "work",
    name: "Elisa Beckett",
    email: "elisa.beckett@aziro.com",
    initials: "EB",
    requiresAdmin: true,
  },
];

export const MOCK_EXISTING_CONNECTIONS = [
  {
    id: "od-1",
    provider: "onedrive",
    name: "Elsa's OneDrive connection",
    connectedBy: "Elsa",
    connectedAt: "10 Dec 2025 12:00",
    accountEmail: "elisa.g.beckett@gmail.com",
  },
  {
    id: "od-2",
    provider: "onedrive",
    name: "Elisa's Work OneDrive connection",
    connectedBy: "Elisa",
    connectedAt: "3 Jan 2026 09:15",
    accountEmail: "elisa.beckett@aziro.com",
  },
];

export const MOCK_ONEDRIVE_FILES = [
  { id: "f1", name: "QuantumLeap.pdf", size: "7.4 MB", type: "file" },
  { id: "f2", name: "NebulaNova.txt", size: "12 KB", type: "file" },
  { id: "f3", name: "Processing", size: "—", type: "folder" },
  { id: "f4", name: "Team Runbooks", size: "—", type: "folder" },
  { id: "f5", name: "ReleaseNotes.docx", size: "240 KB", type: "file" },
  { id: "f6", name: "Architecture", size: "—", type: "folder" },
  { id: "f7", name: "Onboarding.pdf", size: "1.2 MB", type: "file" },
];

/** Personal Microsoft account — default picker set. */
export const MOCK_ONEDRIVE_FILES_PERSONAL = MOCK_ONEDRIVE_FILES;

/** Work Microsoft account — different folder listing. */
export const MOCK_ONEDRIVE_FILES_WORK = [
  { id: "w-f1", name: "Compliance-2025.pdf", size: "4.8 MB", type: "file" },
  { id: "w-f2", name: "TeamOKRs.xlsx", size: "1.1 MB", type: "file" },
  { id: "w-f3", name: "Legal", size: "—", type: "folder" },
  { id: "w-f4", name: "BoardDeck.pptx", size: "6.2 MB", type: "file" },
  { id: "w-f5", name: "HR Policies", size: "—", type: "folder" },
  { id: "w-f6", name: "VendorContracts.zip", size: "18 MB", type: "file" },
];

export const MOCK_ONEDRIVE_FILES_BY_CONNECTION = {
  "od-1": MOCK_ONEDRIVE_FILES_PERSONAL,
  "od-2": MOCK_ONEDRIVE_FILES_WORK,
};

export function getMockOneDriveFilesForConnection(connectionId) {
  if (connectionId && MOCK_ONEDRIVE_FILES_BY_CONNECTION[connectionId]) {
    return MOCK_ONEDRIVE_FILES_BY_CONNECTION[connectionId];
  }
  return MOCK_ONEDRIVE_FILES;
}

export function getOneDriveConnections(connections) {
  return (connections ?? []).filter((c) => c.provider === "onedrive");
}

export function formatConnectionLabel(connectionName, accountEmail) {
  const base = connectionName?.trim() || "Microsoft OneDrive";
  if (!accountEmail) return base;
  const local = accountEmail.split("@")[0];
  const short = local.split(".")[0];
  const name = short.charAt(0).toUpperCase() + short.slice(1);
  return `${name}'s ${base} connection`;
}
