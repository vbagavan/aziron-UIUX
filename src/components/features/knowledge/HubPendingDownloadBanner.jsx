import { Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function HubPendingDownloadBanner({
  pendingCount,
  loadingCount = 0,
  isDownloadingAll = false,
  onDownloadAll,
}) {
  if (pendingCount <= 0 && loadingCount <= 0) return null;

  return (
    <Alert>
      <Info className="size-4" />
      <AlertTitle>Files not in your knowledge base yet</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>
          {pendingCount > 0 && (
            <>
              {pendingCount} file{pendingCount === 1 ? " is" : "s are"} linked from OneDrive but
              not saved locally. Agents use files in the knowledge base — click the link icon on
              each row or download all below.
            </>
          )}
          {loadingCount > 0 && pendingCount > 0 && " "}
          {loadingCount > 0 && `${loadingCount} download${loadingCount === 1 ? "" : "s"} in progress.`}
        </span>
        {pendingCount > 0 && onDownloadAll && (
          <div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isDownloadingAll}
              onClick={onDownloadAll}
            >
              {isDownloadingAll ? (
                <>
                  <Spinner className="size-4" data-icon="inline-start" />
                  Downloading…
                </>
              ) : (
                `Download all (${pendingCount})`
              )}
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
