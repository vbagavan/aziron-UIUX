import { Settings, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const TAG_COLORS = [
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
];

function TagPill({ label, colorClass, onRemove }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", colorClass)}>
      {label}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove tag ${label}`}
          className="flex size-3.5 items-center justify-center rounded-full opacity-60 hover:opacity-100">
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

/**
 * Hub name, description, tags, and delete — opened from workspace header.
 */
export function HubSettingsSheet({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onSave,
  onDelete,
  canEdit,
  canDelete,
  detailsDirty,
  onNameBlur,
  onDescriptionBlur,
}) {
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  if (!canEdit && !canDelete) return null;

  function addTag() {
    const val = tagInput.trim();
    if (!val || tags.includes(val)) { setTagInput(""); return; }
    setTags((prev) => [...prev, val]);
    setTagInput("");
  }

  function removeTag(t) {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  function handleTagKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button type="button" variant="outline" size="sm" className="gap-1.5">
            <Settings className="size-3.5" aria-hidden />
            Hub settings
          </Button>
        }
      />
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Hub settings</SheetTitle>
          <SheetDescription>
            Configure this hub's identity, tags, and danger zone. Changes to name and description save automatically when you leave a field.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-5 px-4">
          {canEdit && (
            <>
              {/* Identity */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Identity</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="hub-settings-name">Name</Label>
                    <Input
                      id="hub-settings-name"
                      value={name}
                      onChange={(e) => onNameChange(e.target.value)}
                      onBlur={onNameBlur}
                      placeholder="Hub name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hub-settings-description">Description</Label>
                    <textarea
                      id="hub-settings-description"
                      value={description}
                      onChange={(e) => onDescriptionChange(e.target.value)}
                      onBlur={onDescriptionBlur}
                      placeholder="Describe what this hub is for. Agents use this context."
                      rows={3}
                      className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                    />
                  </div>
                  {detailsDirty ? (
                    <Button type="button" size="sm" onClick={onSave}>
                      Save changes
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">All changes saved.</p>
                  )}
                </div>
              </section>

              {/* Tags */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags</p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Add a tag… (Enter to add)"
                        className="pl-8 text-sm"
                      />
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={!tagInput.trim()}>
                      Add
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tags.map((t, i) => (
                        <TagPill key={t} label={t} colorClass={TAG_COLORS[i % TAG_COLORS.length]} onRemove={() => removeTag(t)} />
                      ))}
                    </div>
                  )}
                  {tags.length === 0 && (
                    <p className="text-xs text-muted-foreground">No tags yet. Tags help filter hubs and guide agents.</p>
                  )}
                </div>
              </section>

              {/* Chat behavior */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Default chat behavior</p>
                <div className="space-y-2">
                  {[
                    { id: "all", label: "All sources in context", desc: "Every file is included by default when chatting." },
                    { id: "selected", label: "Selected sources only", desc: "Only checked files are included — user controls context." },
                  ].map((opt) => (
                    <label key={opt.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/40">
                      <input type="radio" name="chat-scope" value={opt.id} defaultChecked={opt.id === "selected"}
                        className="mt-0.5 accent-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Danger zone */}
          {canDelete && (
            <section className="border-t border-border pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-destructive">Danger zone</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="size-3.5" aria-hidden />
                Delete hub
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Deleting a hub removes all files and detaches it from linked agents. This cannot be undone.
              </p>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
