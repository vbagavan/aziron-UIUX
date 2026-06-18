import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HUB_FILE_CLOUD_CONNECTORS } from "@/components/features/knowledge/hubAddSourceConnectors";
import { KNOWLEDGE_TERMS } from "@/lib/knowledgeTerminology";

export function CloudProviderPickerPanel({ onBack, onSelectProvider }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          aria-label={KNOWLEDGE_TERMS.backToConnections}
        >
          <ArrowLeft aria-hidden />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">Connect cloud storage</p>
          <p className="truncate text-[11px] text-muted-foreground">
            Choose a provider to authenticate and import files
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {HUB_FILE_CLOUD_CONNECTORS.map((connector) => (
            <Button
              key={connector.id}
              type="button"
              variant="outline"
              disabled={!connector.enabled}
              className="flex h-auto flex-col items-center gap-2 p-4"
              onClick={() => onSelectProvider(connector.id)}
            >
              {connector.logo ? (
                <img
                  src={connector.logo}
                  alt=""
                  className="size-10 object-contain"
                  draggable={false}
                />
              ) : null}
              <span className="min-w-0 w-full truncate text-center text-xs font-semibold">
                {connector.label}
              </span>
              {connector.recommended ? (
                <Badge variant="secondary" className="text-[10px]">
                  Recommended
                </Badge>
              ) : null}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
