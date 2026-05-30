import { useMemo, useState } from "react";
import { Vault, ChevronDown, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useVault } from "@/context/VaultContext";
import { VAULT_SCOPE_LABELS } from "@/data/vaultSecrets";
import { getSharedVaultLabelsForPublish } from "@/lib/agentPublishPreview";

function VaultPublicationBadge({ marketplacePublished }) {
  if (marketplacePublished) {
    return (
      <Badge
        className="h-5 shrink-0 border-success-ring bg-success px-1.5 text-xs font-medium text-success-foreground"
      >
        Published
      </Badge>
    );
  }
  return (
    <Badge
      className="h-5 shrink-0 border-warning-ring bg-warning px-1.5 text-xs font-medium text-warning-foreground"
    >
      Not published
    </Badge>
  );
}

/**
 * Lists shared vault variables used by an agent or flow in publish confirmation dialogs.
 * @param {{ source: object, kind?: "agent" | "flow", listId?: string }} props
 */
export default function PublishSharedVaultVariablesSection({
  source,
  kind = "flow",
  listId = "publish-shared-vault-list",
}) {
  const { secrets } = useVault();
  const variables = useMemo(
    () => getSharedVaultLabelsForPublish(source, kind, secrets),
    [source, kind, secrets],
  );
  const vaultCount = variables.length;
  const unpublishedCount = variables.filter((v) => !v.marketplacePublished).length;
  const [vaultExpanded, setVaultExpanded] = useState(
    vaultCount <= 3 || unpublishedCount > 0,
  );

  return (
    <>
      <Separator className="my-3" />
      <div className="flex gap-3">
        <Vault className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1 text-left">
          <p className="font-medium text-foreground">
            Shared vault variables
            {vaultCount > 0 && (
              <span className="font-normal text-muted-foreground"> ({vaultCount})</span>
            )}
          </p>
          {vaultCount === 0 ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              No shared workspace or project variables are referenced in this {kind === "agent" ? "agent" : "flow"}.
            </p>
          ) : (
            <>
              {unpublishedCount > 0 && (
                <div className="mt-2 flex gap-2 rounded-md border border-warning-ring bg-muted px-2.5 py-2">
                  <AlertTriangle className="mt-0.5 shrink-0 text-warning" aria-hidden />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {unpublishedCount} variable{unpublishedCount !== 1 ? "s" : ""} not published
                    </span>
                    {" "}
                    — other users can run this {kind === "agent" ? "agent" : "flow"}, but unpublished
                    variables must be published in Vault before they can bind them in their workspace.
                  </p>
                </div>
              )}
              {vaultCount > 3 && (
                <button
                  type="button"
                  aria-expanded={vaultExpanded}
                  aria-controls={listId}
                  onClick={() => setVaultExpanded((prev) => !prev)}
                  className="mt-2 flex items-center gap-1 text-xs text-primary underline-offset-2 transition-colors hover:underline"
                >
                  <span>
                    {vaultExpanded ? "Hide variables" : `Show ${vaultCount} variables`}
                    {!vaultExpanded && unpublishedCount > 0
                      ? ` · ${unpublishedCount} not published`
                      : ""}
                  </span>
                  <ChevronDown
                    className={cn("transition-transform", vaultExpanded && "rotate-180")}
                  />
                </button>
              )}
              {vaultExpanded && (
                <ul id={listId} className="mt-1.5 flex flex-col gap-2.5 text-xs leading-relaxed">
                  {variables.map(({ label, key, variableRef, marketplacePublished, secretType }) => (
                    <li key={key} className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-foreground">{label}</span>
                        <VaultPublicationBadge marketplacePublished={marketplacePublished} />
                        {secretType ? (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs font-normal">
                            {VAULT_SCOPE_LABELS[secretType] ?? secretType}
                          </Badge>
                        ) : null}
                      </div>
                      <span className="font-mono text-muted-foreground">{variableRef}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Secret values are never exposed — only{" "}
                <span className="font-mono text-foreground">{"{{variable}}"}</span> references are shown.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
