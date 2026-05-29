/** Mock data for the Google Drive connection prototype flow. */

export const GOOGLE_DRIVE_LOGO = "/logos/connectors/google-drive.svg";
export const AZIRON_LOGO = "/logo.svg";

export const GOOGLE_AUTH_OPTIONS = [
  {
    value: "default",
    title: "OAuth2 (Recommended)",
    description:
      "Quickly connect using Aziron's preconfigured Google OAuth app. No setup required.",
  },
  {
    value: "custom",
    title: "Custom OAuth2 App (Advanced)",
    description:
      "Connect using your own Google Cloud OAuth client ID and secret.",
  },
];

export const MOCK_GOOGLE_ACCOUNTS = [
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

export const MOCK_GOOGLE_EXISTING_CONNECTIONS = [
  {
    id: "gd-1",
    provider: "google-drive",
    name: "Elsa's Google Drive connection",
    connectedBy: "Elsa",
    connectedAt: "18 Nov 2025 12:00",
  },
];

export const MOCK_GOOGLE_DRIVE_FILES = [
  { id: "gd-f1", name: "ProductRoadmap.gslides", size: "2.1 MB", type: "file" },
  { id: "gd-f2", name: "CustomerFAQ.docx", size: "340 KB", type: "file" },
  { id: "gd-f3", name: "Shared with team", size: "—", type: "folder" },
  { id: "gd-f4", name: "BrandAssets", size: "—", type: "folder" },
  { id: "gd-f5", name: "PricingSheet.xlsx", size: "890 KB", type: "file" },
  { id: "gd-f6", name: "Engineering", size: "—", type: "folder" },
  { id: "gd-f7", name: "SecurityPolicy.pdf", size: "4.8 MB", type: "file" },
];

export function formatGoogleConnectionLabel(connectionName, accountEmail) {
  const base = connectionName?.trim() || "Google Drive";
  if (!accountEmail) return base;
  const local = accountEmail.split("@")[0];
  const short = local.split(".")[0];
  const name = short.charAt(0).toUpperCase() + short.slice(1);
  return `${name}'s ${base} connection`;
}
