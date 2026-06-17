/** Canonical user-facing labels for Knowledge / Documents surfaces. */
export const KNOWLEDGE_TERMS = {
  sidebarGroup: "Knowledge",
  hubs: "Knowledge Hubs",
  hubSingular: "Knowledge Hub",
  documents: "Documents",
  /** Hub control center tab — distinct from top-level Documents library tab. */
  hubSourcesTab: "Sources in hub",
  libraryView: "Library",
  controlCenter: "Control Center",
  knowledgeHelpLabel: "Knowledge help",
  insightsTab: "Insights",
  documentsDescription: "Central file library",
  hubsDescription: "Curated collections for agents",
  documentsPageDescription:
    "Upload once, link to any hub. Files added directly to a hub also appear here.",
  documentsLearnMore: "How linking works",
  addSources: "Add sources",
  fromComputer: "From your computer",
  fromCloudStorage: "From cloud storage",
  selectedSources: "Selected sources",
  addToSelection: "Add to selection",
  backToConnections: "Back to connections",
  browseFiles: "Browse files",
  selectFilesPrompt: "Select files or drag and drop",
  addSourcesDescriptionLibrary:
    "Add files from your computer or connected cloud storage. Link documents to Knowledge Hubs anytime from the Documents page or reader view.",
  addSourcesDescriptionHub:
    "Files are saved to your central library and linked to this hub automatically — one copy, visible in both Documents and Knowledge Hub.",
  viewInDocuments: "View in Documents",
  uploadComplete: "Sources added",
  uploadCompleteDescription: "Your files are ready in the document library.",
  uploadFailed: "Some uploads failed",
  uploadFailedDescription: "Retry failed files or close and try again.",
  uploadingSources: "Adding sources…",
};

export function addSourcesDialogTitle({ hubName } = {}) {
  if (hubName) {
    return `Add sources to ${hubName}`;
  }
  return `Add sources to ${KNOWLEDGE_TERMS.documents}`;
}

export function addSourcesConfirmLabel(count, { hub = false } = {}) {
  if (count <= 0) {
    return "Select sources to add";
  }
  if (hub) {
    return count === 1 ? "Add 1 source to hub" : `Add ${count} sources to hub`;
  }
  return count === 1 ? "Add 1 source" : `Add ${count} sources`;
}
