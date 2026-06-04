import { extractDocumentMarkdown } from "@/components/features/knowledge/hubDocumentExtraction";

const ISBN_PATTERN =
  /\b(?:ISBN(?:-1[03])?:?\s*)?(?:97[89][- ]?)?(?:\d[- ]?){9}[\dXx]\b/g;

const DOI_PATTERN = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/gi;

const AUTHOR_PATTERNS = [
  /^author[s]?:\s*(.+)$/im,
  /^by\s+([A-Z][\w\s.,'-]{2,60})$/im,
  /^written by\s+(.+)$/im,
];

/** @typedef {'pending' | 'loading' | 'ready' | 'failed'} HubFileMetadataStatus */

/**
 * @typedef {Object} HubFileMetadata
 * @property {HubFileMetadataStatus} status
 * @property {string} [source]
 * @property {string} [title]
 * @property {string} [author]
 * @property {string} [publisher]
 * @property {string} [publishedDate]
 * @property {string} [isbn]
 * @property {string} [doi]
 * @property {string} [description]
 * @property {string[]} [tags]
 * @property {number} [wordCount]
 * @property {string} [summary]
 * @property {string} [documentType]
 * @property {string} [coverUrl]
 * @property {string} [fetchedAt]
 * @property {string} [externalUrl]
 */

export function parseTitleFromFileName(fileName) {
  const base = (fileName ?? "").replace(/\.[^.]+$/, "");
  return base
    .replace(/[_-]+/g, " ")
    .replace(/\(\d+\)$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeIsbn(raw) {
  const digits = (raw ?? "").replace(/[^\dXx]/g, "").toUpperCase();
  if (digits.length === 10 || digits.length === 13) return digits;
  return null;
}

export function detectIsbn(text) {
  const matches = (text ?? "").match(ISBN_PATTERN) ?? [];
  for (const match of matches) {
    const normalized = normalizeIsbn(match);
    if (normalized) return normalized;
  }
  return null;
}

export function detectDoi(text) {
  const match = (text ?? "").match(DOI_PATTERN);
  return match?.[0] ?? null;
}

function detectAuthorFromText(text) {
  const lines = (text ?? "").split("\n").slice(0, 40);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    for (const pattern of AUTHOR_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match?.[1]?.trim()) return match[1].trim();
    }
  }
  return null;
}

function inferDocumentType(fileName, text) {
  const lower = `${fileName} ${(text ?? "").slice(0, 500)}`.toLowerCase();
  if (/\b(isbn|publisher|chapter|edition)\b/.test(lower)) return "Book";
  if (/\b(policy|procedure|guideline|handbook)\b/.test(lower)) return "Policy";
  if (/\b(incident|response|runbook|playbook)\b/.test(lower)) return "Runbook";
  if (/\b(report|analysis|summary|review)\b/.test(lower)) return "Report";
  if (/\b(release notes|changelog|version)\b/.test(lower)) return "Release notes";
  if (/\b(faq|question)\b/.test(lower)) return "FAQ";
  if (/\b(contract|agreement|msa|nda|sow)\b/.test(lower)) return "Contract";
  return "Document";
}

function extractTags(text, fileName) {
  const corpus = `${fileName} ${(text ?? "").slice(0, 1200)}`.toLowerCase();
  const candidates = [
    "security",
    "onboarding",
    "incident",
    "product",
    "engineering",
    "finance",
    "hr",
    "compliance",
    "architecture",
    "customer",
    "support",
    "training",
    "deployment",
    "api",
  ];
  return candidates.filter((tag) => corpus.includes(tag)).slice(0, 5);
}

function buildSummary(text, maxLen = 280) {
  const cleaned = (text ?? "")
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\|/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");

  if (!cleaned) return null;
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen).trim()}…`;
}

export function buildLocalMetadata(file, contentText = "") {
  const title = parseTitleFromFileName(file?.name);
  const words = contentText ? contentText.split(/\s+/).filter(Boolean).length : 0;
  const author = detectAuthorFromText(contentText);
  const isbn = detectIsbn(contentText) ?? detectIsbn(file?.name ?? "");
  const doi = detectDoi(contentText);

  return {
    status: "ready",
    source: "local",
    title,
    author,
    isbn,
    doi,
    documentType: inferDocumentType(file?.name ?? "", contentText),
    wordCount: words || undefined,
    summary: buildSummary(contentText),
    tags: extractTags(contentText, file?.name ?? ""),
    fetchedAt: new Date().toISOString(),
  };
}

function mapOpenLibraryBook(data, isbn) {
  if (!data) return null;
  const authors = (data.authors ?? []).map((a) => a.name).filter(Boolean);
  const publishDate = data.publish_date ?? data.publishers?.[0]?.name ?? null;

  return {
    status: "ready",
    source: "openlibrary",
    title: data.title ?? undefined,
    author: authors.length > 0 ? authors.join(", ") : undefined,
    publisher: data.publishers?.[0]?.name ?? undefined,
    publishedDate: typeof publishDate === "string" ? publishDate : undefined,
    isbn: isbn ?? undefined,
    description:
      typeof data.notes === "string"
        ? data.notes
        : typeof data.subtitle === "string"
          ? data.subtitle
          : undefined,
    coverUrl: data.cover?.medium ?? data.cover?.small ?? undefined,
    externalUrl: data.url ?? (isbn ? `https://openlibrary.org/isbn/${isbn}` : undefined),
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchOpenLibraryByIsbn(isbn) {
  const normalized = normalizeIsbn(isbn);
  if (!normalized) return null;

  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${normalized}&format=json&jscmd=data`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return mapOpenLibraryBook(data[`ISBN:${normalized}`], normalized);
  } catch {
    return null;
  }
}

export async function fetchOpenLibraryByTitle(title) {
  const query = (title ?? "").trim();
  if (!query || query.length < 3) return null;

  try {
    const params = new URLSearchParams({ title: query, limit: "1" });
    const res = await fetch(`https://openlibrary.org/search.json?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    const doc = data.docs?.[0];
    if (!doc) return null;

    const isbn = doc.isbn?.[0] ? normalizeIsbn(doc.isbn[0]) : null;
    if (isbn) {
      const byIsbn = await fetchOpenLibraryByIsbn(isbn);
      if (byIsbn) return byIsbn;
    }

    return {
      status: "ready",
      source: "openlibrary",
      title: doc.title ?? query,
      author: doc.author_name?.join(", ") ?? undefined,
      publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : undefined,
      isbn: isbn ?? undefined,
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : undefined,
      externalUrl: doc.key ? `https://openlibrary.org${doc.key}` : undefined,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function mergeHubFileMetadata(local, external) {
  if (!external) return local;
  return {
    status: "ready",
    source: external.source ?? local.source,
    title: external.title ?? local.title,
    author: external.author ?? local.author,
    publisher: external.publisher ?? local.publisher,
    publishedDate: external.publishedDate ?? local.publishedDate,
    isbn: external.isbn ?? local.isbn,
    doi: local.doi ?? external.doi,
    description: external.description ?? local.summary,
    summary: local.summary ?? external.description,
    tags: local.tags,
    wordCount: local.wordCount,
    documentType: local.documentType,
    coverUrl: external.coverUrl,
    externalUrl: external.externalUrl,
    fetchedAt: external.fetchedAt ?? local.fetchedAt,
  };
}

/**
 * Full enrichment pipeline: extract text → local metadata → optional Open Library lookup.
 * @returns {Promise<HubFileMetadata>}
 */
export async function enrichHubFileMetadata({ blob, fileName, mimeType = "", file = null }) {
  const contentText = blob
    ? await extractDocumentMarkdown(blob, fileName, mimeType).catch(() => null)
    : null;

  const local = buildLocalMetadata(file ?? { name: fileName }, contentText ?? "");

  let external = null;
  if (local.isbn) {
    external = await fetchOpenLibraryByIsbn(local.isbn);
  }
  if (!external && local.documentType === "Book") {
    external = await fetchOpenLibraryByTitle(local.title);
  }

  return mergeHubFileMetadata(local, external);
}

export function getHubFileMetadataSubtitle(file) {
  const meta = file?.metadata;
  if (!meta) return null;

  if (meta.status === "loading") {
    return meta.title ? `${meta.title} · enriching…` : "Enriching metadata…";
  }

  if (meta.status === "failed") {
    return meta.documentType ?? parseTitleFromFileName(file?.name);
  }

  const parts = [];
  if (meta.author) parts.push(meta.author);
  else if (meta.documentType) parts.push(meta.documentType);
  if (meta.publishedDate) parts.push(meta.publishedDate);

  return parts.length > 0 ? parts.join(" · ") : null;
}

export function createPendingHubFileMetadata(fileName) {
  return {
    status: "loading",
    title: parseTitleFromFileName(fileName),
    fetchedAt: new Date().toISOString(),
  };
}
