import {
  getKnowledgeHubFile,
  knowledgeHubBlobKey,
} from "@/lib/knowledgeHubFileStorage";

/**
 * Trigger a browser download for a stored hub file blob.
 * @returns {Promise<boolean>} true when download started
 */
export async function downloadHubFile(hubId, file) {
  if (!file?.id) return false;

  const storageId = file.localBlobId ?? knowledgeHubBlobKey(hubId, file.id);
  const record = await getKnowledgeHubFile(storageId);
  if (!record?.blob) return false;

  const url = URL.createObjectURL(record.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name ?? record.fileName ?? "download";
  anchor.rel = "noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}
