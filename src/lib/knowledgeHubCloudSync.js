/**
 * Prototype cloud → local KB download (simulated OneDrive fetch).
 */

const MIME_BY_EXT = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
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

/**
 * Simulates downloading a linked cloud file into a Blob for local KB storage.
 * @param {{ name: string, cloudProvider?: string, sizeKb?: number }} fileRecord
 */
export async function downloadCloudFileBlob(fileRecord) {
  const duration = 900 + Math.min(1600, (fileRecord.sizeKb ?? 100) * 2);
  await delay(duration);

  const provider = fileRecord.cloudProvider ?? "onedrive";
  const body = [
    `Local Knowledge Base copy`,
    `Source: ${provider}`,
    `Original: ${fileRecord.name}`,
    `Synced: ${new Date().toISOString()}`,
    "",
    "This is prototype content representing the downloaded file body.",
  ].join("\n");

  return new Blob([body], { type: mimeFromFileName(fileRecord.name) });
}
