import { useState } from "react";
import { Search, Plus, Check, Database } from "lucide-react";

export const defaultHubs = [
  { id: 1, name: "VectorDB-Aurora", fileCount: 7 },
  { id: 2, name: "VectorDB-Nova", fileCount: 14 },
  { id: 3, name: "VectorDB-Zenith", fileCount: 3 },
  { id: 4, name: "VectorDB-Avalon", fileCount: 2 },
  { id: 5, name: "VectorDB-Olympus", fileCount: 9 },
  { id: 6, name: "VectorDB-Elysium", fileCount: 18 },
  { id: 7, name: "VectorDB-Arcadia", fileCount: 11 },
  { id: 8, name: "VectorDB-Nebula", fileCount: 1 },
];

export function KnowledgeHubPicker({ hubs, onHubsChange, selectedHubId, onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newHubName, setNewHubName] = useState("");
  const [error, setError] = useState("");

  const filtered = hubs.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    const trimmed = newHubName.trim();
    if (!trimmed) {
      setError("Name cannot be empty.");
      return;
    }
    if (hubs.some((h) => h.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("A hub with this name already exists.");
      return;
    }
    const newHub = { id: Date.now(), name: trimmed, fileCount: 0 };
    onHubsChange([...hubs, newHub]);
    onSelect(newHub);
    onClose?.();
  };

  return (
    <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-[6px] shadow-[0px_5px_10px_-2px_rgba(0,0,0,0.1),0px_2px_4px_-3px_rgba(0,0,0,0.1)] dark:shadow-none overflow-hidden w-[240px]">
      {/* Search */}
      <div className="border-b border-[#e2e8f0] dark:border-[#334155] flex items-center px-3 py-2.5">
        <div className="pr-2 flex-shrink-0">
          <Search size={16} className="text-[#64748b] dark:text-[#94a3b8]" />
        </div>
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Knowledge Hub..."
          aria-label="Search knowledge hubs"
          className="flex-1 text-sm text-[#0f172a] dark:text-[#f1f5f9] leading-5 outline-none placeholder:text-[#64748b] dark:placeholder:text-[#94a3b8] bg-transparent"
        />
      </div>

      {/* Hub list */}
      <div className="max-h-[132px] overflow-y-auto p-1">
        {filtered.map((hub) => (
          <button
            key={hub.id}
            onClick={() => {
              onSelect(hub);
              onClose?.();
            }}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-[4px] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
          >
            <div className="flex flex-col items-start">
              <span className="text-sm text-[#0a0a0a] leading-5">{hub.name}</span>
              <span className="text-xs text-[#64748b] dark:text-[#94a3b8] tracking-[0.12px] leading-4 whitespace-nowrap">
                {hub.fileCount === 1 ? "1 File" : `${hub.fileCount} Files`}
              </span>
            </div>
            {selectedHubId === hub.id && (
              <Check size={14} className="text-[#2563eb] flex-shrink-0" />
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-1.5 py-4 px-2">
            <Database size={20} className="text-[#cbd5e1]" />
            <p className="text-xs text-[#94a3b8] text-center">No hubs found.</p>
          </div>
        )}
      </div>

      {/* Create section */}
      <div className="border-t border-[#e2e8f0] dark:border-[#334155] p-1">
        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center justify-center gap-2 h-9 px-4 py-2 bg-white dark:bg-[#1e293b] border border-[#cbd5e1] dark:border-[#334155] rounded-[6px] hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
          >
            <Plus size={20} className="text-[#0f172a] dark:text-[#f1f5f9] flex-shrink-0" />
            <span className="text-sm font-medium text-[#0f172a] dark:text-[#f1f5f9] leading-5 whitespace-nowrap">
              Create new knowledge hub
            </span>
          </button>
        ) : (
          <div className="flex flex-col gap-1.5 p-1">
            <input
              autoFocus
              value={newHubName}
              onChange={(e) => {
                setNewHubName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Hub name..."
              className="text-sm text-[#0f172a] dark:text-[#f1f5f9] bg-white dark:bg-[#0f172a] border border-[#cbd5e1] dark:border-[#334155] rounded-[6px] px-3 py-1.5 outline-none focus:border-[#2563eb] placeholder:text-[#94a3b8] dark:placeholder:text-[#64748b]"
            />
            {error && <p className="text-xs text-[#ef4444]">{error}</p>}
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  setCreating(false);
                  setNewHubName("");
                  setError("");
                }}
                className="flex-1 text-xs font-medium text-[#64748b] dark:text-[#94a3b8] border border-[#e2e8f0] dark:border-[#334155] rounded-[6px] py-1.5 hover:bg-[#f8fafc] dark:hover:bg-[#1e293b] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 text-xs font-medium text-white bg-[#2563eb] rounded-[6px] py-1.5 hover:bg-[#1d4ed8] transition-colors"
              >
                Create &amp; select
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
