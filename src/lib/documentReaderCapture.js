export function documentCaptureKey(file) {
  if (!file) return "unknown";
  if (file.isLibraryDocument) return `lib:${file.id}`;
  return `hub:${file.hubId}:${file.id}`;
}

export function loadDocumentNotes(documentKey) {
  try {
    const raw = localStorage.getItem(`doc-reader-notes-${documentKey}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDocumentNotes(documentKey, notes) {
  try {
    localStorage.setItem(`doc-reader-notes-${documentKey}`, JSON.stringify(notes));
  } catch {
    // Ignore quota / private-mode errors.
  }
}

export function getDefaultWorkspaceNodes() {
  return [
    { id: "node-insights", title: "Key Insights", items: [] },
    { id: "node-research", title: "Research Notes", items: [] },
    { id: "node-actions", title: "Action Items", items: [] },
    { id: "node-reports", title: "Reports", items: [] },
  ];
}

export function loadWorkspaceNodes(documentKey) {
  try {
    const raw = localStorage.getItem(`doc-reader-nodes-${documentKey}`);
    if (!raw) return getDefaultWorkspaceNodes();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultWorkspaceNodes();
  } catch {
    return getDefaultWorkspaceNodes();
  }
}

export function saveWorkspaceNodes(documentKey, nodes) {
  try {
    localStorage.setItem(`doc-reader-nodes-${documentKey}`, JSON.stringify(nodes));
  } catch {
    // Ignore quota / private-mode errors.
  }
}

export function buildReportMarkdown(content, { title, sourceLabel, fileName }) {
  const now = new Date().toLocaleString();
  const summary = content.length > 280 ? `${content.slice(0, 280).trim()}…` : content;
  return `# Report: ${title}

**Generated:** ${now}
**Source document:** ${fileName ?? "Document"}
**Context:** ${sourceLabel ?? "Reader view"}

---

## Executive Summary

${summary}

## Detailed Content

${content}

## Recommended Next Steps

- Review findings against the source material
- Share with collaborators or link to a Knowledge Hub
- Convert key sections into standalone notes or documents
`;
}

export function contentToTextFile(content, filename = "capture.txt") {
  const safeName = filename.endsWith(".txt") || filename.endsWith(".md")
    ? filename
    : `${filename}.md`;
  return new File([content], safeName, { type: "text/markdown" });
}

export function appendNodeItem(nodes, nodeId, item) {
  return nodes.map((node) =>
    node.id === nodeId
      ? {
          ...node,
          items: [
            {
              id: `item-${Date.now()}`,
              ...item,
              createdAt: new Date().toISOString(),
            },
            ...(node.items ?? []),
          ],
        }
      : node,
  );
}

export function mergeNotesToDocumentMarkdown(notes, { sourceDocumentName } = {}) {
  const compiledAt = new Date().toLocaleString();
  const docName = sourceDocumentName ?? "Document";
  const sections = (notes ?? [])
    .map((note, index) => {
      const heading = note.title?.trim() || `Note ${index + 1}`;
      const meta = note.sourceLabel ? `\n*Source: ${note.sourceLabel}*` : "";
      return `## ${index + 1}. ${heading}${meta}\n\n${note.body ?? ""}`;
    })
    .join("\n\n---\n\n");

  return `# Compiled notes — ${docName}

**Compiled:** ${compiledAt}
**Notes included:** ${notes?.length ?? 0}

---

${sections}
`;
}

export function mergeNodeItemsToDocumentMarkdown(nodeItems, { sourceDocumentName } = {}) {
  const compiledAt = new Date().toLocaleString();
  const docName = sourceDocumentName ?? "Document";
  const sections = (nodeItems ?? [])
    .map((item, index) => {
      const heading = item.nodeTitle?.trim() || `Workspace item ${index + 1}`;
      const meta = item.sourceLabel ? `\n*Source: ${item.sourceLabel}*` : "";
      return `## ${index + 1}. ${heading}${meta}\n\n${item.body ?? ""}`;
    })
    .join("\n\n---\n\n");

  return `# Compiled workspace nodes — ${docName}

**Compiled:** ${compiledAt}
**Workspace items included:** ${nodeItems?.length ?? 0}

---

${sections}
`;
}

export function mergeSelectionToDocumentMarkdown(
  { notes = [], nodeItems = [] },
  { sourceDocumentName } = {},
) {
  const compiledAt = new Date().toLocaleString();
  const docName = sourceDocumentName ?? "Document";
  const noteCount = notes?.length ?? 0;
  const nodeCount = nodeItems?.length ?? 0;
  const total = noteCount + nodeCount;

  const parts = [];

  if (noteCount > 0) {
    const noteSections = notes
      .map((note, index) => {
        const heading = note.title?.trim() || `Note ${index + 1}`;
        const meta = note.sourceLabel ? `\n*Source: ${note.sourceLabel}*` : "";
        return `### ${index + 1}. ${heading}${meta}\n\n${note.body ?? ""}`;
      })
      .join("\n\n---\n\n");
    parts.push(`## Saved notes\n\n${noteSections}`);
  }

  if (nodeCount > 0) {
    const nodeSections = nodeItems
      .map((item, index) => {
        const heading = item.nodeTitle?.trim() || `Workspace item ${index + 1}`;
        const meta = item.sourceLabel ? `\n*Source: ${item.sourceLabel}*` : "";
        return `### ${index + 1}. ${heading}${meta}\n\n${item.body ?? ""}`;
      })
      .join("\n\n---\n\n");
    parts.push(`## Workspace nodes\n\n${nodeSections}`);
  }

  return `# Compiled document — ${docName}

**Compiled:** ${compiledAt}
**Items included:** ${total} (${noteCount} note${noteCount === 1 ? "" : "s"}, ${nodeCount} workspace item${nodeCount === 1 ? "" : "s"})

---

${parts.join("\n\n---\n\n")}
`;
}
