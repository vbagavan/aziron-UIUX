import { useEffect, useRef, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  getDocumentPreviewKind,
  normalizePreviewBlob,
} from "@/lib/projectDocumentPreview";
import { getFileFromStorage } from "@/lib/projectFileStorage";
import { cn } from "@/lib/utils";

async function resolveBlob(upload) {
  if (upload.file instanceof File) {
    return {
      blob: normalizePreviewBlob(upload.file, upload.fileName),
      mime: upload.file.type ?? "",
    };
  }
  const record = await getFileFromStorage(upload.id);
  if (!record) {
    throw new Error("File not found. Re-upload the document to preview it.");
  }
  return {
    blob: normalizePreviewBlob(record.blob, upload.fileName),
    mime: record.fileType ?? "",
  };
}

function revokeRef(urlRef) {
  if (urlRef.current) {
    URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }
}

/**
 * @param {{
 *   upload: { id: string, file?: File, fileName: string, previewUrl?: string | null },
 *   className?: string,
 * }} props
 */
export function ProjectDocumentPreviewViewer({ upload, className }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [docxHtml, setDocxHtml] = useState(null);
  const [previewKind, setPreviewKind] = useState("unsupported");
  const [downloadUrl, setDownloadUrl] = useState(null);

  const previewUrlRef = useRef(null);
  const downloadUrlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const uploadId = upload.id;

    async function load() {
      setLoading(true);
      setError(null);
      setDocxHtml(null);
      setPreviewSrc(null);
      setDownloadUrl(null);
      revokeRef(previewUrlRef);
      revokeRef(downloadUrlRef);

      try {
        const { blob, mime } = await resolveBlob(upload);
        if (cancelled || uploadId !== upload.id) return;

        const kind = getDocumentPreviewKind(upload.fileName, mime);
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

        if (kind === "image" || kind === "pdf") {
          const url = URL.createObjectURL(blob);
          previewUrlRef.current = url;
          downloadUrlRef.current = url;
          setPreviewSrc(url);
          setDownloadUrl(url);
          return;
        }

        if (kind === "docx") {
          const arrayBuffer = await blob.arrayBuffer();
          if (cancelled || uploadId !== upload.id) return;

          const mammoth = await import("mammoth");
          const result = await mammoth.convertToHtml({ arrayBuffer });
          if (cancelled || uploadId !== upload.id) return;

          const html = result.value?.trim();
          if (!html) {
            setError("This document has no readable preview content.");
          } else {
            setDocxHtml(html);
          }

          const dl = URL.createObjectURL(blob);
          downloadUrlRef.current = dl;
          setDownloadUrl(dl);
          return;
        }

        const dl = URL.createObjectURL(blob);
        downloadUrlRef.current = dl;
        setDownloadUrl(dl);
        setError("In-browser preview is not supported for this file type.");
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? "Could not load document preview.");
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
  }, [upload.id, upload.fileName]);

  if (loading) {
    return (
      <div className={cn("flex flex-1 flex-col items-center justify-center gap-3 py-12", className)}>
        <Spinner className="text-primary" />
        <p className="text-sm text-muted-foreground">Loading preview…</p>
      </div>
    );
  }

  if (error && !docxHtml && !previewSrc) {
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
              <a href={downloadUrl} download={upload.fileName} rel="noreferrer" />
            }
          >
            <ExternalLink data-icon="inline-start" />
            Download file
          </Button>
        ) : null}
      </div>
    );
  }

  if (previewKind === "pdf" && previewSrc) {
    return (
      <div className={cn("flex min-h-0 w-full flex-1 flex-col", className)}>
        <iframe
          title={`Preview of ${upload.fileName}`}
          src={previewSrc}
          className="min-h-[min(480px,55vh)] w-full flex-1 rounded-lg border border-border bg-background"
        />
      </div>
    );
  }

  if (previewKind === "image" && previewSrc) {
    return (
      <div className={cn("flex w-full flex-1 items-center justify-center p-2", className)}>
        <img
          src={previewSrc}
          alt={`Preview of ${upload.fileName}`}
          className="max-h-[min(480px,55vh)] w-full rounded-lg border border-border object-contain"
        />
      </div>
    );
  }

  if (previewKind === "docx" && docxHtml) {
    return (
      <div
        className={cn(
          "min-h-0 w-full flex-1 overflow-y-auto rounded-lg border border-border bg-background p-6",
          className,
        )}
      >
        <article
          className="document-preview-html max-w-none text-sm leading-relaxed text-foreground [&_h1]:mb-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_p]:mb-3 [&_p]:leading-relaxed [&_table]:mb-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:p-2 [&_th]:text-left [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: docxHtml }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center",
        className,
      )}
    >
      <FileText className="size-10 shrink-0 text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground">No preview available.</p>
    </div>
  );
}
