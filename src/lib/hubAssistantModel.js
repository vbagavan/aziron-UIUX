import {
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Layers,
  Network,
} from "lucide-react";

export const HUB_STUDIO_TOOLS = [
  { id: "summary", label: "Summary", icon: FileText, className: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  { id: "mindmap", label: "Mind Map", icon: Network, className: "bg-rose-500/10 text-rose-700 dark:text-rose-300" },
  { id: "flashcards", label: "Flashcards", icon: Layers, className: "bg-amber-500/10 text-amber-800 dark:text-amber-300" },
  { id: "report", label: "Report", icon: ClipboardList, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  { id: "datatable", label: "Data Table", icon: FileSpreadsheet, className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" },
];

export function mockHubAssistantReply(question, hubName, selectedFiles) {
  const q = question.trim().toLowerCase();
  if (!q) return { content: "Ask a question about the documents in this hub.", citations: [] };
  if (selectedFiles.length === 0) {
    return { content: "Add at least one source to this hub, then ask your question.", citations: [] };
  }

  const citations = selectedFiles.slice(0, 3).map((file, i) => ({
    index: i + 1,
    fileId: file.id,
    name: file.name,
  }));

  let answer = "";
  if (q.includes("summary") || q.includes("summarize") || q.includes("overview")) {
    answer = `Based on ${selectedFiles.length} source${selectedFiles.length === 1 ? "" : "s"} in "${hubName}":\n\nThe documents collectively cover onboarding procedures, product specifications, and operational runbooks. Key highlights include step-by-step onboarding guides for new team members, detailed feature specs for the core platform, and incident response playbooks.`;
  } else if (q.includes("what") || q.includes("explain") || q.includes("describe")) {
    answer = `From the selected sources in "${hubName}", here is a concise explanation:\n\nThe documents address the topic you asked about across ${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"}. Key passages highlight the main concepts, definitions, and context relevant to your question.`;
  } else if (q.includes("how")) {
    answer = `Based on the procedural documentation in "${hubName}":\n\n1. Review the relevant section in your source documents.\n2. Follow the step-by-step instructions outlined in the guides.\n3. Refer to the runbooks for any operational specifics.\n\nThe selected sources provide detailed guidance on this process.`;
  } else if (q.includes("list") || q.includes("what are") || q.includes("examples")) {
    answer = `Here are the key items from the selected sources in "${hubName}":\n\n• Item identified from ${selectedFiles[0]?.name ?? "Source 1"}\n• Related concept from the documentation\n• Cross-referenced finding across ${selectedFiles.length} source${selectedFiles.length === 1 ? "" : "s"}\n• Additional context from supporting documents`;
  } else {
    answer = `Based on ${selectedFiles.length} selected source${selectedFiles.length === 1 ? "" : "s"} in "${hubName}":\n\n• Key themes from your documents align with the topic you asked about.\n• Cross-referencing the uploaded files surfaces the most relevant passages for agent retrieval.\n• The sources provide context, definitions, and procedural guidance on this topic.`;
  }

  const citeStr = citations.map((c) => `[${c.index}]`).join("");
  return { content: `${answer} ${citeStr}`, citations };
}

export function generateHubStudioContent(toolId, hubName, selectedFiles, customPrompt = "") {
  const fileNames = selectedFiles.map((f) => f.name).join(", ") || "all sources";
  const count = selectedFiles.length || 1;
  const toolLabel = HUB_STUDIO_TOOLS.find((t) => t.id === toolId)?.label ?? "Studio Output";

  let content = "";
  switch (toolId) {
    case "summary":
      content = `# Executive Summary — ${hubName}

**Sources analysed:** ${count} file${count === 1 ? "" : "s"} (${fileNames})

## Overview
This hub contains documentation covering key operational and product topics.

## Key Themes
- **Onboarding & Orientation** — Guides for new team members.
- **Product Features** — Platform capabilities and changelogs.
- **Operational Playbooks** — Incident response and deployment runbooks.`;
      break;
    case "flashcards":
      content = `# Flashcards — ${hubName}

**Card 1**
Front: What is the first milestone for a new team member?
Back: Complete tool access setup and review the onboarding checklist.`;
      break;
    case "report":
      content = `# Knowledge Audit Report — ${hubName}
**Sources:** ${count} file${count === 1 ? "" : "s"}
**Date:** ${new Date().toLocaleDateString()}

## Executive Summary
This report audits content quality and retrieval readiness for "${hubName}".`;
      break;
    case "datatable":
      content = `# Extracted Data Table — ${hubName}

| # | Document | Type | Status |
|---|----------|------|--------|
| 1 | ${selectedFiles[0]?.name ?? "Source 1"} | PDF | Current |`;
      break;
    case "mindmap":
      content = `# Mind Map — ${hubName}

**${hubName}**
├── Onboarding
├── Product
└── Operations`;
      break;
    default:
      content = `# ${toolLabel} — ${hubName}\n\nGenerated from ${count} source${count === 1 ? "" : "s"}: ${fileNames}.`;
  }

  if (customPrompt.trim()) {
    content += `\n\n## Focus\n${customPrompt.trim()}`;
  }
  return content;
}
