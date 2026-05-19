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
      className={`flex size-9 flex-shrink-0 items-center justify-center border border-border bg-card text-muted-foreground transition-colors hover:border-border hover:text-foreground dark:border-border dark:bg-card dark:text-muted-foreground dark:hover:border-border dark:hover:text-foreground ${className}`}
      aria-label="Search"
      title="Search"
    >
      <motion.span layoutId={`${layoutId}-icon`}>
        <Search size={15} aria-hidden />
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
      className={`flex h-9 items-center gap-2 border border-border bg-card px-3 shadow-[0_0_0_3px_rgba(37,99,235,0.12)] dark:bg-card ${className}`}
    >
      <motion.span layoutId={`${layoutId}-icon`} className="text-primary flex-shrink-0">
        <Search size={14} />
      </motion.span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => e.key === "Escape" && close()}
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none dark:text-foreground dark:placeholder:text-muted-foreground"
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.12 }}
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="flex size-4 flex-shrink-0 items-center justify-center rounded-full bg-border text-muted-foreground hover:bg-muted dark:bg-border dark:text-muted-foreground dark:hover:bg-accent"
          >
            <X size={10} aria-hidden />
          </motion.button>
        )}
      </AnimatePresence>
      <button
        onClick={close}
        aria-label="Close search"
        className="ml-0.5 flex-shrink-0 text-muted-foreground transition-colors hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-foreground"
      >
        <X size={14} aria-hidden />
      </button>
    </motion.div>
  );
}

// ─── Compound export ──────────────────────────────────────────────────────────

const ExpandableSearch = { Provider, Action, Input };
export default ExpandableSearch;
