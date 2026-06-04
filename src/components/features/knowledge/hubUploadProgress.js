export function formatUploadBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(2)} MB`;
  }
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export function createPendingUploadEntry(file, index = 0) {
  return {
    id: `pending-${Date.now()}-${index}-${file.name}`,
    file,
    name: file.name,
    total: file.size,
    loaded: 0,
    progress: 0,
    status: "uploading",
  };
}

export function getUploadTotals(uploads) {
  const active = (uploads ?? []).filter((u) => u.status === "uploading");
  const totalBytes = active.reduce((sum, u) => sum + (u.total ?? 0), 0);
  const loadedBytes = active.reduce((sum, u) => sum + (u.loaded ?? 0), 0);
  return { totalBytes, loadedBytes, count: active.length };
}

export function fileNameToTypeIcon(name) {
  const ext = (name ?? "").split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "📄";
  if (["doc", "docx", "txt", "md"].includes(ext)) return "📝";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["ppt", "pptx"].includes(ext)) return "📽️";
  return "📁";
}
