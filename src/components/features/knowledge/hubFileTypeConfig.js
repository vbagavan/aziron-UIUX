import {
  AlignLeft,
  BookOpen,
  FileCode,
  FileSpreadsheet,
  FileText,
  Files,
  Film,
  Image,
  LayoutTemplate,
  Music,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Shared file-type config used by HubLibraryView and HubAssetDetailView
// ─────────────────────────────────────────────────────────────────────────────

export const FILE_TYPE_CONFIGS = {
  PDF:        { icon: FileText,        bg: "bg-red-50    dark:bg-red-950/40",    fg: "text-red-500",    stripe: "bg-red-500",    accent: "bg-red-500/15 text-red-700 dark:text-red-400",    label: "PDF"   },
  Word:       { icon: FileText,        bg: "bg-blue-50   dark:bg-blue-950/40",   fg: "text-blue-500",   stripe: "bg-blue-500",   accent: "bg-blue-500/15 text-blue-700 dark:text-blue-400",   label: "Word"  },
  Excel:      { icon: FileSpreadsheet, bg: "bg-green-50  dark:bg-green-950/40",  fg: "text-green-600",  stripe: "bg-green-600",  accent: "bg-green-500/15 text-green-700 dark:text-green-400",  label: "Excel" },
  CSV:        { icon: FileSpreadsheet, bg: "bg-emerald-50 dark:bg-emerald-950/40",fg: "text-emerald-600",stripe: "bg-emerald-600",accent: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",label: "CSV"  },
  PowerPoint: { icon: LayoutTemplate,  bg: "bg-orange-50 dark:bg-orange-950/40", fg: "text-orange-500", stripe: "bg-orange-500", accent: "bg-orange-500/15 text-orange-700 dark:text-orange-400", label: "PPT"   },
  Video:      { icon: Film,            bg: "bg-purple-50 dark:bg-purple-950/40", fg: "text-purple-500", stripe: "bg-purple-500", accent: "bg-purple-500/15 text-purple-700 dark:text-purple-400", label: "Video" },
  Audio:      { icon: Music,           bg: "bg-pink-50   dark:bg-pink-950/40",   fg: "text-pink-500",   stripe: "bg-pink-500",   accent: "bg-pink-500/15 text-pink-700 dark:text-pink-400",   label: "Audio" },
  Image:      { icon: Image,           bg: "bg-teal-50   dark:bg-teal-950/40",   fg: "text-teal-500",   stripe: "bg-teal-500",   accent: "bg-teal-500/15 text-teal-700 dark:text-teal-400",   label: "Image" },
  Text:       { icon: AlignLeft,       bg: "bg-slate-50  dark:bg-slate-950/40",  fg: "text-slate-500",  stripe: "bg-slate-500",  accent: "bg-slate-500/15 text-slate-600 dark:text-slate-400",  label: "Text"  },
  Markdown:   { icon: AlignLeft,       bg: "bg-slate-50  dark:bg-slate-950/40",  fg: "text-slate-500",  stripe: "bg-slate-500",  accent: "bg-slate-500/15 text-slate-600 dark:text-slate-400",  label: "MD"    },
  HTML:       { icon: FileCode,        bg: "bg-amber-50  dark:bg-amber-950/40",  fg: "text-amber-500",  stripe: "bg-amber-500",  accent: "bg-amber-500/15 text-amber-700 dark:text-amber-400",  label: "HTML"  },
  eBook:      { icon: BookOpen,        bg: "bg-indigo-50 dark:bg-indigo-950/40", fg: "text-indigo-500", stripe: "bg-indigo-500", accent: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400", label: "EPUB"  },
};

export const FALLBACK_TYPE = {
  icon: Files,
  bg: "bg-muted/50",
  fg: "text-muted-foreground",
  stripe: "bg-primary",
  accent: "bg-muted text-muted-foreground",
  label: "File",
};

export function getFileTypeConfig(type) {
  if (!type) return FALLBACK_TYPE;
  return FILE_TYPE_CONFIGS[type.trim()] ?? FALLBACK_TYPE;
}
