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
      className={`flex items-center justify-center size-9 bg-white border border-[#e2e8f0] text-[#64748b] hover:text-[#0f172a] hover:border-[#cbd5e1] transition-colors flex-shrink-0 ${className}`}
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
      className={`flex items-center gap-2 bg-white border border-[#2563eb] shadow-[0_0_0_3px_rgba(37,99,235,0.12)] px-3 h-9 ${className}`}
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
        className="flex-1 text-sm text-[#0f172a] placeholder:text-[#94a3b8] outline-none bg-transparent min-w-0"
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.12 }}
            onClick={() => onChange("")}
            className="flex items-center justify-center size-4 rounded-full bg-[#e2e8f0] text-[#64748b] hover:bg-[#cbd5e1] flex-shrink-0"
          >
            <X size={10} />
          </motion.button>
        )}
      </AnimatePresence>
      <button
        onClick={close}
        className="flex-shrink-0 text-[#94a3b8] hover:text-[#64748b] transition-colors ml-0.5"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ─── Compound export ──────────────────────────────────────────────────────────

const ExpandableSearch = { Provider, Action, Input };
export default ExpandableSearch;
