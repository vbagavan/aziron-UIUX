import { getDocumentPreviewKind } from "@/lib/projectDocumentPreview";

function isZipArchive(arrayBuffer) {
  if (!arrayBuffer || arrayBuffer.byteLength < 4) return false;
  const header = new Uint8Array(arrayBuffer.slice(0, 4));
  return header[0] === 0x50 && header[1] === 0x4b;
}

function decodeText(arrayBuffer) {
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(arrayBuffer).trim();
  } catch {
    return "";
  }
}

async function extractDocxMarkdown(arrayBuffer) {
  if (!isZipArchive(arrayBuffer)) {
    return decodeText(arrayBuffer) || null;
  }

  const mammoth = await import("mammoth");

  try {
    const markdown = await mammoth.convertToMarkdown({ arrayBuffer });
    if (markdown.value?.trim()) return markdown.value.trim();
  } catch {
    /* fall through */
  }

  try {
    const raw = await mammoth.extractRawText({ arrayBuffer });
    if (raw.value?.trim()) return raw.value.trim();
  } catch {
    /* fall through */
  }

  return null;
}

function formatCsvAsMarkdown(text) {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return null;

  const rows = lines.map((line) => line.split(",").map((cell) => cell.trim()));
  const header = rows[0];
  const body = rows.slice(1);
  const tableLines = [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
    ...body.map((row) => `| ${row.join(" | ")} |`),
  ];
  return tableLines.join("\n");
}

/**
 * Extract readable markdown/text from a stored hub file blob.
 * @returns {Promise<string | null>}
 */
export async function extractDocumentMarkdown(blob, fileName, mimeType = "") {
  const kind = getDocumentPreviewKind(fileName, mimeType || blob.type || "");

  if (kind === "markdown" || kind === "text") {
    const text = (await blob.text()).trim();
    return text || null;
  }

  if (kind === "csv") {
    const text = (await blob.text()).trim();
    return text ? formatCsvAsMarkdown(text) : null;
  }

  if (kind === "docx") {
    const arrayBuffer = await blob.arrayBuffer();
    return extractDocxMarkdown(arrayBuffer);
  }

  return null;
}
