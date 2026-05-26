import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, X, Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** @typedef {"pending" | "accepted" | "rejected" | "edited"} DeltaState */

/**
 * @param {{
 *   documentRef: { type: string, fileName: string },
 *   deltaChanges: Array<{ field: string, label: string, previousValue: string, newValue: string, confidence?: string }>,
 *   onConfirm: (acceptedChanges: Array<{ field: string, label: string, previousValue: string, newValue: string }>) => void,
 *   onCancel: () => void,
 *   hideFooter?: boolean,
 *   onFooterStateChange?: (state: {
 *     confirm: () => void,
 *     summary: { accepted: number, rejected: number, edited: number, pending: number },
 *     hasPending: boolean,
 *     hasAccepted: boolean,
 *     applyDisabled: boolean,
 *   }) => void,
 * }} props
 */
export function ProjectDeltaComparisonView({
  documentRef,
  deltaChanges,
  onConfirm,
  onCancel,
  hideFooter = false,
  onFooterStateChange,
}) {
  const [states, setStates] = useState(() =>
    Object.fromEntries(deltaChanges.map((c) => [c.field, "pending"])),
  );
  const [editedValues, setEditedValues] = useState({});
  const [editingField, setEditingField] = useState(null);
  const [editDraft, setEditDraft] = useState("");

  const setFieldState = useCallback(
    (field, state) => {
      setStates((prev) => ({ ...prev, [field]: state }));
      if (state !== "edited") {
        setEditedValues((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
      if (editingField === field) setEditingField(null);
    },
    [editingField],
  );

  function startEdit(field, currentExtracted) {
    setEditingField(field);
    setEditDraft(editedValues[field] ?? currentExtracted);
  }

  function commitEdit(field) {
    const trimmed = editDraft.trim();
    setEditedValues((prev) => ({ ...prev, [field]: trimmed }));
    setStates((prev) => ({ ...prev, [field]: "edited" }));
    setEditingField(null);
  }

  function cancelEdit(field) {
    setEditingField(null);
    if (states[field] === "edited") return;
    setStates((prev) => ({ ...prev, [field]: "pending" }));
  }

  function acceptAll() {
    setStates(Object.fromEntries(deltaChanges.map((c) => [c.field, "accepted"])));
    setEditingField(null);
  }

  function rejectAll() {
    setStates(Object.fromEntries(deltaChanges.map((c) => [c.field, "rejected"])));
    setEditedValues({});
    setEditingField(null);
  }

  const summary = useMemo(() => {
    const counts = { accepted: 0, rejected: 0, edited: 0, pending: 0 };
    for (const s of Object.values(states)) counts[s]++;
    return counts;
  }, [states]);

  const handleConfirm = useCallback(() => {
    const accepted = deltaChanges
      .filter((c) => states[c.field] === "accepted" || states[c.field] === "edited")
      .map((c) => ({
        field: c.field,
        label: c.label,
        previousValue: c.previousValue,
        newValue:
          states[c.field] === "edited" ? (editedValues[c.field] ?? c.newValue) : c.newValue,
      }));
    onConfirm(accepted);
  }, [deltaChanges, states, editedValues, onConfirm]);

  const hasPending = summary.pending > 0;
  const hasAccepted = summary.accepted + summary.edited > 0;
  const applyDisabled = !hasAccepted && deltaChanges.length > 0;

  useEffect(() => {
    if (!onFooterStateChange) return;
    onFooterStateChange({
      confirm: handleConfirm,
      summary,
      hasPending,
      hasAccepted,
      applyDisabled,
    });
  }, [onFooterStateChange, summary, hasPending, hasAccepted, applyDisabled, handleConfirm]);

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertTitle>
          AI detected {deltaChanges.length} change{deltaChanges.length !== 1 ? "s" : ""} from{" "}
          <span className="font-semibold">{documentRef.type}</span> — {documentRef.fileName}
        </AlertTitle>
        <AlertDescription className="mt-1 flex flex-wrap gap-3">
          <span className="text-xs text-muted-foreground">
            Review each field below and accept, reject, or edit the extracted value before applying.
          </span>
          <div className="flex flex-wrap gap-2">
            {summary.accepted > 0 ? (
              <Badge variant="outline" className="border-success/40 bg-success/10 text-xs text-success-foreground">
                {summary.accepted} accepted
              </Badge>
            ) : null}
            {summary.edited > 0 ? (
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-xs text-primary">
                {summary.edited} edited
              </Badge>
            ) : null}
            {summary.rejected > 0 ? (
              <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-xs text-destructive">
                {summary.rejected} rejected
              </Badge>
            ) : null}
            {summary.pending > 0 ? (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {summary.pending} pending
              </Badge>
            ) : null}
          </div>
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">Field changes</span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={acceptAll}>
            <Check data-icon="inline-start" className="text-success" />
            Accept all
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={rejectAll}>
            <X data-icon="inline-start" className="text-destructive" />
            Reject all
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Field</TableHead>
              <TableHead>Current Value</TableHead>
              <TableHead>Extracted Value</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deltaChanges.map((change) => {
              const state = states[change.field];
              const isEditing = editingField === change.field;
              const displayExtracted =
                state === "edited" ? (editedValues[change.field] ?? change.newValue) : change.newValue;

              return (
                <TableRow key={change.field} className={rowClass(state)}>
                  <TableCell className="font-medium text-foreground">
                    {change.label}
                    {change.confidence ? (
                      <ConfidenceBadge confidence={change.confidence} />
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {change.previousValue || "—"}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          className="h-7 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit(change.field);
                            if (e.key === "Escape") cancelEdit(change.field);
                          }}
                        />
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => commitEdit(change.field)}
                          aria-label="Confirm edit"
                        >
                          <Check className="text-success" />
                        </Button>
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => cancelEdit(change.field)}
                          aria-label="Cancel edit"
                        >
                          <X />
                        </Button>
                      </div>
                    ) : (
                      <span
                        className={
                          state === "rejected"
                            ? "text-muted-foreground line-through"
                            : "font-medium text-foreground"
                        }
                      >
                        {displayExtracted || "—"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? null : (
                      <div className="flex items-center justify-end gap-1">
                        {state === "accepted" || state === "edited" || state === "rejected" ? (
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => setFieldState(change.field, "pending")}
                            aria-label="Undo"
                            title="Undo"
                          >
                            <RotateCcw />
                          </Button>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="icon-xs"
                              variant="ghost"
                              onClick={() => setFieldState(change.field, "accepted")}
                              aria-label="Accept"
                              title="Accept"
                            >
                              <Check className="text-success" />
                            </Button>
                            <Button
                              type="button"
                              size="icon-xs"
                              variant="ghost"
                              onClick={() => setFieldState(change.field, "rejected")}
                              aria-label="Reject"
                              title="Reject"
                            >
                              <X className="text-destructive" />
                            </Button>
                            <Button
                              type="button"
                              size="icon-xs"
                              variant="ghost"
                              onClick={() => startEdit(change.field, change.newValue)}
                              aria-label="Edit"
                              title="Edit"
                            >
                              <Pencil />
                            </Button>
                          </>
                        )}
                        <StateBadge state={state} />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {!hideFooter ? (
        <div className="flex flex-col gap-4">
          <Separator />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              {hasPending ? (
                <span className="text-xs text-muted-foreground">
                  {summary.pending} field{summary.pending !== 1 ? "s" : ""} not yet reviewed
                </span>
              ) : null}
              <Button type="button" onClick={handleConfirm} disabled={applyDisabled}>
                <Check data-icon="inline-start" />
                Apply {summary.accepted + summary.edited} change
                {summary.accepted + summary.edited !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function rowClass(state) {
  if (state === "accepted" || state === "edited") return "bg-success/5";
  if (state === "rejected") return "bg-muted/30 opacity-60";
  return "";
}

function ConfidenceBadge({ confidence }) {
  const variant =
    confidence === "high"
      ? "border-success/40 bg-success/10 text-success-foreground"
      : confidence === "medium"
        ? "border-primary/40 bg-primary/10 text-primary"
        : "text-muted-foreground";

  return (
    <Badge variant="outline" className={cn("ml-2 text-[10px] font-normal", variant)}>
      {confidence}
    </Badge>
  );
}

function StateBadge({ state }) {
  if (state === "accepted")
    return (
      <Badge variant="outline" className="ml-1 border-success/40 bg-success/10 text-[10px] text-success-foreground">
        Accepted
      </Badge>
    );
  if (state === "edited")
    return (
      <Badge variant="outline" className="ml-1 border-primary/40 bg-primary/10 text-[10px] text-primary">
        Edited
      </Badge>
    );
  if (state === "rejected")
    return (
      <Badge variant="outline" className="ml-1 border-destructive/40 bg-destructive/10 text-[10px] text-destructive">
        Rejected
      </Badge>
    );
  return null;
}
