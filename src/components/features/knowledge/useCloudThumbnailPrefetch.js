import { useEffect, useRef } from "react";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";
import { prefetchCloudFileThumbnail } from "@/lib/hubCloudThumbnail";
import { isCloudFileLinked } from "@/data/knowledgeHubs";

/**
 * Background-fetch cloud previews for linked files and cache thumbnailDataUrl in metadata.
 */
export function useCloudThumbnailPrefetch(hubId, files) {
  const { updateHubFile } = useKnowledgeHubs();
  const inflight = useRef(new Set());

  useEffect(() => {
    if (!hubId || !files?.length) return;

    for (const file of files) {
      if (!isCloudFileLinked(file)) continue;
      if (file.metadata?.thumbnailDataUrl) continue;
      if (inflight.current.has(file.id)) continue;

      inflight.current.add(file.id);
      void prefetchCloudFileThumbnail(hubId, file, updateHubFile).finally(() => {
        inflight.current.delete(file.id);
      });
    }
  }, [hubId, files, updateHubFile]);
}
