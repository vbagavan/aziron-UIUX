import {
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Layers,
  Lightbulb,
  Network,
  Presentation,
} from "lucide-react";
import { assetTypeLabel } from "@/data/knowledgeHubs";

/** All creation tools available in Hub Studio (control center + assistant panel). */
export const HUB_CREATION_TOOLS = [
  { id: "summary", label: "Summary", assetType: "summary", icon: FileText, className: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  { id: "mindmap", label: "Mind Map", assetType: "mindmap", icon: Network, className: "bg-rose-500/10 text-rose-700 dark:text-rose-300" },
  { id: "flashcards", label: "Flashcards", assetType: "flashcards", icon: Layers, className: "bg-amber-500/10 text-amber-800 dark:text-amber-300" },
  { id: "report", label: "Report", assetType: "report", icon: ClipboardList, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  { id: "datatable", label: "Data Table", assetType: "datatable", icon: FileSpreadsheet, className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" },
  { id: "insight", label: "Insight", assetType: "insight", icon: Lightbulb, className: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300" },
  { id: "document", label: "Document", assetType: "document", icon: FileText, className: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  { id: "presentation", label: "Presentation deck", assetType: "presentation", icon: Presentation, className: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
];

/** @deprecated Use HUB_CREATION_TOOLS */
export const HUB_STUDIO_TOOLS = HUB_CREATION_TOOLS;

export function inferAssetTypeFromPrompt(question) {
  const q = question.toLowerCase();
  if (detectProjectDocIntent(question)) return "document";
  if (/\b(summary|summarize|overview|tl;dr|recap)\b/.test(q)) return "summary";
  if (/\b(report|analysis|breakdown)\b/.test(q)) return "report";
  if (/\b(insight|trend|pattern|takeaway|recommend)\b/.test(q)) return "insight";
  if (/\b(deck|slides|presentation)\b/.test(q)) return "presentation";
  if (/\b(mind\s?map|mindmap)\b/.test(q)) return "mindmap";
  if (/\b(flashcard|flash card|quiz card)\b/.test(q)) return "flashcards";
  if (/\b(table|spreadsheet|data table)\b/.test(q)) return "datatable";
  if (/\b(draft|write|create|generate)\b/.test(q)) return "document";
  return "note";
}

/** Detect project deliverable intent from a free-form Studio prompt. */
export function detectProjectDocIntent(prompt = "") {
  const q = prompt.toLowerCase();
  if (/\b(purchase order|po|p\.?o\.?)\b/.test(q)) return "purchase_order";
  if (/\b(invoice|billing statement|bill client)\b/.test(q)) return "invoice";
  if (/\b(rfp|request for proposal|proposal response)\b/.test(q)) return "rfp";
  return null;
}

function buildProjectDeliverableBody(intent, { hubName, fileNames, count, customPrompt, intro }) {
  const today = new Date().toLocaleDateString();
  const ref = `PO-${Date.now().toString().slice(-6)}`;
  const inv = `INV-${Date.now().toString().slice(-6)}`;

  switch (intent) {
    case "purchase_order":
      return {
        title: customPrompt?.trim() ? `Purchase Order: ${customPrompt.trim().replace(/\?+$/, "")}` : `Purchase Order — ${hubName}`,
        body: `# Purchase Order

${intro}
**Sources:** ${fileNames}
**Date:** ${today}
**PO Number:** ${ref}

## Vendor / Supplier
Acme Corporation — Platform Modernization Program

## Line items
| # | Description | Qty | Unit | Amount |
|---|-------------|-----|------|--------|
| 1 | Phase 1 — Discovery & architecture (per SOW §3.1) | 1 | Fixed | $48,000 |
| 2 | Phase 2 — Core platform build (per SOW §3.2) | 1 | Fixed | $112,000 |
| 3 | Contingency reserve (10%) | 1 | Fixed | $16,000 |

**Subtotal:** $176,000  
**Tax:** As applicable per MSA  
**Total:** $176,000

## Terms
Payment per milestone schedule in the linked SOW. Net 30 from milestone acceptance.

## Authorization
Prepared from ${count} project source${count === 1 ? "" : "s"} in **${hubName}**. Review against the SOW and MSA before issuing.`,
      };
    case "invoice":
      return {
        title: customPrompt?.trim() ? `Invoice: ${customPrompt.trim().replace(/\?+$/, "")}` : `Invoice — ${hubName}`,
        body: `# Invoice

${intro}
**Sources:** ${fileNames}
**Date:** ${today}
**Invoice #:** ${inv}

## Bill to
Acme Corporation  
Accounts Payable  
123 Market Street, San Francisco, CA

## Services rendered
| Description | Period | Amount |
|-------------|--------|--------|
| Milestone 1 — Discovery complete (SOW §3.1) | Jun 2026 | $48,000 |
| Professional services — platform modernization | Jun 2026 | $0.00 |

**Amount due:** $48,000  
**Due date:** Net 30 (${today})

## Payment instructions
Wire transfer per MSA payment terms. Reference invoice ${inv} and PO ${ref}.

## Notes
Generated from project documents in **${hubName}**. Attach signed milestone acceptance before sending.`,
      };
    case "rfp":
      return {
        title: customPrompt?.trim() ? `RFP Response: ${customPrompt.trim().replace(/\?+$/, "")}` : `RFP Response — ${hubName}`,
        body: `# RFP Response Summary

${intro}
**Sources:** ${fileNames}
**Date:** ${today}

## Executive summary
Response aligned to Acme Platform Modernization requirements drawn from the RFP and supporting SOW.

## Scope alignment
- Cloud-native architecture with phased delivery
- Security and compliance per enterprise standards
- Fixed-price milestones with change-control via CR process

## Commercial summary
| Phase | Duration | Investment |
|-------|----------|------------|
| Discovery | 4 weeks | $48,000 |
| Build | 12 weeks | $112,000 |
| Hypercare | 4 weeks | Included |

## Differentiators
Grounded in ${count} linked source${count === 1 ? "" : "s"}: ${fileNames}.`,
      };
    default:
      return null;
  }
}

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
  if (detectProjectDocIntent(question)) {
    const { body } = generateHubContent("document", hubName, selectedFiles, question);
    answer = body;
  } else if (q.includes("summary") || q.includes("summarize") || q.includes("overview")) {
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

/** Mock generator — returns { title, body } for hub asset persistence. */
export function generateHubContent(toolId, hubName, selectedFiles, customPrompt = "") {
  const fileNames = selectedFiles.map((f) => f.name).join(", ") || "all sources";
  const count = selectedFiles.length || 1;
  const tool = HUB_CREATION_TOOLS.find((t) => t.id === toolId);
  const toolLabel = tool?.label ?? assetTypeLabel(toolId);
  const assetType = tool?.assetType ?? toolId;
  const heading = customPrompt?.trim()
    ? customPrompt.trim().replace(/\?+$/, "")
    : `${toolLabel} — ${hubName}`;
  const intro = `Generated from ${count} source${count === 1 ? "" : "s"} in **${hubName}**.`;

  const projectIntent = detectProjectDocIntent(customPrompt);
  const projectDraft = projectIntent
    ? buildProjectDeliverableBody(projectIntent, { hubName, fileNames, count, customPrompt, intro })
    : null;

  let title = heading;
  let body = "";

  if (projectDraft) {
    title = projectDraft.title;
    body = projectDraft.body;
  } else switch (toolId) {
    case "summary":
      title = customPrompt?.trim() ? `Summary: ${heading}` : `Executive summary — ${hubName}`;
      body = `# ${heading}

${intro}
**Sources analysed:** ${fileNames}

## Overview
The connected sources collectively cover the core topics in this hub. Key themes are surfaced below for quick consumption by the team.

## Key points
- Primary objective and scope drawn from the sources
- Notable procedures, definitions, and decisions
- Cross-references that recur across documents

## Suggested next step
Ask a follow-up question to drill into any point above — the answer is saved here automatically.`;
      break;
    case "report":
      title = customPrompt?.trim() ? `Report: ${heading}` : `Coverage report — ${hubName}`;
      body = `# Knowledge Audit Report — ${hubName}

${intro}
**Sources:** ${count} file${count === 1 ? "" : "s"} (${fileNames})
**Date:** ${new Date().toLocaleDateString()}

## Findings
1. The sources address the requested topic with good coverage.
2. A few gaps remain where additional sources would help.
3. Confidence is moderate-to-high based on overlap across documents.

## Detail
Each finding above is grounded in the hub's sources and can be expanded on request.`;
      break;
    case "insight":
      title = customPrompt?.trim() ? `Insight: ${heading}` : `Insight — recurring themes`;
      body = `# ${heading}

${intro}

> The strongest signal across the sources is a consistent emphasis on the topic you asked about.

- Theme appears in the majority of documents
- Two sources offer conflicting guidance worth reconciling
- One emerging trend is under-documented and may need a new source`;
      break;
    case "presentation":
      title = customPrompt?.trim() ? `Deck: ${heading}` : `${hubName} overview deck`;
      body = `# ${heading}

${intro}

## Slide 1 — Context
Why this matters and who it's for.

## Slide 2 — Key points
Three to five points drawn directly from the sources.

## Slide 3 — Recommendation
The suggested action and its rationale.`;
      break;
    case "document":
      title = customPrompt?.trim() ? `Draft: ${heading}` : `Draft document — ${hubName}`;
      body = `# ${heading}

${intro}

This draft assembles the relevant passages from the hub's sources into a single document you can refine and share.`;
      break;
    case "flashcards":
      title = customPrompt?.trim() ? `Flashcards: ${heading}` : `Flashcards — ${hubName}`;
      body = `# Flashcards — ${hubName}

${intro}

**Card 1**
Front: What is the first milestone for a new team member?
Back: Complete tool access setup and review the onboarding checklist.

**Card 2**
Front: Where are operational runbooks stored?
Back: In the incident response and deployment sections of the hub sources.`;
      break;
    case "datatable":
      title = customPrompt?.trim() ? `Data table: ${heading}` : `Extracted data — ${hubName}`;
      body = `# Extracted Data Table — ${hubName}

${intro}

| # | Document | Type | Status |
|---|----------|------|--------|
| 1 | ${selectedFiles[0]?.name ?? "Source 1"} | PDF | Current |
| 2 | ${selectedFiles[1]?.name ?? "Source 2"} | Doc | Current |`;
      break;
    case "mindmap":
      title = customPrompt?.trim() ? `Mind map: ${heading}` : `Mind map — ${hubName}`;
      body = `# Mind Map — ${hubName}

${intro}

**${hubName}**
├── Onboarding
│   ├── Tool access
│   └── Checklists
├── Product
│   ├── Features
│   └── Changelog
└── Operations
    ├── Runbooks
    └── Incident response`;
      break;
    case "note":
      title = customPrompt?.trim() ? heading : `Note — ${hubName}`;
      body = `${intro}

${customPrompt?.trim() ? `**Q:** ${customPrompt.trim()}\n\n` : ""}Based on the connected sources, here is a concise, grounded answer that has been saved to this hub's knowledge for everyone with access.`;
      break;
    default:
      title = customPrompt?.trim() ? heading : `${toolLabel} — ${hubName}`;
      body = `# ${toolLabel} — ${hubName}

${intro}

Generated from ${count} source${count === 1 ? "" : "s"}: ${fileNames}.`;
  }

  if (!projectDraft) {
    if (customPrompt.trim() && !["summary", "report", "insight", "presentation", "document", "flashcards", "datatable", "mindmap"].includes(toolId)) {
      body += `\n\n## Focus\n${customPrompt.trim()}`;
    } else if (customPrompt.trim() && toolId !== "note") {
      body += `\n\n## Focus\n${customPrompt.trim()}`;
    }
  }

  return { title, body, assetType: projectDraft ? "document" : assetType };
}

/** @deprecated Use generateHubContent — returns body string only for legacy callers. */
export function generateHubStudioContent(toolId, hubName, selectedFiles, customPrompt = "") {
  return generateHubContent(toolId, hubName, selectedFiles, customPrompt).body;
}
