/**
 * Thumbnail generation utilities for Knowledge Hub file cards.
 * Supports images, PDFs, video, audio, EPUB, and text/HTML content previews.
 */

import { extractEpubMetadata } from "@/lib/hubEpub";
import { getDocumentPreviewKind } from "@/lib/projectDocumentPreview";

let pdfjsLib = null;

const HUB_TYPE_SYNTHETIC_NAME = {
  PDF: "document.pdf",
  Image: "photo.png",
  HTML: "page.html",
  Word: "document.docx",
  Text: "notes.txt",
  Markdown: "readme.md",
  CSV: "data.csv",
  Excel: "sheet.xlsx",
  PowerPoint: "deck.pptx",
  Video: "clip.mp4",
  Audio: "track.mp3",
  eBook: "book.epub",
};

async function getPdfjsLib() {
  if (pdfjsLib) return pdfjsLib;
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  pdfjsLib = lib;
  return lib;
}

/** Resolve preview kind from filename + hub file type label. */
export function getHubFilePreviewKind(file, mimeType = "") {
  const name = file?.name ?? "";
  const mime = mimeType || file?.mimeType || "";
  const fromName = getDocumentPreviewKind(name, mime);
  if (fromName !== "unsupported") return fromName;

  const synthetic = HUB_TYPE_SYNTHETIC_NAME[file?.type];
  if (synthetic) {
    const fromType = getDocumentPreviewKind(synthetic, mime);
    if (fromType !== "unsupported") return fromType;
  }
  return "unsupported";
}

export function formatMediaDuration(seconds) {
  if (seconds == null || Number.isNaN(seconds) || !Number.isFinite(seconds)) return null;
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function stripHtmlToText(html) {
  return (html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Render readable text content as a document-style thumbnail.
 * @returns {Promise<string|null>} JPEG data URL
 */
export async function generateContentThumbnail(blob, fileName, previewKind) {
  try {
    const raw = await blob.text();
    let text = raw;
    if (previewKind === "html") text = stripHtmlToText(raw);
    if (previewKind === "csv") text = raw.replace(/,/g, ", ").slice(0, 1400);
    text = text.replace(/\s+/g, " ").trim();
    if (!text) return null;

    const canvas = document.createElement("canvas");
    const width = 480;
    const height = Math.round(width * (4 / 3));
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const margin = 36;
    const maxWidth = width - margin * 2;

    ctx.fillStyle = "#0f172a";
    ctx.font = "600 15px Inter, system-ui, sans-serif";
    const title = (fileName ?? "Document").replace(/\.[^.]+$/, "").slice(0, 48);
    ctx.fillText(title, margin, margin + 8);

    ctx.strokeStyle = "rgba(15, 23, 42, 0.08)";
    ctx.beginPath();
    ctx.moveTo(margin, margin + 20);
    ctx.lineTo(width - margin, margin + 20);
    ctx.stroke();

    ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
    ctx.font = "13px Inter, system-ui, sans-serif";
    const lines = wrapText(ctx, text.slice(0, 1600), maxWidth).slice(0, 14);
    let y = margin + 44;
    const lineHeight = 20;
    for (const line of lines) {
      ctx.fillText(line, margin, y);
      y += lineHeight;
      if (y > height - margin) break;
    }

    return canvas.toDataURL("image/jpeg", 0.92);
  } catch (err) {
    console.warn("[hubThumbnail] content render failed:", err);
    return null;
  }
}

/**
 * Render the first page of a PDF blob to a JPEG data URL.
 * @param {Blob} blob
 * @param {number} [targetWidth=480]
 * @returns {Promise<string|null>}
 */
export async function generatePdfThumbnail(blob, targetWidth = 480) {
  try {
    const lib = await getPdfjsLib();
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const naturalViewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / naturalViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);

    await page.render({
      canvasContext: canvas.getContext("2d"),
      viewport,
    }).promise;

    return canvas.toDataURL("image/jpeg", 0.92);
  } catch (err) {
    console.warn("[hubThumbnail] PDF render failed:", err);
    return null;
  }
}

/**
 * Create an object URL for an image blob.
 * Caller must revoke the URL when no longer needed.
 */
export function createImageThumbnailUrl(blob) {
  return URL.createObjectURL(blob);
}

function loadVideoElement(url) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
    };

    video.addEventListener("loadeddata", () => resolve({ video, cleanup }), { once: true });
    video.addEventListener("error", () => {
      cleanup();
      reject(new Error("video load failed"));
    }, { once: true });
    video.src = url;
  });
}

/**
 * Capture a video frame and duration.
 * @returns {Promise<{ dataUrl: string, duration?: number } | null>}
 */
export async function generateVideoThumbnail(blob, seekSeconds = 1) {
  const url = URL.createObjectURL(blob);
  try {
    const { video, cleanup } = await loadVideoElement(url);
    const duration = Number.isFinite(video.duration) ? video.duration : undefined;
    const target = duration && duration > 0 ? Math.min(seekSeconds, duration * 0.1) : seekSeconds;

    await new Promise((resolve, reject) => {
      const onSeeked = () => resolve();
      video.addEventListener("seeked", onSeeked, { once: true });
      video.addEventListener("error", reject, { once: true });
      video.currentTime = target;
    });

    const width = 480;
    const height = Math.round(width * (9 / 16));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const vw = video.videoWidth || width;
    const vh = video.videoHeight || height;
    const scale = Math.max(width / vw, height / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(video, (width - dw) / 2, (height - dh) / 2, dw, dh);

    cleanup();
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.9), duration };
  } catch (err) {
    console.warn("[hubThumbnail] video render failed:", err);
    URL.revokeObjectURL(url);
    return null;
  }
}

function parseId3Picture(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (arrayBuffer.byteLength < 10) return null;
  const id3 = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2));
  if (id3 !== "ID3") return null;

  const tagSize =
    ((view.getUint8(6) & 0x7f) << 21) |
    ((view.getUint8(7) & 0x7f) << 14) |
    ((view.getUint8(8) & 0x7f) << 7) |
    (view.getUint8(9) & 0x7f);

  let offset = 10;
  const end = Math.min(arrayBuffer.byteLength, 10 + tagSize);

  while (offset + 10 < end) {
    const frameId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3),
    );
    const frameSize = view.getUint32(offset + 4);
    offset += 10;
    if (frameSize <= 0) break;

    if (frameId === "APIC" || frameId === "PIC ") {
      const frame = new Uint8Array(arrayBuffer, offset, frameSize);
      let pos = 1; // encoding
      while (pos < frame.length && frame[pos] !== 0) pos += 1;
      pos += 1;
      while (pos < frame.length && frame[pos] !== 0) pos += 1;
      pos += 1;
      const imageData = frame.slice(pos);
      if (imageData.length > 0) return imageData;
    }

    offset += frameSize;
  }

  return null;
}

function generateAudioArtThumbnail(title, artist) {
  const canvas = document.createElement("canvas");
  const width = 480;
  const height = Math.round(width * (4 / 3));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#ec4899");
  gradient.addColorStop(1, "#8b5cf6");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.38, 56, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 18px Inter, system-ui, sans-serif";
  const label = (title ?? "Audio").slice(0, 42);
  ctx.fillText(label, 36, height - 72, width - 72);

  if (artist) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "14px Inter, system-ui, sans-serif";
    ctx.fillText(artist.slice(0, 48), 36, height - 44, width - 72);
  }

  return canvas.toDataURL("image/jpeg", 0.9);
}

/**
 * @returns {Promise<{ dataUrl: string, duration?: number } | null>}
 */
export async function generateAudioThumbnail(blob, fileName, title, artist) {
  try {
    const buffer = await blob.arrayBuffer();
    const picture = parseId3Picture(buffer);
    if (picture?.length) {
      const imageBlob = new Blob([picture], { type: "image/jpeg" });
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });
      return { dataUrl: typeof dataUrl === "string" ? dataUrl : null };
    }
  } catch {
    /* generated art fallback */
  }

  const url = URL.createObjectURL(blob);
  try {
    const duration = await new Promise((resolve) => {
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.addEventListener("loadedmetadata", () => {
        resolve(Number.isFinite(audio.duration) ? audio.duration : undefined);
        URL.revokeObjectURL(url);
      }, { once: true });
      audio.addEventListener("error", () => {
        URL.revokeObjectURL(url);
        resolve(undefined);
      }, { once: true });
      audio.src = url;
    });

    const dataUrl = generateAudioArtThumbnail(
      title ?? fileName?.replace(/\.[^.]+$/, ""),
      artist,
    );
    return dataUrl ? { dataUrl, duration } : null;
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }
}

/**
 * @returns {Promise<{ dataUrl?: string, coverUrl?: string, duration?: number } | null>}
 */
export async function generateEpubThumbnail(blob) {
  const meta = await extractEpubMetadata(blob);
  if (meta?.coverDataUrl) {
    return { dataUrl: meta.coverDataUrl, coverUrl: meta.coverDataUrl };
  }
  return null;
}

/**
 * Unified thumbnail generator for enrichment + live cards.
 * @returns {Promise<{ dataUrl: string | null, duration?: number, width?: number, height?: number, coverUrl?: string }>}
 */
export async function generateHubFileThumbnail(blob, fileName, mimeType = "", file = null) {
  const kind = getHubFilePreviewKind(file ?? { name: fileName }, mimeType);

  if (kind === "image") {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return { dataUrl };
  }

  if (kind === "pdf") {
    const dataUrl = await generatePdfThumbnail(blob);
    return { dataUrl };
  }

  if (kind === "video") {
    const result = await generateVideoThumbnail(blob);
    return { dataUrl: result?.dataUrl ?? null, duration: result?.duration };
  }

  if (kind === "audio") {
    const result = await generateAudioThumbnail(
      blob,
      fileName,
      file?.metadata?.title,
      file?.metadata?.author,
    );
    return { dataUrl: result?.dataUrl ?? null, duration: result?.duration };
  }

  if (kind === "epub") {
    const result = await generateEpubThumbnail(blob);
    return { dataUrl: result?.dataUrl ?? null, coverUrl: result?.coverUrl };
  }

  if (["text", "markdown", "html", "csv", "docx"].includes(kind)) {
    const dataUrl = await generateContentThumbnail(blob, fileName, kind);
    return { dataUrl };
  }

  return { dataUrl: null };
}
