/**
 * @deprecated Superseded by KnowledgeHubControlCenter + DocumentReaderDrawer.
 * Retained for reference only — not mounted in routing.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Bold,
  Bot,
  ClipboardList,
  CloudDownload,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  GitCompare,
  HelpCircle,
  Italic,
  Layers,
  MessageSquare,
  MessageSquareQuote,
  MoreHorizontal,
  Network,
  PanelLeftClose,
  PanelRightClose,
  Pencil,
  Plus,
  Quote,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { HubFilePreviewViewer } from "@/components/features/knowledge/HubFilePreviewViewer";
import { enrichStoredHubFile } from "@/components/features/knowledge/hubFileEnrichment";
import { getHubFileMetadataSubtitle } from "@/components/features/knowledge/hubFileMetadata";
import { mockDocumentCentricReply } from "@/components/features/knowledge/hubSourceGuide";
import { HubFileSyncIcon } from "@/components/features/knowledge/HubFileSyncIcon";
import { HubSourceUploadRow, HubUploadProgressSummary } from "@/components/features/knowledge/HubSourceUploadRow";
import { HubSettingsSheet } from "@/components/features/knowledge/HubSettingsSheet";
import { HubWorkspaceOverview } from "@/components/features/knowledge/HubWorkspaceOverview";
import { HubDetailsPanel } from "@/components/features/knowledge/HubDetailsPanel";
import { HubAddSourcesMenu } from "@/components/features/knowledge/HubAddSourcesMenu";
import { useFlowCatalog } from "@/context/FlowCatalogContext";
import { HubNotesPanel } from "@/components/features/knowledge/HubNotesPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKnowledgeHubsOptional } from "@/context/KnowledgeHubContext";
import { cn } from "@/lib/utils";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";
import { getHubFileSourceLabel, getHubFileStatus } from "@/data/knowledgeHubs";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STUDIO_TOOLS = [
  { id: "summary",    label: "Summary",    icon: FileText,      className: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  { id: "mindmap",   label: "Mind Map",   icon: Network,       className: "bg-rose-500/10 text-rose-700 dark:text-rose-300" },
  { id: "quiz",      label: "Quiz",       icon: HelpCircle,    className: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  { id: "flashcards",label: "Flashcards", icon: Layers,        className: "bg-amber-500/10 text-amber-800 dark:text-amber-300" },
  { id: "report",    label: "Report",     icon: ClipboardList, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  { id: "compare",   label: "Compare",    icon: GitCompare,    className: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  { id: "infographic",label: "Infographic",icon: BarChart3,   className: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300" },
  { id: "datatable", label: "Data Table", icon: FileSpreadsheet,className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" },
];

const CENTER_TABS = [
  { id: "overview",  label: "Overview" },
  { id: "details",   label: "Details" },
  { id: "preview",   label: KNOWLEDGE_TERMS.sourcePreviewTab },
  { id: "studio",    label: "Studio" },
  { id: "notes",     label: "Notes" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Studio content generators
// ─────────────────────────────────────────────────────────────────────────────

function generateStudioContent(toolId, hubName, selectedFiles) {
  const fileNames = selectedFiles.map((f) => f.name).join(", ") || "all sources";
  const count = selectedFiles.length || 1;

  switch (toolId) {
    case "summary":
      return `# Executive Summary — ${hubName}

**Sources analysed:** ${count} file${count === 1 ? "" : "s"} (${fileNames})

## Overview
This hub contains documentation covering key operational and product topics. The documents collectively address onboarding procedures, product feature specifications, and team workflows.

## Key Themes
- **Onboarding & Orientation** — Step-by-step guides for new team members, covering tool access, team norms, and first-week milestones.
- **Product Features** — Detailed specifications for core platform capabilities, with release-specific changelogs.
- **Operational Playbooks** — Runbooks for recurring processes including incident response, deployment, and support escalation.

## Recommendations
1. Consolidate onboarding docs into a single source-of-truth wiki.
2. Tag release notes with semantic version labels for easier agent retrieval.
3. Schedule a quarterly review cycle for all operational runbooks.

## Gaps Identified
- No documentation found for offboarding procedures.
- Release notes do not cross-reference related feature specs.`;

    case "quiz":
      return `# Knowledge Quiz — ${hubName}

**Based on:** ${fileNames}

---

**Q1.** What is the primary purpose of the onboarding documentation in this hub?
- A) Product marketing
- B) Guide new team members through their first weeks ✓
- C) Compliance reporting
- D) Investor relations

---

**Q2.** Which of the following best describes a "runbook"?
- A) A quarterly financial report
- B) A design specification document
- C) A step-by-step operational procedure guide ✓
- D) A user interview transcript

---

**Q3.** What should be done with release notes to improve agent retrieval accuracy?
- A) Delete outdated versions
- B) Move them to a separate hub
- C) Tag them with semantic version labels ✓
- D) Convert them to audio format

---

**Q4.** Which gap was identified in the content analysis?
- A) No product documentation
- B) No offboarding procedures ✓
- C) No onboarding guides
- D) No release notes

---

**Q5.** How frequently should operational runbooks be reviewed?
- A) Daily
- B) Monthly
- C) Quarterly ✓
- D) Annually

*Score: __/5 · Generated from ${count} source${count === 1 ? "" : "s"}*`;

    case "flashcards":
      return `# Flashcards — ${hubName}

**Deck:** ${count} card${count === 1 ? "" : "s"} from ${fileNames}

---

**Card 1**
Front: What is the first milestone for a new team member in week one?
Back: Complete tool access setup, attend team standup, and review the onboarding checklist with their manager.

---

**Card 2**
Front: What distinguishes a runbook from a specification document?
Back: A runbook provides step-by-step operational instructions for executing a repeatable process; a specification defines requirements or design intent.

---

**Card 3**
Front: What tagging strategy improves retrieval of release notes by agents?
Back: Semantic version labels (e.g., v2.1, v3.0-beta) applied consistently to each release note document.

---

**Card 4**
Front: How often should the hub's content be reviewed for accuracy?
Back: Quarterly, with critical runbooks reviewed after any major incident or process change.

---

**Card 5**
Front: What is the recommended approach for consolidating onboarding documentation?
Back: Merge all onboarding guides into a single source-of-truth wiki, linked from the hub and referenced by onboarding agents.

---

*Export these cards to Anki via Copy → paste into Anki's import dialog.*`;

    case "report":
      return `# Knowledge Audit Report
**Hub:** ${hubName}
**Sources:** ${count} file${count === 1 ? "" : "s"}
**Date:** ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}

---

## 1. Executive Summary
This report audits the content quality, coverage, and retrieval readiness of the "${hubName}" knowledge hub. The hub currently contains ${count} source document${count === 1 ? "" : "s"}.

## 2. Content Coverage Analysis

| Topic Area       | Coverage | Quality | Gaps                        |
|-----------------|----------|---------|------------------------------|
| Onboarding      | High     | Good    | No offboarding docs          |
| Product Specs   | Medium   | Good    | Missing v3.x release notes   |
| Operations      | Medium   | Fair    | Runbooks need version dates  |
| Compliance      | Low      | N/A     | Not present in hub           |

## 3. Retrieval Readiness

**Strengths:**
- File naming is consistent and descriptive.
- Cloud sources are synced and available for agent retrieval.

**Weaknesses:**
- Several documents lack metadata (author, date, version).
- No topic tags assigned — reduces precision of agent retrieval.

## 4. Recommendations

1. Add topic tags to all documents in Hub Settings.
2. Upload missing v3.x release notes.
3. Create offboarding documentation to fill the identified gap.
4. Add version dates to all runbooks.

## 5. Next Steps
Assign this hub to relevant agents after implementing the recommendations above.`;

    case "compare":
      return `# Document Comparison — ${hubName}

**Comparing:** ${selectedFiles.slice(0, 3).map((f) => f.name).join(" vs. ") || "selected sources"}

---

## Side-by-Side Analysis

| Dimension       | ${selectedFiles[0]?.name ?? "Source 1"}                | ${selectedFiles[1]?.name ?? "Source 2"}              |
|----------------|----------------------------------------------|----------------------------------------------|
| **Purpose**     | Onboarding & orientation                     | Feature specifications                       |
| **Audience**    | New team members                             | Product & engineering teams                  |
| **Tone**        | Instructional, step-by-step                  | Technical, requirements-focused              |
| **Date**        | Q1 2025                                      | Q3 2024                                      |
| **Status**      | Current                                      | Needs update for v3.x                        |
| **Length**      | ~8 pages                                     | ~24 pages                                    |

## Key Differences
- **Scope:** Source 1 covers team processes; Source 2 covers product capabilities.
- **Update frequency:** Source 1 updated quarterly; Source 2 updated per release.
- **Agent suitability:** Source 1 best for HR/onboarding agents; Source 2 for product support agents.

## Common Themes
Both documents reference the internal tooling stack and deployment processes, suggesting an opportunity to create a shared "infrastructure glossary" document.

## Recommendation
Link both documents to separate agents optimised for their respective audiences, and create a shared glossary hub for cross-cutting technical terms.`;

    case "infographic":
      return `# Infographic Data — ${hubName}

**Visual summary of key metrics from ${count} source${count === 1 ? "" : "s"}**

---

## Hub at a Glance

📄 **${count}** Total sources
🔗 Sources from: OneDrive, Uploads
📅 Last updated: ${new Date().toLocaleDateString()}

---

## Content Breakdown

\`\`\`
Document Types
──────────────────────────────
PDF              ████████████  60%
DOCX             ██████        30%
Other            ██            10%
\`\`\`

## Topic Distribution

\`\`\`
Onboarding       ████████████████████  45%
Product          ████████████          30%
Operations       ████████              20%
Other            ████                   5%
\`\`\`

## Knowledge Health Score

\`\`\`
Coverage         ████████████████░░░░  80%
Freshness        ████████████░░░░░░░░  60%
Retrieval Ready  ████████████████░░░░  75%
Overall          ████████████████░░░░  72%
\`\`\`

---

*Export this data as a PNG infographic by copying into a design tool, or download as CSV below.*`;

    case "datatable":
      return `# Extracted Data Table — ${hubName}

**Source:** ${fileNames}

| # | Document | Type | Topic | Pages | Last Modified | Status |
|---|----------|------|-------|-------|--------------|--------|
| 1 | ${selectedFiles[0]?.name ?? "Onboarding.pdf"} | PDF | Onboarding | 8 | Jan 2025 | Current |
| 2 | ${selectedFiles[1]?.name ?? "QuantumLeap.pdf"} | PDF | Product | 24 | Sep 2024 | Needs update |
| 3 | ${selectedFiles[2]?.name ?? "ReleaseNotes.docx"} | DOCX | Product | 3 | Mar 2025 | Current |

## Key Entities Extracted

| Entity | Type | Mentions | Documents |
|--------|------|----------|-----------|
| Onboarding checklist | Process | 12 | Doc 1 |
| v3.x release | Version | 8 | Doc 2, 3 |
| Incident response | Process | 5 | Doc 1 |
| Deployment pipeline | System | 4 | Doc 2 |

## Action Items Extracted

| # | Action | Owner | Priority | Source |
|---|--------|-------|----------|--------|
| 1 | Update release notes for v3.x | Product team | High | Doc 2 |
| 2 | Add offboarding docs | HR team | Medium | Gap analysis |
| 3 | Version-date all runbooks | Ops team | Medium | Doc 1 |

*Copy table → paste into Excel/Sheets, or download as CSV*`;

    case "mindmap":
      return `# Mind Map — ${hubName}

**Root node:** ${hubName}
**Sources:** ${fileNames}

---

## Topic Tree

**${hubName}**
├── 📋 Onboarding
│   ├── Week 1 milestones
│   ├── Tool access setup
│   ├── Team introductions
│   └── Checklist completion
├── 🚀 Product
│   ├── Feature specifications
│   │   ├── Core platform
│   │   └── Integrations
│   ├── Release notes
│   │   ├── v2.x series
│   │   └── v3.x series (incomplete)
│   └── Roadmap items
├── ⚙️ Operations
│   ├── Runbooks
│   │   ├── Incident response
│   │   ├── Deployment
│   │   └── Support escalation
│   └── Maintenance schedules
└── 🔍 Gaps Identified
    ├── Offboarding procedures
    ├── Compliance documentation
    └── v3.x release notes

---

*Switch to the visual Mind Map view (coming soon) to see this as an interactive graph.*`;

    default:
      return `# ${STUDIO_TOOLS.find((t) => t.id === toolId)?.label ?? "Studio Output"} — ${hubName}\n\nGenerated from ${count} source${count === 1 ? "" : "s"}: ${fileNames}.\n\nThis output was created based on your selected sources.`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat helpers
// ─────────────────────────────────────────────────────────────────────────────

function mockAssistantReply(question, hubName, selectedFiles) {
  const q = question.trim().toLowerCase();
  if (!q) return { content: "Ask a question about the documents in this hub.", citations: [] };
  if (selectedFiles.length === 0) {
    return { content: "Add at least one source to this hub, then ask your question.", citations: [] };
  }

  const citations = selectedFiles.slice(0, 3).map((file, i) => ({ index: i + 1, fileId: file.id, name: file.name }));

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

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function PanelShell({
  title,
  collapsed,
  onToggleCollapse,
  children,
  className,
  side = "left",
  widthClass = "w-[300px]",
}) {
  const isLeft = side === "left";

  if (collapsed) {
    return (
      <aside
        className={cn(
          "hidden h-full min-h-0 w-11 shrink-0 flex-col items-center self-stretch border border-border py-3 lg:flex",
          isLeft ? "rounded-l-2xl bg-card" : "rounded-r-2xl border-l bg-muted",
          className,
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onToggleCollapse}
          aria-label={`Expand ${title}`}
        >
          {isLeft ? (
            <PanelLeftClose className="size-4 rotate-180" />
          ) : (
            <PanelRightClose className="size-4 rotate-180" />
          )}
        </Button>
        <span className="mt-4 rotate-180 text-xs font-semibold text-muted-foreground [writing-mode:vertical-rl]">
          {title}
        </span>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "hidden h-full min-h-0 shrink-0 flex-col self-stretch overflow-hidden border border-border lg:flex",
        widthClass,
        isLeft ? "rounded-l-2xl bg-card" : "rounded-r-2xl border-l bg-muted",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onToggleCollapse}
          aria-label={`Collapse ${title}`}
        >
          {isLeft ? (
            <PanelLeftClose className="size-4" />
          ) : (
            <PanelRightClose className="size-4" />
          )}
        </Button>
      </div>
      {children}
    </aside>
  );
}

function ChatAssistantMessage({ message, onCitationClick, onSaveAsNote }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(message.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex w-full shrink-0 flex-col items-start">
      <div className="w-full rounded-[12px] rounded-tl-[4px] border border-border bg-card px-4 py-3">
        <p className="whitespace-pre-line text-sm leading-6 text-foreground">
          {message.content.replace(/\*\*(.*?)\*\*/g, "$1").replace(/_(.*?)_/g, "$1")}
        </p>
        {message.citations?.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-border pt-2">
            <span className="text-[10px] text-muted-foreground">Sources:</span>
            {message.citations.map((cite) => (
              <button
                key={cite.fileId}
                type="button"
                className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20"
                title={cite.name}
                onClick={() => onCitationClick(cite.fileId)}
              >
                [{cite.index}] {cite.name.length > 18 ? `${cite.name.slice(0, 16)}…` : cite.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-1 flex items-center gap-0.5">
        {[
          { icon: copied ? <span className="text-[10px] font-medium text-primary">Copied</span> : <Copy size={14} />, label: "Copy", action: handleCopy },
          { icon: <ThumbsUp size={14} />, label: "Good response", action: () => {} },
          { icon: <ThumbsDown size={14} />, label: "Bad response", action: () => {} },
          { icon: <RotateCcw size={14} />, label: "Regenerate", action: () => {} },
        ].map((btn) => (
          <button
            key={btn.label}
            type="button"
            aria-label={btn.label}
            title={btn.label}
            onClick={btn.action}
            className="flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-muted-foreground transition-colors hover:bg-muted"
          >
            {btn.icon}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onSaveAsNote?.(message)}
          title="Save as note"
          aria-label="Save as note"
          className="flex h-7 items-center gap-1 rounded-full px-2 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Pencil size={11} />
          Save as note
        </button>
      </div>
    </div>
  );
}

function SourcesEmpty({ allFilesCount, sourceQuery, onClearSearch, canEdit, onAddFiles }) {
  const isFiltered = allFilesCount > 0;
  return (
    <Empty className="mx-2 my-4 border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon"><FileText aria-hidden /></EmptyMedia>
        <EmptyTitle>{isFiltered ? "No matching sources" : "No sources yet"}</EmptyTitle>
        <EmptyDescription>
          {isFiltered
            ? `No sources match “${sourceQuery.trim()}”. Try another term or clear search.`
            : "Add files from cloud storage or upload documents to get started."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {isFiltered ? (
          <Button type="button" size="sm" variant="outline" onClick={onClearSearch}>Clear search</Button>
        ) : canEdit && onAddFiles ? (
          <Button type="button" size="sm" onClick={onAddFiles}>Add sources</Button>
        ) : null}
      </EmptyContent>
    </Empty>
  );
}

function fileTypeIcon(type) {
  const t = (type ?? "").toLowerCase();
  if (t.includes("pdf")) return "📄";
  if (t.includes("word") || t.includes("doc")) return "📝";
  if (t.includes("sheet") || t.includes("excel") || t.includes("csv")) return "📊";
  if (t.includes("slide") || t.includes("ppt")) return "📽️";
  return "📁";
}

function groupFilesBySource(files) {
  const groups = {};
  for (const f of files) {
    const key =
      f.source === "cloud"
        ? getHubFileSourceLabel(f)
        : f.isSampleDemo
          ? "Demo"
          : "Uploaded";
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  }
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => {
      const aTime = Date.parse(a.uploadedAt ?? "") || 0;
      const bTime = Date.parse(b.uploadedAt ?? "") || 0;
      if (aTime !== bTime) return bTime - aTime;
      return a.name.localeCompare(b.name);
    });
  }
  return groups;
}

function StudioOutputViewer({ item, canEdit, onAddToSources, onClose, onSaveAsNote }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(item.content ?? "").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    const blob = new Blob([item.content ?? ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.title.replace(/[^\w\s-]/g, "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mb-5 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">{item.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Generated {item.ago}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" title={copied ? "Copied!" : "Copy"} onClick={handleCopy}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
            <Copy className="size-3.5" />
          </button>
          <button type="button" title="Download" onClick={handleDownload}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
            <Download className="size-3.5" />
          </button>
          <Button type="button" variant="ghost" size="icon-xs" aria-label="Close studio output" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <article className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground font-mono bg-background/60 rounded-lg p-3 border border-border overflow-x-auto max-h-96 overflow-y-auto">
        {item.content ?? ""}
      </article>
      <div className="mt-4 flex flex-wrap gap-2">
        {canEdit && onAddToSources && (
          <Button type="button" size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => onAddToSources(item)}>
            <Plus className="size-3.5" aria-hidden />
            Add to sources
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => onSaveAsNote?.(item)}>
          <Pencil className="size-3.5" aria-hidden />
          Save as note
        </Button>
      </div>
    </div>
  );
}

function StudioConfigPanel({ tool, allFiles, onGenerate, onClose }) {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("flex size-7 items-center justify-center rounded-lg", tool.className)}>
            <tool.icon className="size-3.5" aria-hidden />
          </span>
          <p className="text-sm font-semibold text-foreground">Generate {tool.label}</p>
        </div>
        <Button type="button" variant="ghost" size="icon-xs" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Using all {allFiles.length} source{allFiles.length === 1 ? "" : "s"} in this hub.
        </p>

        <div>
          <p className="mb-1.5 text-xs font-medium text-foreground">Custom instructions <span className="text-muted-foreground">(optional)</span></p>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`e.g. Focus on ${tool.label === "Quiz" ? "technical concepts" : "key decisions"}…`}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary"
          />
        </div>

        <Button type="button" className="w-full gap-1.5" onClick={() => onGenerate(allFiles, prompt)}>
          <tool.icon className="size-4" aria-hidden />
          Generate {tool.label}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function KnowledgeHubWorkspaceView({
  hub,
  hubId,
  hubName,
  hubDescription,
  settingsName,
  settingsDescription,
  onSettingsNameChange,
  onSettingsDescriptionChange,
  onSaveSettings,
  onDeleteHub,
  settingsDirty,
  onSettingsBlur,
  allFiles,
  canEdit,
  showDemoStatuses,
  onRefreshSources,
  sourceQuery,
  onSourceQueryChange,
  onConnectCloudProvider,
  onConnectCatalogProvider,
  onBrowseAllConnectors,
  onCustomConnector,
  onUploadFiles,
  onDownloadCloudFile,
  onDeleteFile,
  pendingDownloadCount,
  onDownloadAllPending,
  isDownloadingAll,
  linkedAgents,
  pendingUploads = [],
  uploadHighlightId,
  onUploadHighlightSeen,
  onAddStudioToSources,
}) {
  const isMobile = useIsMobile();
  const { flows } = useFlowCatalog();
  const hubsCtx = useKnowledgeHubsOptional();
  const updateHubFile = hubsCtx?.updateHubFile;

  // Panel state
  const [sourcesCollapsed, setSourcesCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [sourcesSheetOpen, setSourcesSheetOpen] = useState(false);
  const [chatSheetOpen, setChatSheetOpen] = useState(false);
  const [chooseSourceOpen, setChooseSourceOpen] = useState(false);

  // Center tab
  const [previewFileId, setPreviewFileId] = useState(null);
  const [centerTab, setCenterTab] = useState("overview");
  const [highlightSourceId, setHighlightSourceId] = useState(null);

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatFocusFileId, setChatFocusFileId] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState(() => [
    {
      id: "welcome",
      role: "assistant",
      content: "Hi — I'm your hub assistant. Ask questions about the documents in this hub.",
      citations: [],
    },
  ]);

  // Notes state (persisted per hub in localStorage)
  const [notes, setNotes] = useState(() => {
    try {
      const raw = localStorage.getItem(`hub-notes-${hubId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [pendingQuote, setPendingQuote] = useState(null);

  // Studio state
  const [recentStudio, setRecentStudio] = useState([]);
  const [activeStudioItemId, setActiveStudioItemId] = useState(null);
  const [studioDeleteTarget, setStudioDeleteTarget] = useState(null);
  const [studioConfigTool, setStudioConfigTool] = useState(null);
  const [generating, setGenerating] = useState(false);

  const activeStudioItem = useMemo(
    () => recentStudio.find((i) => i.id === activeStudioItemId) ?? null,
    [recentStudio, activeStudioItemId],
  );

  const chatScrollRef = useRef(null);
  const chatInputRef = useRef(null);
  const sourceRowRefs = useRef({});

  // ── derived ──
  const filteredSources = useMemo(() => {
    const q = sourceQuery.trim().toLowerCase();
    if (!q) return allFiles;
    return allFiles.filter((f) => f.name.toLowerCase().includes(q));
  }, [allFiles, sourceQuery]);

  const groupedSources = useMemo(() => groupFilesBySource(filteredSources), [filteredSources]);

  const sourceCount = allFiles.length;
  const activeUploads = pendingUploads.filter((u) => u.status === "uploading");
  const hasUploadActivity = pendingUploads.length > 0;

  const previewFile = useMemo(
    () => (previewFileId ? allFiles.find((f) => f.id === previewFileId) ?? null : null),
    [allFiles, previewFileId],
  );

  const chatFocusFile = useMemo(
    () => (chatFocusFileId ? allFiles.find((f) => f.id === chatFocusFileId) ?? null : null),
    [allFiles, chatFocusFileId],
  );

  useEffect(() => {
    if (!previewFile?.localBlobId || !updateHubFile) return;
    const status = previewFile.metadata?.status;
    if (status === "ready" || status === "loading") return;
    void enrichStoredHubFile(hubId, previewFile, updateHubFile);
  }, [
    hubId,
    previewFile?.id,
    previewFile?.localBlobId,
    previewFile?.metadata?.status,
    updateHubFile,
  ]);

  const activeCenterTab =
    centerTab === "preview" && !previewFile ? "overview" : centerTab;

  const canSendChat = chatInput.trim().length > 0 && !chatLoading && sourceCount > 0;

  // ── effects ──
  useEffect(() => {
    try {
      localStorage.setItem(`hub-notes-${hubId}`, JSON.stringify(notes));
    } catch {
      // Ignore quota / private-mode errors.
    }
  }, [notes, hubId]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    if (!uploadHighlightId) return;
    setHighlightSourceId(uploadHighlightId);
    const scrollTimer = window.setTimeout(() => {
      sourceRowRefs.current[uploadHighlightId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 120);
    const clearTimer = window.setTimeout(() => {
      setHighlightSourceId(null);
      onUploadHighlightSeen?.();
    }, 2500);
    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [uploadHighlightId, onUploadHighlightSeen]);

  useEffect(() => {
    if (!highlightSourceId || highlightSourceId === uploadHighlightId) return;
    const el = sourceRowRefs.current[highlightSourceId];
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const t = window.setTimeout(() => setHighlightSourceId(null), 2000);
    return () => window.clearTimeout(t);
  }, [highlightSourceId, uploadHighlightId]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape" && centerTab === "preview") {
        setCenterTab("overview");
        setPreviewFileId(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [centerTab]);

  // ── callbacks ──
  const handlePreviewFile = useCallback((row) => {
    setPreviewFileId(row.id);
    setChatFocusFileId(row.id);
    setCenterTab("preview");
    if (isMobile) setSourcesSheetOpen(false);
  }, [isMobile]);

  const handleQuickPrompt = useCallback(
    (prompt, file) => {
      if (!file) return;
      setChatFocusFileId(file.id);
      setChatInput(prompt);
      setChatCollapsed(false);
      if (isMobile) {
        setChatSheetOpen(true);
      }
      window.setTimeout(() => chatInputRef.current?.focus(), 80);
    },
    [isMobile],
  );

  const handleSourceGuideReady = useCallback(
    (fileId, guide) => {
      if (updateHubFile && guide?.status === "ready") {
        updateHubFile(hubId, fileId, { sourceGuide: guide });
      }
    },
    [hubId, updateHubFile],
  );

  const handleCitationClick = useCallback((fileId) => {
    setPreviewFileId(fileId);
    setCenterTab("preview");
    setHighlightSourceId(fileId);
    if (isMobile) { setSourcesSheetOpen(true); setChatSheetOpen(false); }
  }, [isMobile]);

  function handleSendChat() {
    const text = chatInput.trim();
    if (!text || chatLoading || sourceCount === 0) return;
    setChatMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: text, citations: [] }]);
    setChatInput("");
    setChatLoading(true);
    const focusFile = chatFocusFile ?? previewFile;
    window.setTimeout(() => {
      const reply =
        focusFile?.sourceGuide?.status === "ready"
          ? mockDocumentCentricReply(text, focusFile, focusFile.sourceGuide)
          : mockAssistantReply(text, hubName, focusFile ? [focusFile] : allFiles);
      setChatMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: reply.content, citations: reply.citations },
      ]);
      setChatLoading(false);
    }, 600);
  }

  function handleChatKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  }

  function handleSaveMessageAsNote(message) {
    const quote = { text: message.content.slice(0, 200), sourceFile: null };
    setPendingQuote(quote);
    setCenterTab("notes");
  }

  function handleSaveStudioAsNote(item) {
    const quote = { text: item.content?.slice(0, 200) ?? item.title, sourceFile: item.title };
    setPendingQuote(quote);
    setCenterTab("notes");
  }

  // Notes CRUD
  function handleAddNote(data) {
    const note = { id: `n-${Date.now()}`, ...data, createdAt: new Date().toISOString() };
    setNotes((prev) => [note, ...prev]);
  }

  function handleEditNote(updated) {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)));
  }

  function handleDeleteNote(id) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  // Studio
  function handleStudioToolClick(tool) {
    if (studioConfigTool?.id === tool.id) {
      setStudioConfigTool(null);
    } else {
      setStudioConfigTool(tool);
    }
  }

  function handleGenerate(filesToUse) {
    const tool = studioConfigTool;
    if (!tool) return;
    setStudioConfigTool(null);
    setGenerating(true);
    window.setTimeout(() => {
      const content = generateStudioContent(tool.id, hubName, filesToUse);
      const item = {
        id: `gen-${Date.now()}`,
        title: `${hubName} — ${tool.label}`,
        ago: "just now",
        toolId: tool.id,
        content,
        generatedAt: new Date().toISOString(),
      };
      setRecentStudio((prev) => [item, ...prev.slice(0, 9)]);
      setActiveStudioItemId(item.id);
      setGenerating(false);
    }, 900);
  }

  function openStudioItem(item) {
    setActiveStudioItemId(item.id);
  }

  function handleAddStudioToSources(item) {
    onAddStudioToSources?.(item);
  }

  function handleAddNoteToSources(note) {
    onAddStudioToSources?.({ title: note.title || "Note", content: note.body });
  }

  // ── Sources panel ──
  const sourcesPanelBody = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 border-b border-border p-4">
        {pendingDownloadCount > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-xs font-medium text-foreground">
              {pendingDownloadCount} cloud file{pendingDownloadCount === 1 ? "" : "s"} need saving
            </p>
            {canEdit && onDownloadAllPending && (
              <Button type="button" size="sm" variant="secondary" className="mt-2 h-7 w-full gap-1.5 text-xs"
                disabled={isDownloadingAll} onClick={onDownloadAllPending}>
                <CloudDownload className={cn("size-3.5", isDownloadingAll && "animate-pulse")} />
                Save all to knowledge base
              </Button>
            )}
          </div>
        )}

        {canEdit && (
          <HubAddSourcesMenu
            open={chooseSourceOpen}
            onOpenChange={setChooseSourceOpen}
            onConnectHubProvider={onConnectCloudProvider}
            onConnectCatalogProvider={onConnectCatalogProvider}
            onBrowseAllConnectors={onBrowseAllConnectors}
            onCustomConnector={onCustomConnector}
            onUploadFiles={onUploadFiles}
          />
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={sourceQuery} onChange={(e) => onSourceQueryChange(e.target.value)}
            placeholder="Search sources…" aria-label="Search sources" className="h-9 rounded-full pl-8 text-sm" />
        </div>

        <div className="flex items-center justify-end gap-2 text-xs">
          <Button type="button" variant="ghost" size="icon-xs"
            onClick={onRefreshSources} disabled={isDownloadingAll || pendingDownloadCount === 0}
            title="Save linked cloud files">
            <RefreshCw className={cn("size-3.5", isDownloadingAll && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-2">
        {filteredSources.length === 0 && !hasUploadActivity && allFiles.length === 0 ? (
          <SourcesEmpty allFilesCount={allFiles.length} sourceQuery={sourceQuery}
            onClearSearch={() => onSourceQueryChange("")} canEdit={canEdit}
            onAddFiles={() => setChooseSourceOpen(true)} />
        ) : (
          <div className="flex flex-col gap-3">
            {filteredSources.length === 0 && sourceQuery.trim() && allFiles.length > 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-center text-xs text-muted-foreground">
                No sources match &ldquo;{sourceQuery.trim()}&rdquo;.{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                  onClick={() => onSourceQueryChange("")}
                >
                  Clear search
                </button>
              </div>
            ) : null}

            {hasUploadActivity ? (
              <div>
                <HubUploadProgressSummary uploads={pendingUploads} />
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Uploading ({activeUploads.length})
                </p>
                <ul className="flex flex-col gap-0.5">
                  {pendingUploads.map((upload) => (
                    <HubSourceUploadRow
                      key={upload.id}
                      upload={upload}
                    />
                  ))}
                </ul>
              </div>
            ) : null}

            {Object.entries(groupedSources).map(([groupLabel, groupFiles]) => (
              <div key={groupLabel}>
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {groupLabel} ({groupFiles.length})
                </p>
                <ul className="space-y-0.5">
                  {groupFiles.map((row) => {
                    const status = getHubFileStatus(row, { includeDemoStatuses: showDemoStatuses });
                    const needsSave = row.source === "cloud" && (status === "linked" || status === "failed");

                    return (
                      <li key={row.id} ref={(el) => { sourceRowRefs.current[row.id] = el; }}>
                        <div title="Click to preview"
                          className={cn(
                            "group flex items-start gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50",
                            previewFileId === row.id && "ring-1 ring-inset ring-primary/50 bg-muted/40",
                            highlightSourceId === row.id && "ring-2 ring-primary animate-pulse",
                          )}>
                          <button type="button" onClick={() => handlePreviewFile(row)}
                            className="mt-0.5 shrink-0 text-base leading-none" aria-label={`Preview ${row.name}`}>
                            {fileTypeIcon(row.type)}
                          </button>
                          <button type="button" onClick={() => handlePreviewFile(row)}
                            className="min-w-0 flex-1 text-left" aria-pressed={previewFileId === row.id}>
                            <p className="truncate text-xs font-medium text-foreground" title={row.name}>{row.name}</p>
                            <p className="truncate text-[10px] text-muted-foreground">
                              {getHubFileMetadataSubtitle(row) ?? getHubFileSourceLabel(row)}
                            </p>
                          </button>
                          <div className="flex shrink-0 items-center gap-1">
                            {needsSave && canEdit ? (
                              <Button type="button" variant="ghost" size="icon-xs" className="text-primary"
                                title="Save & preview" onClick={(e) => { e.stopPropagation(); onDownloadCloudFile?.(row); }}>
                                <CloudDownload className="size-3.5" />
                              </Button>
                            ) : (
                              <HubFileSyncIcon status={status} fileName={row.name}
                                canActivate={canEdit && needsSave} onActivate={() => onDownloadCloudFile?.(row)} />
                            )}
                            {canEdit && onDeleteFile && (
                              <Button type="button" variant="ghost" size="icon-xs"
                                className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                onClick={() => onDeleteFile(row)}>
                                <Trash2 className="size-3 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Chat panel ──
  const chatPanelBody = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[4px] border border-border bg-muted">
          <Bot size={16} className="text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{hubName}</p>
          </div>
          <p className="truncate text-[10px] text-muted-foreground">
            {chatFocusFile
              ? `Searching: ${chatFocusFile.metadata?.title ?? chatFocusFile.name}`
              : `${sourceCount} source${sourceCount === 1 ? "" : "s"} in this hub`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {chatFocusFile ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              title="Search all hub sources"
              onClick={() => setChatFocusFileId(null)}
            >
              <X className="size-3.5" />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Clear conversation"
            onClick={() =>
              setChatMessages([
                {
                  id: "welcome",
                  role: "assistant",
                  content: "Conversation cleared. Ask a new question.",
                  citations: [],
                },
              ])
            }
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      {sourceCount === 0 && (
        <div className="mx-4 mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground">
          Add at least one source to ask questions.
        </div>
      )}

      <div ref={chatScrollRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <div className="flex-1" />
        {chatMessages.map((msg) =>
          msg.role === "user" ? (
            <div key={msg.id} className="flex w-full shrink-0 justify-end">
              <div className="max-w-[85%] rounded-[12px] rounded-tr-[4px] border border-primary/30 bg-primary/10 px-4 py-3">
                <p className="whitespace-pre-line text-sm leading-5 text-foreground">{msg.content}</p>
              </div>
            </div>
          ) : (
            <ChatAssistantMessage key={msg.id} message={msg}
              onCitationClick={handleCitationClick}
              onSaveAsNote={handleSaveMessageAsNote} />
          )
        )}
        {chatLoading && (
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex gap-1 rounded-[12px] border border-border bg-card px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-1.5 animate-bounce rounded-full bg-muted"
                  style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 pb-4 pt-2">
        <div className="overflow-hidden rounded-[12px] border border-border bg-card shadow-[0_4px_24px_0_rgba(37,99,235,0.08)]">
          <div className="flex items-end gap-2 px-4 py-3">
            <textarea
              ref={chatInputRef}
              rows={1}
              value={chatInput}
              onChange={(e) => {
                setChatInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleChatKeyDown}
              placeholder={sourceCount === 0 ? "Add sources to enable chat…" : "Ask a question… (Shift+Enter for new line)"}
              disabled={sourceCount === 0}
              className="flex-1 resize-none bg-transparent text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 overflow-hidden"
              style={{ minHeight: "20px", maxHeight: "120px" }}
            />
            <button type="button" onClick={handleSendChat} disabled={!canSendChat} aria-label="Send"
              className={cn("mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                canSendChat ? "border-border bg-primary text-primary-foreground hover:bg-primary/90" : "cursor-not-allowed border-border bg-card text-foreground opacity-40")}>
              <Send size={14} />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-1.5">
            <span className="text-[10px] text-muted-foreground">
              {sourceCount} source{sourceCount === 1 ? "" : "s"} · Enter to send · Shift+Enter for new line
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Studio panel ──
  const studioPanel = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border p-4">
        <p className="mb-3 text-center text-[10px] text-muted-foreground">
          Select a tool to generate from your sources
        </p>
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {STUDIO_TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = studioConfigTool?.id === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => handleStudioToolClick(tool)}
                disabled={generating}
                className={cn(
                  "relative flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all",
                  isActive
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-border bg-background hover:border-primary/30 hover:bg-muted/40",
                  generating && "cursor-not-allowed opacity-50",
                )}
              >
                <span className={cn("flex size-8 items-center justify-center rounded-lg", tool.className)}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="text-xs font-semibold text-foreground">{tool.label}</span>
                {isActive && (
                  <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4">
        <div className="mx-auto max-w-2xl">
          {generating && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-6">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-2 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Generating output…</p>
            </div>
          )}

          {studioConfigTool && !generating && (
            <StudioConfigPanel
              tool={studioConfigTool}
              allFiles={allFiles}
              onGenerate={handleGenerate}
              onClose={() => setStudioConfigTool(null)}
            />
          )}

          {activeStudioItem && !generating && (
            <StudioOutputViewer
              item={activeStudioItem}
              canEdit={canEdit}
              onAddToSources={handleAddStudioToSources}
              onClose={() => setActiveStudioItemId(null)}
              onSaveAsNote={handleSaveStudioAsNote}
            />
          )}

          {recentStudio.length > 0 && (
            <div className="mb-3">
              <p className="mb-2 text-xs font-semibold text-foreground">Recent outputs</p>
              <ul className="space-y-1">
                {recentStudio.map((item) => {
                  const tool = STUDIO_TOOLS.find((t) => t.id === item.toolId);
                  const Icon = tool?.icon ?? FileText;
                  return (
                    <li key={item.id}>
                      <div className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-2 transition-colors",
                        activeStudioItemId === item.id ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted/50",
                      )}>
                        <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => openStudioItem(item)}>
                          <span className={cn("flex size-5 shrink-0 items-center justify-center rounded", tool?.className)}>
                            <Icon className="size-3" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs font-medium">{item.title}</span>
                          <span className="shrink-0 text-[10px]">{item.ago}</span>
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button type="button" variant="ghost" size="icon-xs" className="shrink-0"
                              aria-label={`Actions for ${item.title}`} onClick={(e) => e.stopPropagation()} />
                          }>
                            <MoreHorizontal className="size-3.5 opacity-80" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {canEdit && (
                              <DropdownMenuItem onClick={() => handleAddStudioToSources(item)}>
                                <Plus className="mr-2 size-4" />Add to sources
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleSaveStudioAsNote(item)}>
                              <Pencil className="mr-2 size-4" />Save as note
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => setStudioDeleteTarget(item)}>
                              <Trash2 className="mr-2 size-4" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Render ──
  return (
    <TooltipProvider delay={300}>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-end gap-2 px-1 pb-2">
          <HubSettingsSheet
            name={settingsName}
            description={settingsDescription}
            onNameChange={onSettingsNameChange}
            onDescriptionChange={onSettingsDescriptionChange}
            onSave={onSaveSettings}
            onDelete={onDeleteHub}
            canEdit={canEdit}
            canDelete={!!onDeleteHub}
            detailsDirty={settingsDirty}
            onNameBlur={onSettingsBlur}
            onDescriptionBlur={onSettingsBlur}
          />
        </div>

        <div className="flex min-h-0 flex-1 items-stretch gap-0 overflow-hidden lg:flex-row lg:gap-3">
          {/* Sources panel */}
          <PanelShell title="Sources" collapsed={sourcesCollapsed}
            onToggleCollapse={() => setSourcesCollapsed((v) => !v)}>
            {sourcesPanelBody}
          </PanelShell>

          {/* Center panel */}
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2 sm:px-5">
              <div className="flex gap-1 overflow-x-auto">
                {CENTER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    disabled={tab.id === "preview" && !previewFile}
                    onClick={() => {
                      if (tab.id === "preview" && !previewFile) return;
                      setCenterTab(tab.id);
                    }}
                    className={cn(
                      "relative shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      activeCenterTab === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      tab.id === "preview" && !previewFile && "cursor-not-allowed opacity-40",
                    )}
                  >
                    {tab.label}
                    {tab.id === "preview" && previewFile && (
                      <span className="ml-1 max-w-[80px] truncate opacity-70">· {previewFile.name}</span>
                    )}
                    {tab.id === "notes" && notes.length > 0 && (
                      <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                        {notes.length}
                      </span>
                    )}
                    {tab.id === "studio" && recentStudio.length > 0 && (
                      <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                        {recentStudio.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {activeCenterTab === "overview" && (
                <HubWorkspaceOverview
                  hubName={hubName}
                  hubDescription={hubDescription}
                  allFiles={allFiles}
                  linkedAgents={linkedAgents}
                  pendingDownloadCount={pendingDownloadCount}
                  canEdit={canEdit}
                  onDownloadAllPending={onDownloadAllPending}
                  isDownloadingAll={isDownloadingAll}
                  onOpenSources={() => setSourcesSheetOpen(true)}
                  notesCount={notes.length}
                  studioCount={recentStudio.length}
                  onGoToNotes={() => setCenterTab("notes")}
                  onGoToStudio={() => setCenterTab("studio")}
                />
              )}

              {activeCenterTab === "details" && hub && (
                <HubDetailsPanel
                  hub={hub}
                  allFiles={allFiles}
                  flows={flows}
                  canEdit={canEdit}
                  onAddFiles={onUploadFiles}
                  onOpenSources={() => setChooseSourceOpen(true)}
                  onDeleteFile={canEdit ? onDeleteFile : undefined}
                  onDownloadCloudFile={canEdit ? onDownloadCloudFile : undefined}
                />
              )}

              {activeCenterTab === "preview" && previewFile && (
                <div className="flex h-full min-h-0 flex-col">
                  <div className="shrink-0 border-b border-border px-5 py-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {previewFile.metadata?.title ?? previewFile.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {getHubFileMetadataSubtitle(previewFile) ?? getHubFileSourceLabel(previewFile)}
                    </p>
                  </div>
                  <HubFilePreviewViewer
                    hubId={hubId}
                    file={previewFile}
                    allFiles={allFiles}
                    showDemoStatuses={showDemoStatuses}
                    onRequestDownload={
                      canEdit && previewFile.source === "cloud"
                        ? () => onDownloadCloudFile?.(previewFile)
                        : undefined
                    }
                    onQuickPrompt={handleQuickPrompt}
                    onSourceGuideReady={handleSourceGuideReady}
                    className="min-h-0 flex-1"
                  />
                </div>
              )}

              {activeCenterTab === "studio" && studioPanel}

              {activeCenterTab === "notes" && (
                <HubNotesPanel
                  hubId={hubId}
                  notes={notes}
                  onAddNote={handleAddNote}
                  onEditNote={handleEditNote}
                  onDeleteNote={handleDeleteNote}
                  onAddNoteToSources={canEdit ? handleAddNoteToSources : undefined}
                  pendingQuote={pendingQuote}
                  onClearPendingQuote={() => setPendingQuote(null)}
                />
              )}
            </div>
          </main>

          {/* Chat panel */}
          <PanelShell
            title="Chat"
            side="right"
            widthClass="w-[380px]"
            collapsed={chatCollapsed}
            onToggleCollapse={() => setChatCollapsed((v) => !v)}
          >
            {chatPanelBody}
          </PanelShell>
        </div>

        {/* Mobile bar */}
        <div className="flex shrink-0 items-center gap-2 border-t border-border bg-card p-2 lg:hidden">
          <Button type="button" variant="outline" className="flex-1 gap-1.5" onClick={() => setSourcesSheetOpen(true)}>
            <FileText className="size-4" />
            Sources ({allFiles.length})
          </Button>
          <Button type="button" variant="outline" className="flex-1 gap-1.5" onClick={() => setChatSheetOpen(true)}>
            <MessageSquare className="size-4" />
            Chat
          </Button>
        </div>

        {/* Mobile sheets */}
        <Sheet open={sourcesSheetOpen} onOpenChange={setSourcesSheetOpen}>
          <SheetContent side="left" className="flex w-full max-w-sm flex-col gap-0 p-0 sm:max-w-md">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Sources</h2>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{sourcesPanelBody}</div>
          </SheetContent>
        </Sheet>

        <Sheet open={chatSheetOpen} onOpenChange={setChatSheetOpen}>
          <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{chatPanelBody}</div>
          </SheetContent>
        </Sheet>
      </div>

      {studioDeleteTarget && (
        <ConfirmDialog
          title="Delete studio output?"
          message={`Remove "${studioDeleteTarget.title}" from recent outputs?`}
          confirmLabel="Delete"
          onConfirm={() => {
            setRecentStudio((prev) => prev.filter((i) => i.id !== studioDeleteTarget.id));
            if (activeStudioItemId === studioDeleteTarget.id) setActiveStudioItemId(null);
            setStudioDeleteTarget(null);
          }}
          onCancel={() => setStudioDeleteTarget(null)}
        />
      )}
    </TooltipProvider>
  );
}
