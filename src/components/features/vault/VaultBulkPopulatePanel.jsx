import { useEffect, useId, useMemo, useState } from "react";
import { KeyRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVault } from "@/context/VaultContext";
import { findVaultSecretByKeyName } from "@/data/vaultSecrets";
import { detectRequiredVaultVariables } from "@/lib/vaultVariableDetection";

function VariableRow({ variable, existing, value, error, onChange, inputId }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
            {variable.variableRef}
          </code>
          {existing ? (
            <Badge variant="secondary" className="text-[10px]">
              In Vault
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{variable.label}</p>
      </div>
      {existing ? (
        <p className="text-xs text-muted-foreground">
          Already stored — update it on the Vault page if needed.
        </p>
      ) : (
        <>
          <Input
            id={inputId}
            type="password"
            autoComplete="off"
            value={value}
            aria-invalid={Boolean(error)}
            placeholder="Enter secret value"
            className="h-9"
            onChange={(e) => onChange(e.target.value)}
          />
          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

export function VaultBulkPopulatePanel({ source, kind, onComplete, onCancel }) {
  const formId = useId();
  const { secrets, addSecret } = useVault();
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState("");

  const detected = useMemo(
    () => detectRequiredVaultVariables(source, kind),
    [source, kind],
  );

  const rows = useMemo(
    () =>
      detected.map((variable) => ({
        variable,
        existing: findVaultSecretByKeyName(secrets, variable.keyName),
      })),
    [detected, secrets],
  );

  const pendingCount = rows.filter((row) => !row.existing).length;
  const inVaultCount = rows.length - pendingCount;
  const sourceName = source?.name ?? (kind === "agent" ? "this agent" : "this flow");

  useEffect(() => {
    setValues({});
    setErrors({});
    setTouched(false);
    setFormError("");
  }, [source?.id, kind]);

  function validate() {
    /** @type {Record<string, string>} */
    const nextErrors = {};
    rows.forEach(({ variable, existing }) => {
      if (existing) return;
      const value = String(values[variable.keyName] ?? "").trim();
      if (!value) nextErrors[variable.keyName] = "Enter a value for this variable.";
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    setFormError("");

    if (pendingCount === 0) {
      onComplete?.({ created: 0, skipped: rows.length });
      return;
    }

    if (!validate()) {
      setFormError("Enter values for all required variables.");
      return;
    }

    let created = 0;
    rows.forEach(({ variable, existing }) => {
      if (existing) return;
      const value = String(values[variable.keyName] ?? "").trim();
      if (!value) return;
      addSecret({
        keyName: variable.keyName,
        value,
        secretType: variable.secretType,
      });
      created += 1;
    });

    onComplete?.({ created, skipped: rows.length - created });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 dark:bg-primary/10">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">Set up vault variables</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {detected.length > 0 ? (
            <>
              {detected.length} variable{detected.length === 1 ? "" : "s"} used in{" "}
              <span className="font-medium text-foreground">{sourceName}</span>.
              {inVaultCount > 0 ? (
                <>
                  {" "}
                  {inVaultCount} already in Vault
                  {pendingCount > 0 ? ` · ${pendingCount} to add` : "."}
                </>
              ) : (
                <> Enter values once — they&apos;ll be saved for reuse.</>
              )}
            </>
          ) : (
            <>No vault variables were detected for {sourceName}.</>
          )}
        </p>
      </div>

      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        {touched && formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing to import. You can add secrets manually on the Vault page.
          </p>
        ) : (
          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
            {rows.map(({ variable, existing }) => (
              <VariableRow
                key={variable.keyName}
                variable={variable}
                existing={existing}
                value={values[variable.keyName] ?? ""}
                error={touched ? errors[variable.keyName] : undefined}
                inputId={`${formId}-${variable.keyName}`}
                onChange={(next) => {
                  setValues((prev) => ({ ...prev, [variable.keyName]: next }));
                  if (touched) {
                    setErrors((prev) => ({ ...prev, [variable.keyName]: undefined }));
                    setFormError("");
                  }
                }}
              />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Back
          </Button>
          <Button type="submit" size="sm" disabled={detected.length === 0}>
            <KeyRound data-icon="inline-start" />
            {pendingCount > 0
              ? `Save ${pendingCount} secret${pendingCount === 1 ? "" : "s"} to Vault`
              : "Done"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function getVaultPopulateSummary(source, kind, secrets) {
  const detected = detectRequiredVaultVariables(source, kind);
  const pendingCount = detected.filter(
    (variable) => !findVaultSecretByKeyName(secrets, variable.keyName),
  ).length;
  return { total: detected.length, pendingCount, inVaultCount: detected.length - pendingCount };
}
