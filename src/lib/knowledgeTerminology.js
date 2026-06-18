/** Canonical user-facing labels for Knowledge / Documents surfaces. */
export const KNOWLEDGE_TERMS = {
  sidebarGroup: "Knowledge",
  hubs: "Knowledge Hubs",
  hubSingular: "Knowledge Hub",
  documents: "Documents",
  /** Hub control center tab — distinct from top-level Documents library tab. */
  hubSourcesTab: "Hub sources",
  /** Hub control center tab — create AI outputs and browse saved assets. */
  hubStudioTab: "Studio",
  /** @deprecated Merged into hubStudioTab */
  hubGeneratedAssetsTab: "Generated assets",
  libraryView: "Library",
  controlCenter: "Control Center",
  knowledgeHelpLabel: "Knowledge help",
  insightsTab: "Insights",
  documentsDescription: "Central file library",
  hubsDescription: "Curated collections for agents",
  documentsPageDescription:
    "Upload once, link to hubs. Files can belong to multiple hubs; each database or API belongs to one hub only.",
  documentsLearnMore: "How linking works",
  /** Shown when a library source has no hub links. */
  sourceNotLinked: "Not linked",
  singleHubSourceRule:
    "Files can link to multiple Knowledge Hubs. Each database and API belongs to one hub only.",
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
  uploadSkippedTitle: "Already linked to this hub",
  uploadSkippedDescription:
    "These files are already sources in this hub. Close to continue, or pick files that are not linked yet.",
  uploadReadyHint: "Review your selection below, then confirm to add sources to this hub.",
  uploadingSources: "Adding sources…",
  createHubStepAddSources: "Add sources",
  createHubStepNameHub: "Name your hub",
  continueWithoutSources: "Continue without sources",
  createKnowledgeHub: "Create Knowledge Hub",
  createHubSourcesHint: "You can add more files anytime on the hub page.",
  /** Step 2 review card — replaces "Attachment summary". */
  sourcesIncluded: "Sources included",
  createHubSourcesIncludedDescription:
    "These sources will be linked to your library and this hub when you create it.",
  createHubNameRequiredHint: "Enter a hub name to continue",
  createHubStep2Description: "Give your hub a name. Review included sources below.",
  createHubSourcesReadyInLibrary: "ready in library",
  createHubCloudLinksPending: "cloud link(s) — finish saving from the hub page after create",
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
