import { Check, ChevronDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function BrandMark({ src, className }) {
  return (
    <img src={src} alt="" draggable={false} className={cn("object-contain", className)} />
  );
}

/**
 * Switch between cloud storage connections (OneDrive accounts, etc.) while picking files.
 */
export function CloudConnectionSwitcher({
  logo,
  connections = [],
  activeConnection,
  onSelectConnection,
  onAddConnection,
  addConnectionLabel = "Add another connection",
  accountsLabel = "Accounts",
  className,
}) {
  const active = activeConnection ?? connections[0];
  const displayName = active?.name ?? "connection";
  const canSwitch = connections.length > 1 || onAddConnection;

  if (!canSwitch) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5",
          className,
        )}
      >
        <BrandMark src={logo} className="size-6" />
        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
          Pick files from {displayName}
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton={false}
        render={
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
            aria-label={`Switch account. Current: ${displayName}`}
          />
        }
      >
        <BrandMark src={logo} className="size-6 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
          Pick files from {displayName}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[280px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {accountsLabel}
          </DropdownMenuLabel>
          {connections.map((conn) => {
            const isActive = conn.id === active?.id;
            return (
              <DropdownMenuItem
                key={conn.id}
                onClick={() => onSelectConnection?.(conn)}
                className="flex items-center justify-between gap-2"
              >
                <span className="min-w-0 truncate">{conn.name}</span>
                {isActive ? <Check className="size-4 shrink-0 text-primary" aria-hidden /> : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        {onAddConnection ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onAddConnection} className="gap-2">
              <Plus className="size-4" aria-hidden />
              {addConnectionLabel}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
