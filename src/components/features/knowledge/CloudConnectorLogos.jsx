import { createElement } from "react";
import { Cloud } from "lucide-react";

import { KNOWLEDGE_HUB_CLOUD_PROVIDERS } from "@/components/features/knowledge/cloud/knowledgeHubCloudProviders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CONNECTOR_LOGOS } from "@/components/features/knowledge/connectorLogos";
import { cn } from "@/lib/utils";

export { CONNECTOR_LOGOS };

function BrandLogo({ src, className }) {
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className={cn("size-10 object-contain", className)}
    />
  );
}

export function GoogleDriveLogo({ className }) {
  return <BrandLogo src={CONNECTOR_LOGOS.googleDrive} className={className} />;
}

export function OneDriveLogo({ className }) {
  return <BrandLogo src={CONNECTOR_LOGOS.onedrive} className={className} />;
}

function DropboxLogo({ className }) {
  return <BrandLogo src={CONNECTOR_LOGOS.dropbox} className={className} />;
}

function BoxLogo({ className }) {
  return (
    <BrandLogo
      src={CONNECTOR_LOGOS.box}
      className={cn("h-8 w-auto max-w-[72px] max-h-10", className)}
    />
  );
}

function AtlassianLogo({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-10", className)} aria-hidden>
      <path
        fill="#1868DB"
        d="M11.53 2c-.2 0-.4.1-.5.3L2.3 18.2c-.2.3 0 .8.4.8h4.1c.2 0 .4-.1.5-.3l1.2-2.1c.1-.2.3-.3.5-.3h5.1c.2 0 .4.1.5.3l1.2 2.1c.1.2.3.3.5.3h4.1c.4 0 .6-.5.4-.8L12.03 2.3c-.1-.2-.3-.3-.5-.3h-.01ZM12 8.2l1.8 3.2h-3.6L12 8.2Z"
      />
    </svg>
  );
}

const LOGO_BY_PROVIDER = {
  "google-drive": GoogleDriveLogo,
  onedrive: OneDriveLogo,
  dropbox: DropboxLogo,
  box: BoxLogo,
};

const CONNECTORS = [
  ...KNOWLEDGE_HUB_CLOUD_PROVIDERS.map((p) => ({
    id: p.id,
    label: p.label,
    icon: LOGO_BY_PROVIDER[p.id],
    enabled: p.enabled,
    recommended: p.recommended,
  })),
  { id: "atlassian", label: "Atlassian", icon: AtlassianLogo, enabled: false },
];

function ConnectorTile({ id, label, icon, enabled, recommended, onSelect }) {
  if (enabled && onSelect) {
    return (
      <li className="flex flex-col items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          className="relative flex size-[72px] items-center justify-center rounded-xl p-3"
          onClick={() => onSelect(id)}
          aria-label={`Connect ${label}${recommended ? " (recommended)" : ""}`}
        >
          {icon ? createElement(icon) : null}
        </Button>
        {recommended && (
          <Badge variant="secondary" className="text-[10px]">
            Recommended
          </Badge>
        )}
      </li>
    );
  }

  return (
    <li className="flex flex-col items-center gap-1">
      <Tooltip>
        <TooltipTrigger
          render={
            <div
              className="flex size-[72px] cursor-not-allowed items-center justify-center rounded-xl border border-border bg-background p-3 opacity-60 shadow-sm"
              tabIndex={0}
              aria-label={`${label} — coming soon`}
            >
              {icon ? createElement(icon) : null}
            </div>
          }
        />
        <TooltipContent>{label} — coming soon</TooltipContent>
      </Tooltip>
    </li>
  );
}

export function CloudConnectorLogoRow({ className, onConnectorSelect }) {
  return (
    <TooltipProvider delay={200}>
      <section
        className={cn(
          "flex w-full max-w-[344px] flex-col overflow-hidden rounded-lg border border-border bg-card",
          className,
        )}
        aria-labelledby="cloud-connectors-title"
      >
        <div className="flex items-start gap-2.5 border-b border-border bg-muted/40 px-3 py-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
            <Cloud className="text-muted-foreground" aria-hidden />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h3 id="cloud-connectors-title" className="text-sm font-semibold text-foreground">
              Cloud connectors
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Import files from your cloud drives. OneDrive is recommended for most teams; more
              connectors are rolling out.
            </p>
          </div>
        </div>

        <ul
          className="flex flex-wrap items-start justify-center gap-3 px-4 py-4"
          aria-label="Cloud storage connectors"
        >
          {CONNECTORS.map(({ id, label, icon, enabled, recommended }) => (
            <ConnectorTile
              key={id}
              id={id}
              label={label}
              icon={icon}
              enabled={enabled}
              recommended={recommended}
              onSelect={onConnectorSelect}
            />
          ))}
        </ul>

        <p className="border-t border-border bg-muted/25 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          {onConnectorSelect ? (
            <>
              Pick an enabled cloud drive above, or{" "}
              <span className="font-medium text-foreground">upload from computer</span> on the left.
            </>
          ) : (
            <>
              Connectors are not enabled in this prototype. Use upload from computer on the left.
            </>
          )}
        </p>
      </section>
    </TooltipProvider>
  );
}
