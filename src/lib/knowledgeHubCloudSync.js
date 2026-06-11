/**
 * Prototype cloud → local KB download (simulated OneDrive / Google Drive fetch).
 */

import { getDocumentPreviewKind } from "@/lib/projectDocumentPreview";
import { mockCloudDocumentText } from "@/lib/hubCloudThumbnail";

const MIME_BY_EXT = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  html: "text/html",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  epub: "application/epub+zip",
  mp4: "video/mp4",
  mp3: "audio/mpeg",
};

function mimeFromFileName(fileName) {
  const ext = fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function createMockImageBlob(fileName) {
  const title = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Blob(["image"], { type: "image/png" });

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#0ea5e9");
  gradient.addColorStop(1, "#6366f1");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 28px Inter, system-ui, sans-serif";
  ctx.fillText(title.slice(0, 24), 40, 80);
  ctx.font = "14px Inter, system-ui, sans-serif";
  ctx.fillText("Cloud image preview", 40, 120);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? new Blob(["image"], { type: "image/png" })), "image/png", 0.92);
  });
}

/**
 * Simulates downloading a linked cloud file into a Blob for local KB storage.
 * @param {{ name: string, cloudProvider?: string, sizeKb?: number }} fileRecord
 * @param {{ previewOnly?: boolean }} [options]
 */
export async function downloadCloudFileBlob(fileRecord, options = {}) {
  const duration = options.previewOnly
    ? 200 + Math.min(400, (fileRecord.sizeKb ?? 100))
    : 900 + Math.min(1600, (fileRecord.sizeKb ?? 100) * 2);
  await delay(duration);

  const name = fileRecord.name ?? "file";
  const kind = getDocumentPreviewKind(name, mimeFromFileName(name));

  if (kind === "image") {
    return createMockImageBlob(name);
  }

  const body = mockCloudDocumentText(fileRecord);
  return new Blob([body], { type: mimeFromFileName(name) });
}
