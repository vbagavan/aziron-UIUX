import { useEffect, useRef, useState } from "react";
import { KnowledgeHubPicker } from "@/components/common/KnowledgeHubPicker";
import { cn } from "@/lib/utils";

export function toPickerHubs(hubs) {
  return (hubs ?? []).map((hub) => ({
    id: hub.id,
    name: hub.name,
    fileCount: (hub.userFiles ?? []).length || hub.files || 0,
  }));
}

export function KnowledgeHubSearchPicker({
  hubs,
  onSelect,
  onRequestCreate,
  renderTrigger,
  align = "end",
  placement = "bottom",
  className,
  emptyHint,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function toggle() {
    setOpen((prev) => !prev);
  }

  function close() {
    setOpen(false);
  }

  const pickerHubs = toPickerHubs(hubs);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {renderTrigger({ open, toggle, close })}
      {open ? (
        <div
          className={cn(
            "absolute z-50",
            align === "end" && "right-0",
            align === "center" && "left-1/2 -translate-x-1/2",
            align === "start" && "left-0",
            placement === "top" ? "bottom-[calc(100%+4px)]" : "top-[calc(100%+4px)]",
          )}
        >
          <KnowledgeHubPicker
            hubs={pickerHubs}
            emptyHint={emptyHint}
            onSelect={(hub) => {
              onSelect?.(hub);
              close();
            }}
            onClose={close}
            onRequestCreate={() => {
              onRequestCreate?.();
              close();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
