/** Default max upload size for documents and images. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/** Larger limit for video, audio, and ebook files. */
export const MAX_MEDIA_BYTES = 100 * 1024 * 1024;

const MEDIA_EXT =
  /\.(mp4|mov|webm|mkv|avi|m4v|mpg|mpeg|wmv|mp3|wav|m4a|aac|ogg|flac|wma|aiff|opus|epub|mobi|azw3?)$/i;

/**
 * @param {File | { name?: string, type?: string, size?: number }} file
 */
export function isMediaUploadFile(file) {
  const name = file?.name ?? "";
  const mime = (file?.type ?? "").toLowerCase();
  return (
    mime.startsWith("video/") ||
    mime.startsWith("audio/") ||
    mime === "application/epub+zip" ||
    MEDIA_EXT.test(name)
  );
}

/**
 * @param {File | { name?: string, type?: string }} file
 */
export function getMaxUploadBytes(file) {
  return isMediaUploadFile(file) ? MAX_MEDIA_BYTES : MAX_DOCUMENT_BYTES;
}

/**
 * @param {Array<File>} files
 */
export function partitionUploadFiles(files) {
  const valid = [];
  const rejected = [];
  for (const file of files) {
    if (file.size <= getMaxUploadBytes(file)) valid.push(file);
    else rejected.push(file);
  }
  return { valid, rejected };
}

export function formatMaxUploadLabel(file) {
  const mb = Math.round(getMaxUploadBytes(file) / (1024 * 1024));
  return `${mb} MB`;
}
