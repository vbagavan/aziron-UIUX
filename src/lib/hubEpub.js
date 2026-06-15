/**
 * Lightweight EPUB metadata + cover extraction (ZIP + deflate, no extra deps).
 */

function readU16(view, offset) {
  return view.getUint16(offset, true);
}

function readU32(view, offset) {
  return view.getUint32(offset, true);
}

function decodeUtf8(bytes) {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

async function inflateDeflateRaw(compressed) {
  if (typeof DecompressionStream === "undefined") return null;
  try {
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
}

async function readZipEntry(buffer, entryName) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const normalized = entryName.replace(/\\/g, "/").replace(/^\//, "");

  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i -= 1) {
    if (readU32(view, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;

  const cdOffset = readU32(view, eocd + 16);
  const cdSize = readU32(view, eocd + 12);
  let pos = cdOffset;
  const end = cdOffset + cdSize;

  while (pos < end) {
    if (readU32(view, pos) !== 0x02014b50) break;
    const compression = readU16(view, pos + 10);
    const compressedSize = readU32(view, pos + 20);
    const fileNameLen = readU16(view, pos + 28);
    const extraLen = readU16(view, pos + 30);
    const commentLen = readU16(view, pos + 32);
    const localOffset = readU32(view, pos + 42);
    const nameStart = pos + 46;
    const name = decodeUtf8(bytes.slice(nameStart, nameStart + fileNameLen));

    if (name.replace(/\\/g, "/") === normalized) {
      if (readU32(view, localOffset) !== 0x04034b50) return null;
      const localNameLen = readU16(view, localOffset + 26);
      const localExtraLen = readU16(view, localOffset + 28);
      const dataStart = localOffset + 30 + localNameLen + localExtraLen;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);

      if (compression === 0) return compressed;
      if (compression === 8) return inflateDeflateRaw(compressed);
      return null;
    }

    pos = nameStart + fileNameLen + extraLen + commentLen;
  }

  return null;
}

function parseOpfMetadata(opfXml) {
  const getMeta = (name) => {
    const re = new RegExp(`<dc:${name}[^>]*>([\\s\\S]*?)</dc:${name}>`, "i");
    const match = opfXml.match(re);
    return match?.[1]?.trim() || null;
  };

  const title = getMeta("title");
  const creator = getMeta("creator");
  const publisher = getMeta("publisher");
  const date = getMeta("date");
  const language = getMeta("language");
  const description = getMeta("description");
  const identifier = getMeta("identifier");

  let coverId = null;
  const coverMeta = opfXml.match(/<meta[^>]+name=["']cover["'][^>]+content=["']([^"']+)["']/i);
  if (coverMeta) coverId = coverMeta[1];

  const manifest = {};
  const itemRe = /<item[^>]+id=["']([^"']+)["'][^>]*>/gi;
  let itemMatch;
  while ((itemMatch = itemRe.exec(opfXml))) {
    const tag = itemMatch[0];
    const id = itemMatch[1];
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    const media = tag.match(/media-type=["']([^"']+)["']/i)?.[1];
    if (href) manifest[id] = { href, mediaType: media };
  }

  return {
    title,
    author: creator,
    publisher,
    publishedDate: date,
    language,
    description,
    isbn: identifier?.replace(/^urn:isbn:/i, "") || null,
    coverId,
    manifest,
    opfDir: "",
  };
}

function resolvePath(baseDir, href) {
  if (!href) return null;
  if (!baseDir) return href.replace(/^\//, "");
  const parts = `${baseDir}/${href}`.split("/");
  const stack = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

function stripHtml(html) {
  return (html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSpineIds(opfXml) {
  const ids = [];
  const spineBlock = opfXml.match(/<spine[^>]*>([\s\S]*?)<\/spine>/i)?.[1] ?? "";
  const refRe = /<itemref[^>]+idref=["']([^"']+)["']/gi;
  let match;
  while ((match = refRe.exec(spineBlock))) {
    ids.push(match[1]);
  }
  return ids;
}

function chapterTitleFromHtml(html, fallback) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) return stripHtml(h1).slice(0, 120) || fallback;
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (titleTag) return stripHtml(titleTag).slice(0, 120) || fallback;
  return fallback;
}

/**
 * Extract readable text and section stubs from an EPUB blob for Source Guide generation.
 * @param {Blob} blob
 * @returns {Promise<{ text: string, sections: Array<{ id: string, title: string, excerpt: string }> } | null>}
 */
export async function extractEpubGuideContent(blob) {
  try {
    const buffer = await blob.arrayBuffer();
    const containerBytes = await readZipEntry(buffer, "META-INF/container.xml");
    if (!containerBytes) return null;

    const containerXml = decodeUtf8(containerBytes);
    const rootfile = containerXml.match(/full-path=["']([^"']+)["']/i)?.[1];
    if (!rootfile) return null;

    const opfBytes = await readZipEntry(buffer, rootfile);
    if (!opfBytes) return null;

    const opfXml = decodeUtf8(opfBytes);
    const meta = parseOpfMetadata(opfXml);
    const opfDir = rootfile.includes("/") ? rootfile.replace(/\/[^/]+$/, "") : "";
    const spineIds = parseSpineIds(opfXml);

    const sections = [];
    const textParts = [];

    for (let i = 0; i < spineIds.length && sections.length < 12; i += 1) {
      const item = meta.manifest[spineIds[i]];
      if (!item?.href) continue;
      const media = item.mediaType ?? "";
      if (media && !/html|xhtml|xml/i.test(media) && !/\.x?html?$/i.test(item.href)) {
        continue;
      }

      const path = resolvePath(opfDir, item.href);
      const chapterBytes = path ? await readZipEntry(buffer, path) : null;
      if (!chapterBytes) continue;

      const html = decodeUtf8(chapterBytes);
      const plain = stripHtml(html);
      if (plain.length < 40) continue;

      const title = chapterTitleFromHtml(html, `Chapter ${sections.length + 1}`);
      const excerpt = plain.slice(0, 220) + (plain.length > 220 ? "…" : "");
      sections.push({
        id: `epub-sec-${sections.length}`,
        title,
        excerpt,
      });
      textParts.push(`${title}\n\n${plain.slice(0, 1200)}`);
    }

    if (sections.length === 0) return null;

    return {
      text: textParts.join("\n\n").slice(0, 12000),
      sections,
    };
  } catch (err) {
    console.warn("[hubEpub] guide extract failed:", err);
    return null;
  }
}

/**
 * @param {Blob} blob
 * @returns {Promise<{
 *   title?: string,
 *   author?: string,
 *   publisher?: string,
 *   publishedDate?: string,
 *   language?: string,
 *   description?: string,
 *   isbn?: string,
 *   coverDataUrl?: string,
 * } | null>}
 */
export async function extractEpubMetadata(blob) {
  try {
    const buffer = await blob.arrayBuffer();
    const containerBytes = await readZipEntry(buffer, "META-INF/container.xml");
    if (!containerBytes) return null;

    const containerXml = decodeUtf8(containerBytes);
    const rootfile = containerXml.match(/full-path=["']([^"']+)["']/i)?.[1];
    if (!rootfile) return null;

    const opfBytes = await readZipEntry(buffer, rootfile);
    if (!opfBytes) return null;

    const opfXml = decodeUtf8(opfBytes);
    const meta = parseOpfMetadata(opfXml);
    const opfDir = rootfile.includes("/") ? rootfile.replace(/\/[^/]+$/, "") : "";

    let coverDataUrl = null;
    const coverItem = meta.coverId ? meta.manifest[meta.coverId] : null;
    const coverHref =
      coverItem?.href ||
      Object.values(meta.manifest).find((item) => /cover|jacket/i.test(item.href))?.href;

    if (coverHref) {
      const coverPath = resolvePath(opfDir, coverHref);
      const imageBytes = coverPath ? await readZipEntry(buffer, coverPath) : null;
      if (imageBytes?.length) {
        const media =
          coverItem?.mediaType ||
          (coverHref.endsWith(".png")
            ? "image/png"
            : coverHref.endsWith(".gif")
              ? "image/gif"
              : "image/jpeg");
        const imageBlob = new Blob([imageBytes], { type: media });
        coverDataUrl = await blobToDataUrl(imageBlob);
      }
    }

    return {
      title: meta.title ?? undefined,
      author: meta.author ?? undefined,
      publisher: meta.publisher ?? undefined,
      publishedDate: meta.publishedDate ?? undefined,
      language: meta.language ?? undefined,
      description: meta.description ?? undefined,
      isbn: meta.isbn ?? undefined,
      coverDataUrl: coverDataUrl ?? undefined,
    };
  } catch (err) {
    console.warn("[hubEpub] extract failed:", err);
    return null;
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
