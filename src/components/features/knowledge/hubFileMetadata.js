import { extractDocumentMarkdown } from "@/components/features/knowledge/hubDocumentExtraction";
import { extractEpubMetadata } from "@/lib/hubEpub";
import { formatMediaDuration, generateHubFileThumbnail } from "@/lib/hubThumbnail";
import { getDocumentPreviewKind } from "@/lib/projectDocumentPreview";

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
 * @property {string} [thumbnailDataUrl]
 * @property {number} [durationSeconds]
 * @property {string} [durationLabel]
 * @property {string} [resolution]
 * @property {string[]} [genres]
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
  const cleaned = normalizeContentText(text);
  if (!cleaned) return null;
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen).trim()}…`;
}

function normalizeContentText(text) {
  return (text ?? "")
    .replace(/^#+\s+/gm, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\*\*/g, "")
    .replace(/\|/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractHtmlTitle(text) {
  const match = (text ?? "").match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() || null;
}

function detectLanguageFromText(text) {
  const sample = normalizeContentText(text).slice(0, 2500);
  if (!sample || sample.length < 12) return "English";

  const lower = sample.toLowerCase();
  const englishHints = /\b(the|and|for|with|this|that|from|document|page|section)\b/g;
  const englishHits = (lower.match(englishHints) ?? []).length;
  if (englishHits >= 3) return "English";

  if (/[\u0400-\u04FF]/.test(sample)) return "Russian";
  if (/[\u4E00-\u9FFF]/.test(sample)) return "Chinese";
  if (/[\u0600-\u06FF]/.test(sample)) return "Arabic";
  if (/[\u0900-\u097F]/.test(sample)) return "Hindi";
  if (/[\u0B80-\u0BFF]/.test(sample)) return "Tamil";

  return "English";
}

function buildTypeFallbackDescription(fileName, fileType, documentType) {
  const title = parseTitleFromFileName(fileName);
  const kind = documentType?.toLowerCase() ?? "document";
  const format = fileType ?? "file";

  const openers = {
    PDF: `${title} is a PDF ${kind} in your library.`,
    Word: `${title} is a Word ${kind} with editable text content.`,
    HTML: `${title} is an HTML ${kind} with structured web content.`,
    Text: `${title} is a plain-text ${kind} ready for search and retrieval.`,
    Markdown: `${title} is a Markdown ${kind} with formatted notes or documentation.`,
    Image: `${title} is an image asset referenced by agents in this hub.`,
    Excel: `${title} is a spreadsheet with tabular data for analysis.`,
    CSV: `${title} is a CSV dataset attached for structured lookups.`,
    PowerPoint: `${title} is a presentation deck stored in this collection.`,
    Video: `${title} is a video file in your multimedia library.`,
    Audio: `${title} is an audio recording available for playback and reference.`,
    eBook: `${title} is a digital publication stored in this library.`,
  };

  const opener = openers[format] ?? `${title} is a ${format} ${kind} attached to this knowledge hub.`;
  return `${opener} It is indexed so agents can cite, summarize, and reason over its contents.`;
}

/**
 * Two–three sentence catalog blurb derived from extracted file content.
 */
export function buildFileDescription({ fileName, fileType, documentType, contentText }) {
  const normalized = normalizeContentText(contentText);
  if (normalized) {
    const sentences = normalized
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

    if (sentences.length >= 2) {
      return sentences.slice(0, 3).join(" ");
    }
    if (normalized.length >= 40) {
      const words = normalized.split(/\s+/);
      const snippet = words.slice(0, 55).join(" ");
      return words.length > 55 ? `${snippet}…` : snippet;
    }
  }

  return buildTypeFallbackDescription(fileName, fileType, documentType);
}

export function buildLocalMetadata(file, contentText = "", fileType = null) {
  const fileName = file?.name ?? "";
  const htmlTitle = extractHtmlTitle(contentText);
  const title = htmlTitle || parseTitleFromFileName(fileName);
  const words = contentText ? contentText.split(/\s+/).filter(Boolean).length : 0;
  const author = detectAuthorFromText(contentText);
  const isbn = detectIsbn(contentText) ?? detectIsbn(fileName);
  const doi = detectDoi(contentText);
  const documentType = inferDocumentType(fileName, contentText);
  const resolvedType = fileType ?? file?.type ?? null;
  const description = buildFileDescription({
    fileName,
    fileType: resolvedType,
    documentType,
    contentText,
  });

  return {
    status: "ready",
    source: "local",
    title,
    author,
    isbn,
    doi,
    documentType,
    language: detectLanguageFromText(contentText),
    description,
    wordCount: words || undefined,
    summary: buildSummary(contentText),
    tags: extractTags(contentText, fileName),
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
    description: external.description ?? local.description ?? local.summary,
    summary: local.summary ?? external.description ?? local.description,
    language: external.language ?? local.language ?? "English",
    tags: local.tags,
    wordCount: local.wordCount,
    documentType: local.documentType,
    coverUrl: external.coverUrl ?? local.coverUrl,
    thumbnailDataUrl: local.thumbnailDataUrl ?? external.thumbnailDataUrl ?? external.coverUrl,
    durationSeconds: local.durationSeconds ?? external.durationSeconds,
    durationLabel: local.durationLabel ?? external.durationLabel,
    resolution: local.resolution ?? external.resolution,
    genres: local.genres ?? external.genres,
    externalUrl: external.externalUrl,
    fetchedAt: external.fetchedAt ?? local.fetchedAt,
  };
}

async function probeImageResolution(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const dims = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = url;
    });
    if (dims.width && dims.height) return `${dims.width} × ${dims.height}`;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
  return null;
}

async function probeVideoMetadata(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const meta = await new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.addEventListener("loadedmetadata", () => {
        resolve({
          duration: Number.isFinite(video.duration) ? video.duration : undefined,
          width: video.videoWidth,
          height: video.videoHeight,
        });
      }, { once: true });
      video.addEventListener("error", reject, { once: true });
      video.src = url;
    });
    const resolution =
      meta.width && meta.height ? `${meta.width} × ${meta.height}` : undefined;
    return {
      durationSeconds: meta.duration,
      durationLabel: meta.duration != null ? formatMediaDuration(meta.duration) : undefined,
      resolution,
      documentType: "Video",
    };
  } catch {
    return {};
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function probeAudioMetadata(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const duration = await new Promise((resolve) => {
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.addEventListener("loadedmetadata", () => {
        resolve(Number.isFinite(audio.duration) ? audio.duration : undefined);
      }, { once: true });
      audio.addEventListener("error", () => resolve(undefined), { once: true });
      audio.src = url;
    });
    return {
      durationSeconds: duration,
      durationLabel: duration != null ? formatMediaDuration(duration) : undefined,
      documentType: "Audio",
    };
  } catch {
    return {};
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Full enrichment pipeline: extract text → local metadata → optional Open Library lookup.
 * @returns {Promise<HubFileMetadata>}
 */
export async function enrichHubFileMetadata({ blob, fileName, mimeType = "", file = null }) {
  const kind = getDocumentPreviewKind(fileName, mimeType || blob?.type || "");
  const hubType = file?.type ?? null;

  let mediaPatch = {};
  let epubPatch = {};
  let thumbnailPatch = {};

  if (blob) {
  if (kind === "image") {
    const resolution = await probeImageResolution(blob);
    if (resolution) mediaPatch = { resolution, documentType: "Image" };
  } else if (kind === "video") {
    mediaPatch = await probeVideoMetadata(blob);
  } else if (kind === "audio") {
    mediaPatch = await probeAudioMetadata(blob);
  } else if (kind === "epub" || hubType === "eBook") {
    const epub = await extractEpubMetadata(blob);
    if (epub) {
      epubPatch = {
        title: epub.title,
        author: epub.author,
        publisher: epub.publisher,
        publishedDate: epub.publishedDate,
        language: epub.language,
        description: epub.description,
        isbn: epub.isbn,
        coverUrl: epub.coverDataUrl,
        thumbnailDataUrl: epub.coverDataUrl,
        documentType: "Book",
        genres: ["eBook"],
      };
    }
  }

    try {
      const thumb = await generateHubFileThumbnail(blob, fileName, mimeType, file);
      if (thumb?.dataUrl) {
        thumbnailPatch.thumbnailDataUrl = thumb.dataUrl;
      }
      if (thumb?.coverUrl) thumbnailPatch.coverUrl = thumb.coverUrl;
      if (thumb?.duration != null) {
        thumbnailPatch.durationSeconds = thumb.duration;
        thumbnailPatch.durationLabel = formatMediaDuration(thumb.duration);
      }
    } catch {
      /* thumbnail optional */
    }
  }

  const isBinaryMedia = kind === "video" || kind === "audio" || kind === "image" || kind === "epub";
  const contentText =
    blob && !isBinaryMedia
      ? await extractDocumentMarkdown(blob, fileName, mimeType).catch(() => null)
      : null;

  const local = {
    ...buildLocalMetadata(file ?? { name: fileName }, contentText ?? "", hubType),
    ...mediaPatch,
    ...epubPatch,
    ...thumbnailPatch,
  };

  if (hubType === "eBook" || kind === "epub") {
    local.documentType = "Book";
    local.genres = local.genres ?? ["eBook"];
  }

  let external = null;
  if (local.isbn) {
    external = await fetchOpenLibraryByIsbn(local.isbn);
  }
  if (!external && (local.documentType === "Book" || hubType === "eBook" || kind === "epub")) {
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

/**
 * Resolve display title/author without duplicating author in the headline.
 * @returns {{ title: string, author: string | null, fileLabel: string | null }}
 */
export function getHubFileDisplayFields(file) {
  const metadata = file?.metadata ?? {};
  const fileName = file?.name ?? "";
  let title = (metadata.title ?? "").trim() || parseTitleFromFileName(fileName);
  let author = (metadata.author ?? "").trim() || null;

  if (author && title.toLowerCase().endsWith(author.toLowerCase())) {
    title = title.slice(0, title.length - author.length).replace(/[,\s–—-]+$/, "").trim();
  }

  const byMatch = title.match(/^(.+?)\s+by\s+(.+)$/i);
  if (byMatch && !author) {
    title = byMatch[1].trim();
    author = byMatch[2].trim();
  }

  const parsedName = parseTitleFromFileName(fileName);
  const fileLabel =
    fileName && parsedName !== title && fileName !== title ? fileName : null;

  return {
    title: title || fileName || "Untitled",
    author,
    fileLabel,
  };
}

function formatCatalogFileSize(kb) {
  if (kb == null || kb === 0) return null;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * Unified catalog profile for the asset detail view — merges live file fields + enriched metadata.
 */
export function getHubFileCatalogProfile(file, hubName, typeLabel) {
  const meta = file?.metadata ?? {};
  const { title, author } = getHubFileDisplayFields(file);
  const fileName = file?.name ?? "";
  const collection = file?.type ?? typeLabel ?? "File";
  const format = typeLabel ?? file?.type ?? "File";
  const fileSize = formatCatalogFileSize(file?.sizeKb);
  const documentType = meta.documentType ?? null;
  const isEnriching = meta.status === "loading";

  let description =
    meta.description?.trim() ||
    meta.summary?.trim() ||
    null;

  if (!description && !isEnriching) {
    description = buildFileDescription({
      fileName,
      fileType: collection,
      documentType: documentType ?? "Document",
      contentText: "",
    });
  }

  return {
    title,
    author,
    fileName,
    library: hubName || "Knowledge Hub",
    collection,
    format,
    fileSize,
    language: meta.language ?? "English",
    documentType,
    description,
    isEnriching,
    enrichFailed: meta.status === "failed",
    coverUrl: meta.coverUrl ?? meta.thumbnailDataUrl ?? null,
    thumbnailDataUrl: meta.thumbnailDataUrl ?? null,
    tags: meta.tags ?? [],
    genres: meta.genres ?? [],
    publisher: meta.publisher ?? null,
    publishedDate: meta.publishedDate ?? null,
    isbn: meta.isbn ?? null,
    durationLabel: meta.durationLabel ?? null,
    durationSeconds: meta.durationSeconds ?? null,
    resolution: meta.resolution ?? null,
    wordCount: meta.wordCount ?? null,
    source: meta.source ?? null,
    uploadedAt: file?.uploadedAt ?? null,
  };
}
