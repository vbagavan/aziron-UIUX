import { Cloud } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const CONNECTOR_LOGOS = {
  googleDrive: "/logos/connectors/google-drive.svg",
  onedrive: "/logos/connectors/onedrive.svg",
  dropbox: "/logos/connectors/dropbox.svg",
  box: "/logos/connectors/box.svg",
};

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

const CONNECTORS = [
  { id: "google-drive", label: "Google Drive", Logo: GoogleDriveLogo, enabled: true },
  { id: "onedrive", label: "OneDrive", Logo: OneDriveLogo, enabled: true, recommended: true },
  { id: "dropbox", label: "Dropbox", Logo: DropboxLogo, enabled: false },
  { id: "box", label: "Box", Logo: BoxLogo, enabled: false },
  { id: "atlassian", label: "Atlassian", Logo: AtlassianLogo, enabled: false },
];

function ConnectorTile({ id, label, Logo, enabled, recommended, onSelect }) {
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
          <Logo />
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
            />
          }
        >
          <Logo />
        </TooltipTrigger>
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
              Import files from Google Drive or Microsoft OneDrive. OneDrive is recommended for
              most teams.
            </p>
          </div>
        </div>

        <ul
          className="flex flex-wrap items-start justify-center gap-3 px-4 py-4"
          aria-label="Cloud storage connectors"
        >
          {CONNECTORS.map(({ id, label, Logo, enabled, recommended }) => (
            <ConnectorTile
              key={id}
              id={id}
              label={label}
              Logo={Logo}
              enabled={enabled}
              recommended={recommended}
              onSelect={onConnectorSelect}
            />
          ))}
        </ul>

        <p className="border-t border-border bg-muted/25 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          {onConnectorSelect ? (
            <>
              <span className="font-medium text-foreground">Google Drive</span> or{" "}
              <span className="font-medium text-foreground">OneDrive</span> (recommended), or{" "}
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
