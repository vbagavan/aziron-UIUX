import { useState, useRef, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X } from "lucide-react";

// ─── Context ──────────────────────────────────────────────────────────────────

const SearchCtx = createContext(null);
const useSearch = () => useContext(SearchCtx);

// ─── Provider ─────────────────────────────────────────────────────────────────

function Provider({ children, value, onChange, layoutId = "expandable-search" }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const close = () => {
    setOpen(false);
    onChange("");
  };

  return (
    <SearchCtx.Provider value={{ open, setOpen, value, onChange, close, inputRef, layoutId }}>
      <div ref={containerRef} className="relative flex items-center">
        {children}
      </div>
    </SearchCtx.Provider>
  );
}

// ─── Action (trigger button, hidden when open) ────────────────────────────────

function Action({ className = "" }) {
  const { open, setOpen, layoutId } = useSearch();

  if (open) return null;

  return (
    <motion.button
      layoutId={layoutId}
      onClick={() => setOpen(true)}
      style={{ borderRadius: 6 }}
      className={`flex size-9 flex-shrink-0 items-center justify-center border border-[#e2e8f0] bg-white text-[#64748b] transition-colors hover:border-[#cbd5e1] hover:text-[#0f172a] dark:border-[#334155] dark:bg-[#1e293b] dark:text-[#94a3b8] dark:hover:border-[#475569] dark:hover:text-[#f8fafc] ${className}`}
      title="Search"
    >
      <motion.span layoutId={`${layoutId}-icon`}>
        <Search size={15} />
      </motion.span>
    </motion.button>
  );
}

// ─── Input (expanded field) ───────────────────────────────────────────────────

function Input({ placeholder = "Search…", className = "" }) {
  const { open, value, onChange, close, inputRef, layoutId } = useSearch();

  if (!open) return null;

  return (
    <motion.div
      layoutId={layoutId}
      style={{ borderRadius: 6 }}
      className={`flex h-9 items-center gap-2 border border-[#2563eb] bg-white px-3 shadow-[0_0_0_3px_rgba(37,99,235,0.12)] dark:bg-[#1e293b] ${className}`}
    >
      <motion.span layoutId={`${layoutId}-icon`} className="text-[#2563eb] flex-shrink-0">
        <Search size={14} />
      </motion.span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => e.key === "Escape" && close()}
        className="min-w-0 flex-1 bg-transparent text-sm text-[#0f172a] placeholder:text-[#94a3b8] outline-none dark:text-[#f8fafc] dark:placeholder:text-[#64748b]"
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.12 }}
            onClick={() => onChange("")}
            className="flex size-4 flex-shrink-0 items-center justify-center rounded-full bg-[#e2e8f0] text-[#64748b] hover:bg-[#cbd5e1] dark:bg-[#334155] dark:text-[#cbd5e1] dark:hover:bg-[#475569]"
          >
            <X size={10} />
          </motion.button>
        )}
      </AnimatePresence>
      <button
        onClick={close}
        className="ml-0.5 flex-shrink-0 text-[#94a3b8] transition-colors hover:text-[#64748b] dark:text-[#64748b] dark:hover:text-[#cbd5e1]"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ─── Compound export ──────────────────────────────────────────────────────────

const ExpandableSearch = { Provider, Action, Input };
export default ExpandableSearch;
