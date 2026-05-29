import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SYNC_COACH_STORAGE_KEY } from "@/components/features/knowledge/hubFileSyncUtils";

export function HubSyncCoachMark({ visible, onDismiss }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShow(false);
      return;
    }
    try {
      const dismissed = localStorage.getItem(SYNC_COACH_STORAGE_KEY) === "1";
      setShow(!dismissed);
    } catch {
      setShow(visible);
    }
  }, [visible]);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem(SYNC_COACH_STORAGE_KEY, "1");
    } catch {
      /* private mode */
    }
    setShow(false);
    onDismiss?.();
  }

  return (
    <Alert className="border-primary/30 bg-primary/5">
      <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span>
          <span className="font-medium text-foreground">Save cloud files to your knowledge base.</span>{" "}
          Click the link icon next to each OneDrive file to download it for your agents.
        </span>
        <Button type="button" size="sm" variant="secondary" onClick={dismiss}>
          Got it
        </Button>
      </AlertDescription>
    </Alert>
  );
}
