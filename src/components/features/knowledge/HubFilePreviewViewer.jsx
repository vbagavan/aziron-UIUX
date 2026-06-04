import { useEffect, useRef, useState } from "react";
import { CloudDownload, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { extractDocumentMarkdown } from "@/components/features/knowledge/hubDocumentExtraction";
import { HubSourceGuideView } from "@/components/features/knowledge/HubSourceGuideView";
import {
  createPendingSourceGuide,
  generateSourceGuide,
} from "@/components/features/knowledge/hubSourceGuide";
import {
  getDocumentPreviewKind,
  normalizePreviewBlob,
} from "@/lib/projectDocumentPreview";
import {
  getKnowledgeHubFile,
  knowledgeHubBlobKey,
} from "@/lib/knowledgeHubFileStorage";
import { getHubFileSourceLabel, getHubFileStatus } from "@/data/knowledgeHubs";
import { cn } from "@/lib/utils";

function revokeRef(urlRef) {
  if (urlRef.current) {
    URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }
}

/**
 * @param {{
 *   hubId: number | string,
 *   file: object,
 *   allFiles?: object[],
 *   showDemoStatuses?: boolean,
 *   onRequestDownload?: () => void,
 *   onQuickPrompt?: (prompt: string, file: object) => void,
 *   onSourceGuideReady?: (fileId: string, guide: object) => void,
 *   className?: string,
 * }} props
 */
export function HubFilePreviewViewer({
  hubId,
  file,
  allFiles = [],
  showDemoStatuses = false,
  onRequestDownload,
  onQuickPrompt,
  onSourceGuideReady,
  className,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [markdownContent, setMarkdownContent] = useState(null);
  const [previewKind, setPreviewKind] = useState("unsupported");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isDemoPreview, setIsDemoPreview] = useState(false);
  const [sourceGuide, setSourceGuide] = useState(() => file.sourceGuide ?? null);
  const [guideLoading, setGuideLoading] = useState(
    () => !file.sourceGuide || file.sourceGuide?.status === "loading",
  );

  const previewUrlRef = useRef(null);
  const downloadUrlRef = useRef(null);

  const status = getHubFileStatus(file, { includeDemoStatuses: showDemoStatuses });
  const needsDownload =
    file.source === "cloud" && (status === "linked" || status === "failed");

  useEffect(() => {
    setSourceGuide(file.sourceGuide ?? null);
    setGuideLoading(!file.sourceGuide || file.sourceGuide?.status === "loading");
  }, [file.id, file.sourceGuide]);

  useEffect(() => {
    let cancelled = false;
    const fileId = file.id;

    async function load() {
      setLoading(true);
      setError(null);
      setMarkdownContent(null);
      setPreviewSrc(null);
      setDownloadUrl(null);
      setIsDemoPreview(false);
      revokeRef(previewUrlRef);
      revokeRef(downloadUrlRef);

      if (needsDownload) {
        setLoading(false);
        return;
      }

      try {
        const storageId =
          file.localBlobId ?? knowledgeHubBlobKey(hubId, file.id);
        const record = await getKnowledgeHubFile(storageId);

        if (cancelled || fileId !== file.id) return;

        if (!record?.blob) {
          if (file.isSampleDemo || file.source === "demo") {
            setIsDemoPreview(true);
            setPreviewKind(getDocumentPreviewKind(file.name, file.type ?? ""));
            const demoText = `Demo document: ${file.name}\n\nThis sample file represents content stored in your knowledge hub. Topics include onboarding, product documentation, and operational procedures.`;
            setMarkdownContent(demoText);
            if (!file.sourceGuide || file.sourceGuide.status === "loading") {
              setGuideLoading(true);
              const guide = await generateSourceGuide({
                text: demoText,
                fileName: file.name,
                metadata: file.metadata,
                allFiles,
              });
              if (!cancelled) {
                setSourceGuide(guide);
                setGuideLoading(false);
                onSourceGuideReady?.(file.id, guide);
              }
            }
            return;
          }
          setError(
            file.source === "cloud"
              ? "Save this cloud file to your knowledge base to open its Source Guide."
              : "File content is not available. Re-upload the document.",
          );
          return;
        }

        const blob = normalizePreviewBlob(record.blob, file.name);
        const mime = record.fileType ?? blob.type ?? "";
        const kind = getDocumentPreviewKind(file.name, mime);
        setPreviewKind(kind);

        if (kind === "doc-legacy") {
          const dl = URL.createObjectURL(blob);
          downloadUrlRef.current = dl;
          setDownloadUrl(dl);
          setError(
            "Legacy .doc files cannot be previewed in the browser. Download the file or upload a .docx or PDF version.",
          );
          return;
        }

        let extracted = null;
        if (kind !== "image") {
          try {
            extracted = await extractDocumentMarkdown(blob, file.name, mime);
          } catch {
            extracted = null;
          }
        }

        if (kind === "image" || kind === "pdf") {
          const url = URL.createObjectURL(blob);
          previewUrlRef.current = url;
          downloadUrlRef.current = url;
          setPreviewSrc(url);
          setDownloadUrl(url);
        } else {
          const dl = URL.createObjectURL(blob);
          downloadUrlRef.current = dl;
          setDownloadUrl(dl);
          if (extracted) setMarkdownContent(extracted);
        }

        if (cancelled || fileId !== file.id) return;

        const cachedGuide =
          file.sourceGuide?.status === "ready" ? file.sourceGuide : null;
        if (cachedGuide) {
          setSourceGuide(cachedGuide);
          setGuideLoading(false);
        } else {
          setGuideLoading(true);
          const guide = await generateSourceGuide({
            text: extracted ?? (await blob.text().catch(() => "")),
            fileName: file.name,
            metadata: file.metadata,
            allFiles,
          });
          if (!cancelled && fileId === file.id) {
            setSourceGuide(guide);
            setGuideLoading(false);
            onSourceGuideReady?.(file.id, guide);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? "Could not load Source Guide.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
      revokeRef(previewUrlRef);
      revokeRef(downloadUrlRef);
    };
  }, [
    file.id,
    file.name,
    file.localBlobId,
    file.source,
    file.isSampleDemo,
    file.metadata,
    file.sourceGuide,
    hubId,
    needsDownload,
    allFiles,
    onSourceGuideReady,
  ]);

  if (needsDownload) {
    return (
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center",
          className,
        )}
      >
        <CloudDownload className="size-10 text-muted-foreground" strokeWidth={1.25} aria-hidden />
        <div className="max-w-sm space-y-1">
          <p className="text-sm font-medium text-foreground">{file.name}</p>
          <p className="text-sm text-muted-foreground">
            This file is linked from {getHubFileSourceLabel(file)} but not saved locally yet.
            Save it to generate a Source Guide and use document search in chat.
          </p>
        </div>
        {onRequestDownload ? (
          <Button type="button" size="sm" className="gap-1.5" onClick={onRequestDownload}>
            <CloudDownload className="size-4" aria-hidden />
            Save &amp; generate guide
          </Button>
        ) : null}
      </div>
    );
  }

  if (loading && !sourceGuide) {
    return (
      <div className={cn("flex flex-1 flex-col items-center justify-center gap-3 py-12", className)}>
        <Spinner className="text-primary" />
        <p className="text-sm text-muted-foreground">Loading Source Guide…</p>
      </div>
    );
  }

  if (error && !sourceGuide && !markdownContent && !previewSrc) {
    return (
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center",
          className,
        )}
      >
        <FileText className="size-10 shrink-0 text-muted-foreground" strokeWidth={1.25} aria-hidden />
        <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
        {downloadUrl ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            render={
              <a href={downloadUrl} download={file.name} rel="noreferrer" />
            }
          >
            <ExternalLink data-icon="inline-start" />
            Download file
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <HubSourceGuideView
      file={file}
      sourceGuide={sourceGuide ?? createPendingSourceGuide()}
      guideLoading={guideLoading}
      metadata={file.metadata}
      markdownContent={markdownContent}
      previewKind={previewKind}
      previewSrc={previewSrc}
      onQuickPrompt={(prompt) => onQuickPrompt?.(prompt, file)}
      className={className}
    />
  );
}
