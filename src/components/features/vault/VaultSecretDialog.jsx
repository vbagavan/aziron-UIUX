import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_VAULT_SCOPE,
  formatVaultDate,
  getVaultReferenceId,
  VAULT_SCOPE_DESCRIPTIONS,
  VAULT_SCOPE_LABELS,
  VAULT_SCOPE_TYPES,
  validateVaultSecretForm,
} from "@/data/vaultSecrets";

const EMPTY_FORM = {
  keyName: "",
  secretType: DEFAULT_VAULT_SCOPE,
  value: "",
};

const SCOPE_FIELD_HINT =
  "Choose where this secret applies. Agent secrets are limited to one agent; workspace secrets are available everywhere.";

const VALUE_FIELD_HINT =
  "Stored securely in your workspace. Never shown in agent code.";

function VaultField({ id, label, required, description, error, hintId, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : description ? (
        <div id={hintId} className="text-sm text-muted-foreground">
          {description}
        </div>
      ) : null}
    </div>
  );
}

export function VaultSecretDialog({
  open,
  mode,
  secret,
  existingSecrets,
  onOpenChange,
  onSubmit,
}) {
  const formId = useId();
  const keyNameId = `${formId}-key-name`;
  const keyNameHintId = `${formId}-key-name-hint`;
  const scopeId = `${formId}-scope`;
  const scopeHintId = `${formId}-scope-hint`;
  const valueId = `${formId}-value`;

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);

  const isEdit = mode === "edit";
  const referencePreview = getVaultReferenceId(form.keyName.trim() || "KEY_NAME");

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setErrors({});
      setTouched(false);
      return;
    }
    if (isEdit && secret) {
      setForm({
        keyName: secret.keyName,
        secretType: secret.secretType,
        value: "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setTouched(false);
  }, [open, isEdit, secret]);

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);

    const result = validateVaultSecretForm(existingSecrets, {
      mode,
      secretId: secret?.id,
      keyName: form.keyName,
      secretType: form.secretType,
      value: form.value,
    });

    if (Object.keys(result.errors).length > 0) {
      setErrors(result.errors);
      return;
    }

    onSubmit({
      mode,
      secretId: secret?.id,
      keyName: result.keyName,
      secretType: form.secretType,
      value: isEdit && !result.value ? secret?.value ?? "" : result.value,
    });
    onOpenChange(false);
  }

  const keyNameDescription = isEdit
    ? "Key names can't be changed after creation. Create a new secret if you need a different reference."
    : form.keyName.trim() ? (
        <>
          Reference:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            {referencePreview}
          </code>
        </>
      ) : undefined;

  const selectedScopeDescription = VAULT_SCOPE_DESCRIPTIONS[form.secretType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>{isEdit ? "Edit secret" : "Add secret"}</DialogTitle>
          <DialogDescription>
            {isEdit && secret ? (
              <>
                Update the scope or value for{" "}
                <span className="font-medium text-foreground">{secret.keyName}</span>. Key names
                can't be changed.
              </>
            ) : (
              <>
                Store a key or credential your agents and workflows can use—without exposing the
                value in code.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto px-6 py-4"
          noValidate
        >
          <div className="flex flex-col gap-4">
            {touched && errors.form ? (
              <Alert variant="destructive">
                <AlertDescription>{errors.form}</AlertDescription>
              </Alert>
            ) : null}

            {isEdit && secret?.updatedOn ? (
              <p className="text-xs text-muted-foreground">
                Last updated{" "}
                <time dateTime={secret.updatedOn}>{formatVaultDate(secret.updatedOn)}</time>
              </p>
            ) : null}

            <VaultField
              id={keyNameId}
              label="Key name"
              required
              hintId={keyNameHintId}
              error={touched ? errors.keyName : undefined}
              description={!errors.keyName ? keyNameDescription : undefined}
            >
              <Input
                id={keyNameId}
                value={form.keyName}
                disabled={isEdit}
                aria-invalid={Boolean(touched && errors.keyName)}
                aria-describedby={
                  isEdit || keyNameDescription ? keyNameHintId : undefined
                }
                placeholder="e.g. OPENAI_API_KEY"
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, keyName: e.target.value }));
                  if (touched) setErrors((prev) => ({ ...prev, keyName: undefined, form: undefined }));
                }}
              />
            </VaultField>

            <VaultField
              id={scopeId}
              label="Scope"
              required
              hintId={scopeHintId}
              error={touched ? errors.secretType : undefined}
              description={
                !errors.secretType ? (
                  <>
                    <p>{SCOPE_FIELD_HINT}</p>
                    {selectedScopeDescription ? (
                      <p className="mt-1 text-xs">{selectedScopeDescription}</p>
                    ) : null}
                  </>
                ) : undefined
              }
            >
              <Select
                value={form.secretType}
                onValueChange={(value) => {
                  setForm((prev) => ({ ...prev, secretType: value }));
                  if (touched) setErrors((prev) => ({ ...prev, secretType: undefined, form: undefined }));
                }}
              >
                <SelectTrigger
                  id={scopeId}
                  className="w-full"
                  aria-invalid={Boolean(touched && errors.secretType)}
                  aria-describedby={scopeHintId}
                >
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {VAULT_SCOPE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        <span className="flex flex-col items-start gap-0.5">
                          <span>{VAULT_SCOPE_LABELS[type]}</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            {VAULT_SCOPE_DESCRIPTIONS[type]}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </VaultField>

            <VaultField
              id={valueId}
              label="Value"
              required={!isEdit}
              error={touched ? errors.value : undefined}
              description={VALUE_FIELD_HINT}
            >
              <Textarea
                id={valueId}
                value={form.value}
                rows={4}
                className="resize-none"
                aria-invalid={Boolean(touched && errors.value)}
                placeholder={
                  isEdit ? "Leave blank to keep the current value" : "Enter secret value"
                }
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, value: e.target.value }));
                  if (touched) setErrors((prev) => ({ ...prev, value: undefined, form: undefined }));
                }}
              />
            </VaultField>
          </div>
        </form>

        <DialogFooter className="m-0 shrink-0 gap-2 rounded-none border-t border-border bg-muted/30 px-6 py-4 !mx-0 !mb-0 dark:bg-muted/20">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId}>
            {isEdit ? "Save changes" : "Add secret"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
