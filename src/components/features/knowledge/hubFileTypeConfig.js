import {
  AlignLeft,
  BookOpen,
  Database,
  FileCode,
  FileSpreadsheet,
  FileText,
  Files,
  Film,
  Image,
  LayoutTemplate,
  Music,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Shared file-type config — semantic shadcn/chart tokens only (no raw palette)
// ─────────────────────────────────────────────────────────────────────────────

const MUTED_TYPE = {
  bg: "bg-muted",
  fg: "text-muted-foreground",
  stripe: "bg-border",
  accent: "bg-secondary text-secondary-foreground",
};

const PRIMARY_TYPE = {
  bg: "bg-muted",
  fg: "text-primary",
  stripe: "bg-primary",
  accent: "bg-primary/10 text-primary",
};

export const FILE_TYPE_CONFIGS = {
  PDF:        { icon: FileText,        bg: "bg-muted", fg: "text-chart-chart-4", stripe: "bg-chart-chart-4", accent: "bg-chart-chart-4/15 text-chart-chart-4", label: "PDF"   },
  Word:       { icon: FileText,        bg: "bg-muted", fg: "text-chart-chart-2", stripe: "bg-chart-chart-2", accent: "bg-chart-chart-2/15 text-chart-chart-2", label: "Word"  },
  Excel:      { icon: FileSpreadsheet, bg: "bg-muted", fg: "text-chart-chart-3", stripe: "bg-chart-chart-3", accent: "bg-chart-chart-3/15 text-chart-chart-3", label: "Excel" },
  CSV:        { icon: FileSpreadsheet, bg: "bg-muted", fg: "text-success",       stripe: "bg-success",       accent: "bg-success/10 text-success",               label: "CSV"   },
  PowerPoint: { icon: LayoutTemplate,  bg: "bg-muted", fg: "text-chart-chart-5", stripe: "bg-chart-chart-5", accent: "bg-chart-chart-5/15 text-chart-chart-5", label: "PPT"   },
  Video:      { icon: Film,            bg: "bg-muted", fg: "text-chart-chart-1", stripe: "bg-chart-chart-1", accent: "bg-chart-chart-1/15 text-chart-chart-1", label: "Video" },
  Audio:      { icon: Music,           bg: "bg-muted", fg: "text-chart-chart-2", stripe: "bg-chart-chart-2", accent: "bg-chart-chart-2/15 text-chart-chart-2", label: "Audio" },
  Image:      { icon: Image,           bg: "bg-muted", fg: "text-info",          stripe: "bg-info",          accent: "bg-info/10 text-info",                   label: "Image" },
  Text:       { icon: AlignLeft,       ...MUTED_TYPE, label: "Text"  },
  Markdown:   { icon: AlignLeft,       ...MUTED_TYPE, label: "MD"    },
  HTML:       { icon: FileCode,        bg: "bg-muted", fg: "text-warning",       stripe: "bg-warning",       accent: "bg-warning/10 text-warning",             label: "HTML"  },
  eBook:      { icon: BookOpen,        ...PRIMARY_TYPE, label: "EPUB"  },
  Database:   { icon: Database,        bg: "bg-muted", fg: "text-chart-chart-3", stripe: "bg-chart-chart-3", accent: "bg-chart-chart-3/15 text-chart-chart-3", label: "Database" },
  API:        { icon: Zap,             bg: "bg-muted", fg: "text-info",          stripe: "bg-info",          accent: "bg-info/10 text-info",                   label: "API"      },
};

export const FALLBACK_TYPE = {
  icon: Files,
  ...MUTED_TYPE,
  stripe: "bg-primary",
  label: "File",
};

export function getFileTypeConfig(type) {
  if (!type) return FALLBACK_TYPE;
  return FILE_TYPE_CONFIGS[type.trim()] ?? FALLBACK_TYPE;
}

/** Canonical type key for filters (merges `file` / `File`, case variants). */
export function normalizeDocumentType(type) {
  if (!type) return "File";
  const trimmed = type.trim();
  if (FILE_TYPE_CONFIGS[trimmed]) return trimmed;

  const match = Object.keys(FILE_TYPE_CONFIGS).find(
    (key) => key.toLowerCase() === trimmed.toLowerCase(),
  );
  if (match) return match;

  if (trimmed.toLowerCase() === "file") return "File";
  return trimmed;
}

/** User-facing label for type filters — never duplicates the word “File”. */
export function getTypeFilterLabel(type) {
  const normalized = normalizeDocumentType(type);
  if (FILE_TYPE_CONFIGS[normalized]?.label) {
    return FILE_TYPE_CONFIGS[normalized].label;
  }
  return normalized;
}
