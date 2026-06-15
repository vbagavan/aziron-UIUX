import { useState } from "react";
import { Search, Plus, Check, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKnowledgeHubs } from "@/context/KnowledgeHubContext";

export function KnowledgeHubPicker({
  hubs: hubsProp,
  onHubsChange,
  selectedHubId,
  onSelect,
  onClose,
  onRequestCreate,
  emptyHint,
}) {
  const ctx = useKnowledgeHubs();
  const hubs = hubsProp ?? ctx.pickerHubs;
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newHubName, setNewHubName] = useState("");
  const [error, setError] = useState("");

  const filtered = hubs.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async () => {
    const trimmed = newHubName.trim();
    if (!trimmed) {
      setError("Name cannot be empty.");
      return;
    }
    if (hubs.some((h) => h.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("A hub with this name already exists.");
      return;
    }
    const created = await ctx.addHub({ name: trimmed, description: "" });
    const pickerShape = {
      id: created.id,
      name: created.name,
      fileCount: created.files ?? 0,
    };
    onHubsChange?.([...hubs, pickerShape]);
    onSelect(pickerShape);
    onClose?.();
  };

  return (
    <div className="w-[240px] overflow-hidden rounded-lg border border-border bg-popover shadow-md ring-1 ring-foreground/10">
      <div className="flex items-center border-b border-border px-3 py-2.5">
        <Search size={16} className="mr-2 shrink-0 text-muted-foreground" />
        <Input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Knowledge Hubs…"
          aria-label="Search Knowledge Hubs"
          className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <div className="max-h-[min(280px,50vh)] overflow-y-auto p-1">
        {filtered.map((hub) => (
          <Button
            key={hub.id}
            type="button"
            variant="ghost"
            onClick={() => {
              onSelect(hub);
              onClose?.();
            }}
            className="h-auto w-full justify-between px-2 py-1.5 font-normal"
          >
            <div className="flex min-w-0 flex-col items-start">
              <span className="truncate text-sm leading-5">{hub.name}</span>
              <span className="text-xs text-muted-foreground">
                {hub.fileCount === 1 ? "1 file" : `${hub.fileCount} files`}
              </span>
            </div>
            {selectedHubId === hub.id && (
              <Check size={14} className="shrink-0 text-primary" />
            )}
          </Button>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-1.5 px-2 py-4">
            <Database size={20} className="text-muted-foreground" />
            <p className="text-center text-xs text-muted-foreground">
              {emptyHint ?? (search.trim() ? "No hubs match your search." : "No hubs found.")}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-border p-1">
        {!creating ? (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              if (onRequestCreate) {
                onRequestCreate();
                onClose?.();
              } else {
                setCreating(true);
              }
            }}
          >
            <Plus size={16} />
            Create Knowledge Hub
          </Button>
        ) : (
          <div className="flex flex-col gap-1.5 p-1">
            <Input
              autoFocus
              value={newHubName}
              onChange={(e) => {
                setNewHubName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Knowledge Hub name…"
              aria-label="New Knowledge Hub name"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setCreating(false);
                  setNewHubName("");
                  setError("");
                }}
              >
                Cancel
              </Button>
              <Button type="button" size="sm" className="flex-1" onClick={handleCreate}>
                Create &amp; select
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** @deprecated Import hubs from useKnowledgeHubs instead */
export const defaultHubs = [];
