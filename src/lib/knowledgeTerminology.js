/** Canonical user-facing labels for Knowledge / Documents surfaces. */
export const KNOWLEDGE_TERMS = {
  sidebarGroup: "Knowledge",
  hubs: "Knowledge Hubs",
  hubSingular: "Knowledge Hub",
  documents: "Documents",
  /** Hub control center — sources inventory tab. */
  hubSourcesTab: "Sources",
  /** Hub control center — create AI outputs and browse saved assets. */
  hubStudioTab: "Studio",
  /** @deprecated Merged into hubStudioTab */
  hubGeneratedAssetsTab: "Generated assets",
  /** Hub control center — activity log tab. */
  hubTimelineTab: "Activity",
  libraryView: "Library",
  controlCenter: "Control Center",
  knowledgeHelpLabel: "Knowledge help",
  insightsTab: "Insights",
  documentsDescription: "Central source library",
  hubsDescription: "Curated collections for agents",
  documentsPageDescription:
    "Your organization's file, database, and API library. Upload once, then link sources to Knowledge Hubs for agents and workflows.",
  documentsLearnMore: "How linking works",
  /** Shown when a library source has no hub links. */
  sourceNotLinked: "Not in a hub",
  singleHubSourceRule:
    "Files can belong to many hubs. Databases and APIs can belong to one hub each.",
  addSources: "Add sources",
  addSource: "Add sources",
  fromComputer: "From your computer",
  fromCloudStorage: "From cloud storage",
  selectedSources: "Selected sources",
  addToSelection: "Add to selection",
  cloudPickerImmediateHint: "Select files to add them instantly",
  cloudPickerAddedHint: "Added files appear in your selection below",
  cloudBreadcrumbConnections: "Connections",
  cloudBreadcrumbConnectProvider: "Connect cloud storage",
  backToConnections: "Back to connections",
  browseFiles: "Browse files",
  selectFilesPrompt: "Select files or drag and drop",
  addSourcesDescriptionLibrary:
    "Add files from your computer or connected cloud storage. Link sources to Knowledge Hubs anytime from Documents or a source detail view.",
  addSourcesDescriptionHub:
    "Files are saved to your central library and linked to this hub automatically — one copy, visible in both Documents and the hub.",
  viewInDocuments: "View in Documents",
  uploadComplete: "Sources added",
  uploadCompleteDescription: "Your files are ready in Documents.",
  uploadFailed: "Some uploads failed",
  uploadFailedDescription: "Retry failed files or close and try again.",
  uploadSkippedTitle: "Already in this hub",
  uploadSkippedDescription:
    "These files are already in this hub. Close to continue, or pick files that are not linked yet.",
  uploadReadyHint: "Review your selection below, then confirm to add sources to this hub.",
  uploadingSources: "Adding sources…",
  createHubStepAddSources: "Add sources",
  createHubStepNameHub: "Name your hub",
  createHubStep1Description:
    "Add sources now, or skip and add them from the hub page later.",
  continueWithoutSources: "Continue without sources",
  createKnowledgeHub: "Create Knowledge Hub",
  createHubSourcesHint: "You can add more files anytime on the hub page.",
  sourcesIncluded: "Sources included",
  createHubSourcesIncludedDescription:
    "These sources will be linked to your library and this hub when you create it.",
  createHubNameRequiredHint: "Enter a hub name to continue",
  createHubStep2Description: "Give your hub a name. Review included sources below.",
  createHubSourcesReadyInLibrary: "ready in library",
  createHubCloudLinksPending: "cloud link(s) — finish saving from the hub page after create",
  hubSourcesEmptyTitle: "No sources in this hub yet",
  hubSourcesEmptyDescription:
    "Add files, databases, or APIs from your library or connect new sources.",
  sourcesEmptyFilesTitle: "No files yet",
  sourcesEmptyFilesDescription: "Upload from your computer or cloud storage, or link from a hub.",
  sourcesEmptyDbsTitle: "No databases yet",
  sourcesEmptyDbsDescription: "Connect a database and pick tables, views, or collections.",
  sourcesEmptyApisTitle: "No connections yet",
  sourcesEmptyApisDescription:
    "Add a REST or GraphQL endpoint, or register a webhook. Aziron indexes responses so agents can use them.",
  wizardCategoryFootnote: "Same categories as All Sources filters.",
  wizardBrowseConnectorsLeaveTitle: "Leave setup?",
  wizardBrowseConnectorsLeaveMessage:
    "You'll go to Connectors to register integrations. Progress in this wizard is not saved.",
  wizardExpressDefaultsTitle: "Using recommended settings",
  wizardDemoHintShort: "Demo: connections are simulated. Nothing is sent to a server.",
  successStatSources: "Sources added",
  successStatRowsReady: "Rows ready for search",
  successStatItemsReady: "Items ready for search",
  successStatFilesReady: "Files ready for search",
  successHubDisabledHint: "Added to All Sources only — link to a hub from the library.",
  sourcesEmptyAllTitle: "No sources yet",
  sourcesEmptyAllDescription:
    "Upload files or connect cloud storage. Link anything here to a Knowledge Hub when you're ready.",
  sourcesEmptyLibraryTitle: "No sources yet",
  sourcesEmptyLibraryDescription:
    "Upload files or connect cloud storage. Link anything here to a Knowledge Hub when you're ready.",
  filterAllFiles: "All files",
  filterUploaded: "Uploaded",
  filterFromCloud: "From cloud",
  sourcePreviewTab: "Source file",
  askAiSearchingChapter: "Searching: This chapter",
  askAiSearchingDatabase: "Searching: This database",
  askAiSearchingApi: "Searching: This API",
  askAiSearchingHubAll: "Searching: All hub sources",
  askAiSearchingHubFocused: "Searching: Focused source",
  hubAssistantEmptySources: "Add a source to start asking questions.",
  hubAssistantChatNotSaved: "This chat isn't saved. Save answers in Notes.",
  demoModeHint: "Demo: connections are simulated. Nothing is sent to a server.",
  addSourceSuccessTitle: "Source added",
  addSourceSuccessDescription: "Your source is in Documents and ready to link to hubs.",
  fileRemoveFromHubNote:
    "This file is managed in its hub. Removing it here removes it from the hub only—not from Documents.",
  linkingHelpStep3: "Linked sources stay in Documents and appear in that hub's Sources list.",
  toastAlreadyInHub: "Already in this hub",
  toastCouldNotAddSource: "Couldn't add source",
  toastHubNotFound: "This hub doesn't exist or was deleted",
  browseAllConnectorsTitle: "Browse all connectors",
  browseAllConnectorsDescription:
    "Manage workspace connections in Settings → Connectors",
  customConnectorTitle: "Custom connector",
  customConnectorDescription: "Connect an MCP server or custom integration",
  wizardDiscardTitle: "Discard progress?",
  wizardDiscardMessage: "You have unsaved progress. Close without finishing?",
  connectorsSettingsDescription:
    "Workspace integrations used by agents, flows, and Knowledge sources.",
  connectorsRegistryHint:
    "Register connections here, then add them as sources from Documents or a Knowledge Hub.",
  connectorsEmptyDescription:
    "Register OAuth, API, and MCP connections. Then add them as sources from Documents.",
  connectorsDemoHint: "Demo: connections and tests are simulated. Nothing is sent to a server.",
  connectorSuccessHandoffDocuments: "Add as source in Documents",
  connectorSuccessHandoffHub: "Open Knowledge Hubs",
  oauthAuthorizeSuccess: "Authorization simulated — ready to save.",
};

export function sourcesCountLabel(count, category = "all") {
  const n = Number(count) || 0;
  const word =
    category === "files"
      ? "file"
      : category === "dbs"
        ? "database source"
        : category === "apis"
          ? "other source"
          : "source";
  const plural =
    category === "files"
      ? "files"
      : category === "dbs"
        ? "database sources"
        : category === "apis"
          ? "other sources"
          : "sources";
  return n === 1 ? `1 ${word}` : `${n} ${plural}`;
}

export function getSourceEmptyStateCopy(category = "all", { variant = "library" } = {}) {
  if (variant === "hub") {
    return {
      title: KNOWLEDGE_TERMS.hubSourcesEmptyTitle,
      description: KNOWLEDGE_TERMS.hubSourcesEmptyDescription,
    };
  }
  if (category === "files") {
    return {
      title: KNOWLEDGE_TERMS.sourcesEmptyFilesTitle,
      description: KNOWLEDGE_TERMS.sourcesEmptyFilesDescription,
    };
  }
  if (category === "dbs") {
    return {
      title: KNOWLEDGE_TERMS.sourcesEmptyDbsTitle,
      description: KNOWLEDGE_TERMS.sourcesEmptyDbsDescription,
    };
  }
  if (category === "apis") {
    return {
      title: KNOWLEDGE_TERMS.sourcesEmptyApisTitle,
      description: KNOWLEDGE_TERMS.sourcesEmptyApisDescription,
    };
  }
  return {
    title: KNOWLEDGE_TERMS.sourcesEmptyAllTitle,
    description: KNOWLEDGE_TERMS.sourcesEmptyAllDescription,
  };
}

export function addSourcesDialogTitle({ hubName } = {}) {
  if (hubName) {
    return `Add sources to ${hubName}`;
  }
  return `Add sources to ${KNOWLEDGE_TERMS.documents}`;
}

export function cloudBreadcrumbBrowseLabel(providerLabel) {
  return `Browse ${providerLabel}`;
}

export function cloudFileAddedToast(fileName) {
  return `Added ${fileName}`;
}

export function cloudFilesAddedToast(count) {
  return `Added ${count} file${count === 1 ? "" : "s"}`;
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
