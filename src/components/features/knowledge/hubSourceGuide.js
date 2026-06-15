import { parseTitleFromFileName } from "@/components/features/knowledge/hubFileMetadata";

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "as", "is", "was", "are", "were", "be", "been", "this", "that", "it",
  "its", "will", "can", "may", "should", "would", "could", "have", "has", "had", "not",
]);

const ENTITY_PATTERNS = [
  { type: "organization", pattern: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Inc|LLC|Corp|Ltd|Company|Team|Department)\b/g },
  { type: "person", pattern: /\b(?:Dr|Mr|Ms|Mrs)\.\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g },
];

export const DEFAULT_QUICK_PROMPTS = [
  { id: "summarize", label: "Summarize this document", prompt: "Summarize this document" },
  { id: "findings", label: "What are the key findings?", prompt: "What are the key findings?" },
  { id: "methodology", label: "Explain the methodology", prompt: "Explain the methodology" },
  { id: "stakeholders", label: "List important stakeholders", prompt: "List important stakeholders" },
  { id: "questions", label: "Generate discussion questions", prompt: "Generate discussion questions" },
];

function tokenize(text) {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
}

function topKeywords(text, limit = 12) {
  const freq = new Map();
  for (const word of tokenize(text)) {
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function extractTopics(text, fileName, metadata) {
  const keywords = topKeywords(text, 8);
  const title = metadata?.title ?? parseTitleFromFileName(fileName);
  const topics = new Set([title]);

  const headingMatches = (text ?? "").match(/^#{1,3}\s+(.+)$/gm) ?? [];
  headingMatches.slice(0, 6).forEach((h) => topics.add(h.replace(/^#+\s+/, "").trim()));

  keywords.slice(0, 5).forEach((k) => topics.add(k.charAt(0).toUpperCase() + k.slice(1)));

  if (metadata?.documentType) topics.add(metadata.documentType);

  return [...topics]
    .filter(Boolean)
    .slice(0, 8)
    .map((label, i) => ({
      id: `topic-${i}`,
      label,
      relevance: Math.max(0.5, 1 - i * 0.08),
    }));
}

function extractEntities(text, metadata) {
  const entities = [];
  const seen = new Set();

  if (metadata?.author) {
    entities.push({ id: "author", type: "person", name: metadata.author });
    seen.add(metadata.author.toLowerCase());
  }
  if (metadata?.publisher) {
    entities.push({ id: "publisher", type: "organization", name: metadata.publisher });
    seen.add(metadata.publisher.toLowerCase());
  }

  for (const { type, pattern } of ENTITY_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const name = (match[1] ?? match[0]).trim();
      const key = name.toLowerCase();
      if (name.length > 2 && !seen.has(key)) {
        seen.add(key);
        entities.push({ id: `${type}-${entities.length}`, type, name });
      }
      if (entities.length >= 8) break;
    }
  }

  return entities.slice(0, 8);
}

function extractSections(text) {
  const lines = (text ?? "").split("\n");
  const sections = [];
  let current = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (/^#{1,3}\s+/.test(line)) {
      if (current) sections.push(current);
      current = {
        id: `sec-${sections.length}`,
        title: line.replace(/^#+\s+/, ""),
        excerpt: "",
        lineStart: i,
      };
    } else if (current && line) {
      current.excerpt += (current.excerpt ? " " : "") + line;
      if (current.excerpt.length > 200) {
        sections.push({ ...current, excerpt: `${current.excerpt.slice(0, 200)}…` });
        current = null;
      }
    }
  }
  if (current) sections.push({ ...current, excerpt: current.excerpt || "—" });

  if (sections.length === 0 && text?.trim()) {
    const chunks = text.split(/\n\n+/).filter(Boolean).slice(0, 5);
    chunks.forEach((chunk, i) => {
      sections.push({
        id: `sec-${i}`,
        title: `Section ${i + 1}`,
        excerpt: chunk.slice(0, 220) + (chunk.length > 220 ? "…" : ""),
        lineStart: i,
      });
    });
  }

  return sections.slice(0, 8);
}

function buildConcepts(topics, keywords, metadata) {
  const concepts = new Set();
  topics.forEach((t) => concepts.add(t.label));
  keywords.slice(0, 6).forEach((k) => concepts.add(k.charAt(0).toUpperCase() + k.slice(1)));
  (metadata?.tags ?? []).forEach((t) => concepts.add(t));
  return [...concepts].slice(0, 10);
}

function buildDiscover(topics, metadata, fileName) {
  const primary = topics[0]?.label ?? parseTitleFromFileName(fileName);
  return {
    relatedTopics: topics.slice(1, 5).map((t) => t.label),
    similarDocuments: [
      `${primary} — companion guide`,
      `Related policy documentation`,
      `Team knowledge base article`,
    ],
    trendingAreas: [
      "Knowledge management",
      "Document intelligence",
      metadata?.documentType === "Policy" ? "Compliance automation" : "AI-assisted research",
    ],
    recommendedReading: [
      { title: `Introduction to ${primary}`, type: "article" },
      { title: "Industry best practices overview", type: "report" },
      { title: "Internal wiki: related procedures", type: "internal" },
    ],
    associatedConcepts: topics.slice(0, 6).map((t) => t.label),
  };
}

function buildKnowledgeGraph(topics, entities, metadata, fileName) {
  const title = metadata?.title ?? parseTitleFromFileName(fileName);
  const nodes = [
    { id: "doc", label: title, type: "document" },
  ];
  const edges = [];

  topics.slice(0, 5).forEach((topic, i) => {
    const id = `topic-${i}`;
    nodes.push({ id, label: topic.label, type: "topic" });
    edges.push({ from: "doc", to: id, label: "covers" });
  });

  entities.slice(0, 4).forEach((entity, i) => {
    const id = `entity-${i}`;
    nodes.push({ id, label: entity.name, type: entity.type });
    edges.push({ from: "doc", to: id, label: "mentions" });
    if (topics[i]) {
      edges.push({ from: id, to: `topic-${i}`, label: "related to" });
    }
  });

  if (metadata?.publisher) {
    nodes.push({ id: "publisher", label: metadata.publisher, type: "organization" });
    edges.push({ from: "publisher", to: "doc", label: "published" });
  }

  return { nodes, edges };
}

async function fetchWikipediaResource(topic) {
  const title = encodeURIComponent(topic.replace(/\s+/g, "_"));
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      type: "wikipedia",
      title: data.title ?? topic,
      description: data.extract ?? "",
      url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${title}`,
      source: "Wikipedia",
    };
  } catch {
    return null;
  }
}

function buildMockExternalResources(topics, metadata) {
  const primary = topics[0]?.label ?? "Document";
  const resources = [];

  if (metadata?.externalUrl) {
    resources.push({
      type: "reference",
      title: metadata.title ?? primary,
      description: metadata.description ?? "Catalog reference for this work.",
      url: metadata.externalUrl,
      source: metadata.source === "openlibrary" ? "Open Library" : "Reference",
    });
  }

  return resources;
}

function contextualQuickPrompts(metadata, topics) {
  const prompts = [...DEFAULT_QUICK_PROMPTS];
  const docType = metadata?.documentType?.toLowerCase() ?? "";

  if (docType === "policy" || docType === "runbook") {
    prompts.push({
      id: "compliance",
      label: "What compliance requirements apply?",
      prompt: "What compliance requirements apply?",
    });
  }
  if (docType === "report") {
    prompts.push({
      id: "recommendations",
      label: "What are the recommendations?",
      prompt: "What are the recommendations?",
    });
  }
  if (topics[0]) {
    prompts.push({
      id: "define",
      label: `Define "${topics[0].label}"`,
      prompt: `Define "${topics[0].label}" in the context of this document`,
    });
  }

  return prompts.slice(0, 8);
}

/**
 * @param {{ text: string, fileName: string, metadata?: object, allFiles?: object[], structuredSections?: object[] }} input
 */
export async function generateSourceGuide({
  text,
  fileName,
  metadata = null,
  allFiles = [],
  structuredSections = null,
} = {}) {
  await new Promise((r) => window.setTimeout(r, 400 + Math.random() * 300));

  let corpus = text?.trim() ?? "";
  if (!corpus && structuredSections?.length) {
    corpus = structuredSections
      .map((s) => `${s.title ?? ""}\n${s.excerpt ?? s.summary ?? s.body ?? ""}`)
      .join("\n\n");
  }

  const topics = extractTopics(corpus, fileName, metadata);
  const keywords = topKeywords(corpus);
  const entities = extractEntities(corpus, metadata);
  const sections =
    structuredSections?.length > 0
      ? structuredSections.slice(0, 12).map((s, i) => ({
          id: s.id ?? `sec-${i}`,
          title: s.title ?? `Section ${i + 1}`,
          excerpt: (s.excerpt ?? s.summary ?? "").slice(0, 220) + ((s.excerpt ?? s.summary ?? "").length > 220 ? "…" : ""),
          lineStart: i,
        }))
      : extractSections(corpus);
  const concepts = buildConcepts(topics, keywords, metadata);
  const discover = buildDiscover(topics, metadata, fileName);
  const graph = buildKnowledgeGraph(topics, entities, metadata, fileName);
  const quickPrompts = contextualQuickPrompts(metadata, topics);

  const summary =
    metadata?.summary ??
    metadata?.description ??
    (sections[0]?.excerpt && sections.length > 1
      ? `${sections[0].excerpt} This guide covers ${sections.length} sections extracted from the document.`
      : corpus
        ? corpus
            .replace(/^#+\s+/gm, "")
            .replace(/\*\*/g, "")
            .split(/\n+/)
            .map((l) => l.trim())
            .filter(Boolean)
            .join(" ")
            .slice(0, 320) + (corpus.length > 320 ? "…" : "")
        : `Structured guide for ${parseTitleFromFileName(fileName)}.`);

  const externalFromWiki = topics[0]
    ? await fetchWikipediaResource(topics[0].label)
    : null;
  const externalResources = [
    ...(externalFromWiki ? [externalFromWiki] : []),
    ...buildMockExternalResources(topics, metadata),
  ].slice(0, 5);

  const similarInHub = (allFiles ?? [])
    .filter((f) => f.name !== fileName)
    .slice(0, 3)
    .map((f) => f.name);
  if (similarInHub.length > 0) {
    discover.similarDocuments = similarInHub;
  }

  return {
    status: "ready",
    generatedAt: new Date().toISOString(),
    isPreview: true,
    summary,
    topics,
    concepts,
    entities,
    keywords,
    sections,
    quickPrompts,
    externalResources,
    discover,
    graph,
  };
}

export function createPendingSourceGuide() {
  return { status: "loading", generatedAt: new Date().toISOString() };
}

/**
 * Document-centric mock reply grounded in a single file + source guide.
 */
export function mockDocumentCentricReply(question, file, sourceGuide) {
  const q = question.trim().toLowerCase();
  const title = file.metadata?.title ?? parseTitleFromFileName(file.name);
  const citations = [{ index: 1, fileId: file.id, name: file.name }];

  if (!q) {
    return {
      content: `Ask a question about "${title}" and I'll answer from this document only.`,
      citations,
    };
  }

  const sectionRef = sourceGuide?.sections?.[0];
  const topicList = (sourceGuide?.topics ?? []).map((t) => t.label).join(", ");
  const entityList = (sourceGuide?.entities ?? []).map((e) => e.name).join(", ");

  let answer = "";

  if (q.includes("summarize") || q.includes("summary")) {
    answer = `**Summary of "${title}"**\n\n${sourceGuide?.summary ?? "This document covers the topics listed in the Source Guide."}\n\nKey topics: ${topicList || "See the guide overview."}`;
  } else if (q.includes("finding") || q.includes("key")) {
    answer = `**Key findings from "${title}"**\n\n• Primary themes: ${topicList || "document scope and objectives"}\n• Notable entities: ${entityList || "stakeholders referenced in the text"}\n• ${sectionRef ? `See "${sectionRef.title}": ${sectionRef.excerpt}` : "Review the sections tab for detailed excerpts."}`;
  } else if (q.includes("methodology") || q.includes("how")) {
    answer = `**Methodology / approach in "${title}"**\n\nThe document outlines processes and frameworks across ${sourceGuide?.sections?.length ?? "several"} sections. ${sectionRef ? `The section "${sectionRef.title}" describes: ${sectionRef.excerpt}` : "Open the Source Guide sections for step-by-step detail."}`;
  } else if (q.includes("stakeholder") || q.includes("list")) {
    answer = `**Stakeholders & entities in "${title}"**\n\n${entityList ? entityList.split(", ").map((e) => `• ${e}`).join("\n") : "• Teams and roles referenced throughout the document"}\n• Concepts: ${(sourceGuide?.concepts ?? []).slice(0, 4).join(", ") || "see entity list in guide"}`;
  } else if (q.includes("question") || q.includes("discussion")) {
    answer = `**Discussion questions for "${title}"**\n\n1. How do the main topics (${topicList || "core themes"}) apply to our current workflow?\n2. What gaps or open items does the document leave unresolved?\n3. Which external references should we validate against this source?\n4. Who should own follow-up actions based on section "${sectionRef?.title ?? "1"}"?`;
  } else if (q.includes("define")) {
    const term = sourceGuide?.topics?.[0]?.label ?? title;
    answer = `**"${term}" in context of "${title}"**\n\n${sourceGuide?.summary ?? `This term relates to the document's focus on ${topicList}.`}\n\nRelated concepts: ${(sourceGuide?.concepts ?? []).slice(0, 5).join(", ")}`;
  } else {
    answer = `Based on **"${title}"** only:\n\n${sourceGuide?.summary ?? "The document addresses the topics in your Source Guide."}\n\nRelevant section: ${sectionRef ? `"${sectionRef.title}" — ${sectionRef.excerpt}` : "browse sections in the guide."}\n\nTopics covered: ${topicList}.`;
  }

  return { content: `${answer} [1]`, citations };
}
