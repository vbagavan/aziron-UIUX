#!/usr/bin/env python3
"""Migrate hardcoded colors to Tailwind/shadcn semantic tokens across src/."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
SKIP = {"styles/index.css", "styles/shadcn"}
SKIP_FILES = {"components/common/VoiceOrb.jsx"}  # shader gradients; hand-migrate baseFill only

# Order matters: longer / more specific first
REPLACEMENTS = [
    # Page shells
    ("bg-[#f8fafc] dark:bg-[#0f172a]", "bg-background"),
    ("dark:bg-[#0f172a]", "dark:bg-background"),
    ("dark:bg-[#111827]", "dark:bg-card"),
    ("dark:bg-[#334155]", "dark:bg-border"),
    ("dark:text-[#94a3b8]", "dark:text-muted-foreground"),
    ("dark:text-[#f1f5f9]", "dark:text-foreground"),
    ("dark:text-[#f8fafc]", "dark:text-foreground"),
    ("dark:text-[#60a5fa]", "dark:text-primary"),
    ("dark:text-[#93c5fd]", "dark:text-primary"),
    ("dark:text-[#64748b]", "dark:text-muted-foreground"),
    ("dark:text-[#cbd5e1]", "dark:text-muted-foreground"),
    ("dark:hover:bg-[#0f172a]", "dark:hover:bg-muted"),
    ("dark:hover:bg-[#1e293b]", "dark:hover:bg-muted"),
    ("dark:hover:bg-[#475569]", "dark:hover:bg-accent"),
    ("dark:hover:text-[#93c5fd]", "dark:hover:text-primary"),
    ("dark:border-[#334155]", "dark:border-border"),
    ("dark:border-[#1e293b]", "dark:border-border"),
    ("dark:border-[#1f2937]", "dark:border-border"),
    ("dark:border-[#1d4ed8]", "dark:border-primary"),
    ("dark:bg-[#1e3a8a]", "dark:bg-primary/20"),
    ("dark:bg-[#0f172a]", "dark:bg-muted"),
    ("dark:bg-[#14532d]", "dark:bg-success/20"),
    ("dark:bg-[#7f1d1d]", "dark:hover:bg-destructive/20"),
    ("dark:hover:bg-[#7f1d1d]", "dark:hover:bg-destructive/20"),
    ("dark:text-[#4ade80]", "dark:text-success"),
    ("dark:text-[#86efac]", "dark:text-success"),
    ("dark:text-[#7dd3fc]", "dark:text-info"),
    ("dark:text-[#fca5a5]", "dark:text-destructive"),
    ("dark:text-[#fecaca]", "dark:text-destructive"),
    ("dark:text-[#fde68a]", "dark:text-warning"),
    # Arbitrary hex classes
    ("bg-[#f8fafc]", "bg-muted"),
    ("bg-[#f1f5f9]", "bg-muted"),
    ("bg-[#eef2f7]", "bg-muted"),
    ("bg-[#f0fdf4]", "bg-success/10"),
    ("bg-[#ecfdf5]", "bg-success/10"),
    ("bg-[#dcfce7]", "bg-success/10"),
    ("bg-[#eff6ff]", "bg-primary/10"),
    ("bg-[#dbeafe]", "bg-primary/10"),
    ("bg-[#ede9fe]", "bg-primary/10"),
    ("bg-[#f5f3ff]", "bg-accent"),
    ("bg-[#fffbeb]", "bg-warning/10"),
    ("bg-[#fff7ed]", "bg-warning/10"),
    ("bg-[#fef2f2]", "bg-destructive/10"),
    ("bg-[#fefce8]", "bg-warning/10"),
    ("border-[#f8fafc]", "border-border"),
    ("border-[#f1f5f9]", "border-border"),
    ("border-[#eef2f7]", "border-border"),
    ("border-[#e2e8f0]", "border-border"),
    ("border-[#bfdbfe]", "border-primary/30"),
    ("border-[#bbf7d0]", "border-success-ring"),
    ("border-[#fde68a]", "border-warning-ring"),
    ("border-[#fecaca]", "border-destructive/30"),
    ("border-[#fca5a5]", "border-destructive/30"),
    ("border-[#fcd34d]", "border-warning-ring"),
    ("border-[#c4b5fd]", "border-primary/30"),
    ("border-[#93c5fd]", "border-info-ring"),
    ("border-[#cbd5e1]", "border-border"),
    ("text-[#0f172a]", "text-foreground"),
    ("text-[#64748b]", "text-muted-foreground"),
    ("text-[#94a3b8]", "text-muted-foreground"),
    ("text-[#475569]", "text-muted-foreground"),
    ("text-[#2563eb]", "text-primary"),
    ("text-[#1d4ed8]", "text-primary"),
    ("text-[#0369a1]", "text-info"),
    ("text-[#059669]", "text-success"),
    ("text-[#15803d]", "text-success"),
    ("text-[#166534]", "text-success"),
    ("text-[#16a34a]", "text-success"),
    ("text-[#dc2626]", "text-destructive"),
    ("text-[#ef4444]", "text-destructive"),
    ("text-[#b91c1c]", "text-destructive"),
    ("text-[#ea580c]", "text-warning"),
    ("text-[#d97706]", "text-warning"),
    ("text-[#a16207]", "text-warning"),
    ("text-[#b45309]", "text-warning"),
    ("text-[#7c3aed]", "text-primary"),
    ("text-[#6d28d9]", "text-primary"),
    ("hover:text-[#0f172a]", "hover:text-foreground"),
    ("hover:text-[#2563eb]", "hover:text-primary"),
    ("hover:text-[#1d4ed8]", "hover:text-primary"),
    ("hover:text-[#059669]", "hover:text-success"),
    ("hover:bg-[#f8fafc]", "hover:bg-muted"),
    ("hover:bg-[#f1f5f9]", "hover:bg-muted"),
    ("hover:bg-[#eff6ff]", "hover:bg-primary/10"),
    ("hover:bg-[#fef2f2]", "hover:bg-destructive/10"),
    ("hover:border-[#bfdbfe]", "hover:border-primary/30"),
    # Tailwind palette → semantic
    ("bg-white dark:bg-card", "bg-card"),
    ("bg-white", "bg-card"),
    ("border-white dark:border-card", "border-card"),
    ("border-white", "border-card"),
    ("bg-blue-600 hover:bg-blue-700", "bg-primary hover:bg-primary/90"),
    ("bg-blue-600 border-blue-600", "bg-primary border-primary"),
    ("bg-blue-600 text-white", "bg-primary text-primary-foreground"),
    ("bg-blue-600", "bg-primary"),
    ("bg-blue-500", "bg-primary"),
    ("bg-blue-200", "bg-primary/30"),
    ("bg-blue-100 text-blue-700", "bg-primary/15 text-primary"),
    ("bg-blue-100", "bg-primary/15"),
    ("bg-blue-50", "bg-primary/10"),
    ("text-blue-600", "text-primary"),
    ("text-blue-700", "text-primary"),
    ("border-blue-600 text-blue-600", "border-primary text-primary"),
    ("border-blue-200", "border-primary/25"),
    ("border-blue-100", "border-primary/20"),
    ("ring-blue-100", "ring-primary/20"),
    ("hover:bg-blue-50", "hover:bg-primary/10"),
    ("hover:bg-blue-700", "hover:bg-primary/90"),
    ("text-emerald-600", "text-success"),
    ("text-emerald-700", "text-success"),
    ("bg-emerald-50", "bg-success/10"),
    ("bg-emerald-500", "bg-success"),
    ("bg-emerald-100", "bg-success/15"),
    ("hover:bg-emerald-50", "hover:bg-success/10"),
    ("text-red-500", "text-destructive"),
    ("text-red-600", "text-destructive"),
    ("text-red-700", "text-destructive"),
    ("bg-red-50", "bg-destructive/10"),
    ("bg-red-500", "bg-destructive"),
    ("hover:bg-red-50", "hover:bg-destructive/10"),
    ("text-amber-600", "text-warning"),
    ("text-amber-700", "text-warning"),
    ("text-amber-800", "text-warning-foreground"),
    ("bg-amber-50 border border-amber-200", "bg-warning/10 border border-warning-ring"),
    ("bg-amber-100", "bg-warning/15"),
    ("border-amber-400", "border-warning"),
    ("bg-purple-50", "bg-accent"),
    ("text-purple-600", "text-primary"),
    ("bg-green-400/20 text-green-300", "bg-success/20 text-success"),
    ("text-green-300", "text-success"),
    ("text-blue-200", "text-primary/80"),
    ("from-blue-50 to-indigo-50 border border-blue-100", "from-primary/5 to-info/10 border border-info-ring"),
    ("from-blue-50 to-indigo-50", "from-primary/5 to-info/10"),
    ("w-px h-6 bg-[#e2e8f0]", "w-px h-6 bg-border"),
    ("focus:ring-blue-400", "focus:ring-ring"),
    ("placeholder-[#94a3b8]", "placeholder:text-muted-foreground"),
    ("fill-[#94a3b8]", "fill-muted-foreground"),
    ("? \"bg-white text-foreground shadow-sm\"", "? \"bg-card text-foreground shadow-sm\""),
    ("? \"bg-white text-[#0f172a] shadow-sm\"", "? \"bg-card text-foreground shadow-sm\""),
    # Misc
    ("bg-[#e2e8f0]", "bg-border"),
    ("bg-[#2563eb]", "bg-primary"),
    ("bg-[#22c55e]", "bg-success"),
    ("bg-[#ef4444]", "bg-destructive"),
]

CHART_REPLACEMENTS = [
    ('stroke="#f1f5f9"', "stroke=\"var(--border)\""),
    ('stroke="#eef2f7"', "stroke=\"var(--border)\""),
    ('fill: "#94a3b8"', "fill: \"var(--muted-foreground)\""),
    ('fill="#94a3b8"', "fill=\"var(--muted-foreground)\""),
    ('border: "1px solid #e2e8f0"', "border: \"1px solid var(--border)\""),
    ('fill="#2563eb"', "fill=\"var(--primary)\""),
    ('fill="#bfdbfe"', "fill=\"var(--chart-chart-2)\""),
    ('stroke="#2563eb"', "stroke=\"var(--primary)\""),
    ('fill: "#2563eb"', "fill: \"var(--primary)\""),
    ('fill="#a855f7"', "fill=\"var(--chart-chart-4)\""),
    ('stroke="#a855f7"', "stroke=\"var(--chart-chart-4)\""),
    ('fill="#ef4444"', "fill=\"var(--destructive)\""),
    ('stroke="#ef4444"', "stroke=\"var(--destructive)\""),
]


# Quoted hex / SVG attribute values → CSS variables (phase 3)
HEX_STRING_MAP = {
    "#2563eb": "var(--primary)",
    "#3b82f6": "var(--primary)",
    "#60a5fa": "var(--chart-chart-2)",
    "#93c5fd": "var(--chart-chart-2)",
    "#bfdbfe": "var(--chart-chart-2)",
    "#1d4ed8": "var(--primary)",
    "#4f46e5": "var(--primary)",
    "#6366f1": "var(--chart-chart-3)",
    "#818cf8": "var(--chart-chart-3)",
    "#8b5cf6": "var(--chart-chart-4)",
    "#a855f7": "var(--chart-chart-4)",
    "#7c3aed": "var(--chart-chart-4)",
    "#6d28d9": "var(--chart-chart-4)",
    "#9333ea": "var(--chart-chart-4)",
    "#c4b5fd": "var(--chart-chart-4)",
    "#a78bfa": "var(--chart-chart-4)",
    "#ede9fe": "var(--accent)",
    "#ec4899": "var(--destructive)",
    "#f43f5e": "var(--destructive)",
    "#fb7185": "var(--destructive)",
    "#f87171": "var(--destructive)",
    "#dc2626": "var(--destructive)",
    "#be185d": "var(--destructive)",
    "#ef4444": "var(--destructive)",
    "#10b981": "var(--success)",
    "#059669": "var(--success)",
    "#14b8a6": "var(--success)",
    "#0d9488": "var(--success)",
    "#0f766e": "var(--success)",
    "#06b6d4": "var(--info)",
    "#0891b2": "var(--info)",
    "#0ea5e9": "var(--info)",
    "#0284c7": "var(--info)",
    "#38bdf8": "var(--info)",
    "#84cc16": "var(--success)",
    "#ca8a04": "var(--warning)",
    "#fef9c3": "var(--warning)/20",
    "#f0fdf4": "var(--success)/10",
    "#fee2e2": "var(--destructive)/10",
    "#334155": "var(--border)",
    "#475569": "var(--muted-foreground)",
    "#64748b": "var(--muted-foreground)",
    "#94a3b8": "var(--muted-foreground)",
    "#ff4fb3": "var(--destructive)",
    "#ff8ad8": "var(--destructive)",
    "#ffffff": "var(--primary-foreground)",
    # "#fff" omitted — too short; risks partial matches inside longer hex
    "#0d0d0d": "var(--foreground)",
    "#1a1500": "var(--foreground)",
    "#c9a227": "var(--warning)",
    "#e8c84a": "var(--warning)",
    "#f4ecff": "var(--accent)",
    "#fecaca": "var(--destructive-ring)",
    "#e11d48": "var(--destructive)",
    "#fefce8": "var(--warning)/10",
    "#fdf2f8": "var(--destructive)/10",
    "#fff7ed": "var(--warning)/10",
    "#f0f9ff": "var(--info)/10",
    "#faf5ff": "var(--accent)",
    "#fff1f2": "var(--destructive)/10",
    "#fef3c7": "var(--warning)/20",
    "#f0f4ff": "var(--primary)/10",
    "#eab308": "var(--warning)",
    "#f0f7ff": "var(--primary)/10",
    "#a16207": "var(--warning)",
    "#e0f2fe": "var(--info)/10",
    "#047857": "var(--success)",
    "#0e7490": "var(--info)",
    "#c2410c": "var(--warning)",
    "#4338ca": "var(--chart-chart-3)",
    "#4d7c0f": "var(--success)",
    "#7c2d12": "var(--warning)",
    "#581c87": "var(--chart-chart-4)",
    "#0c4a6e": "var(--info)",
    "#1e3a5f": "var(--foreground)",
    "#14532d": "var(--success)",
    "#86efac": "var(--success)",
    "#166534": "var(--success)",
    "#0f0a1a": "var(--foreground)",
    "#e5e7eb": "var(--border)",
    "#DC2626": "var(--destructive)",
    "#FEE2E2": "var(--destructive)/10",
    "#DBEAFE": "var(--primary)/10",
    "#D1FAE5": "var(--success)/10",
    "#0F1835": "var(--background)",
    "#0A0F1E": "var(--background)",
    "#060A14": "var(--background)",
    "#1D4ED8": "var(--primary)",
    "#3B82F6": "var(--primary)",
    "#818CF8": "var(--chart-chart-3)",
    "#C084FC": "var(--chart-chart-4)",
    "#7dd3fc": "var(--info)",
    "#5eead4": "var(--success)",
    "#d9f99d": "var(--success)",
    "#f59e0b": "var(--warning)",
    "#f97316": "var(--warning)",
    "#22c55e": "var(--success)",
    "#16a34a": "var(--success)",
    "#dcfce7": "var(--success)/10",
    "#eff6ff": "var(--primary)/10",
    "#e2e8f0": "var(--border)",
    "#b91c1c": "var(--destructive)",
    "#d97706": "var(--warning)",
    "#b45309": "var(--warning)",
    "#92400e": "var(--warning)",
    "#2563EB": "var(--primary)",
    "#60A5FA": "var(--chart-chart-2)",
}

GRADIENT_STRING_MAP = [
    ("radial-gradient(ellipse at 30% 20%, #1a1500 0%,", "radial-gradient(ellipse at 30% 20%, var(--foreground) 0%,"),
    ("linear-gradient(135deg, #ff2056 0%, #ff6900 100%)", "linear-gradient(135deg, var(--destructive) 0%, var(--warning) 100%)"),
]

ARB_HEX_PARTS = {
    "1e293b": "card", "0f172a": "foreground", "0f172b": "foreground",
    "45556c": "muted-foreground", "62748e": "muted-foreground", "4f39f6": "primary",
    "eef2ff": "primary/10", "c6d2ff": "primary/30", "5ee9b5": "success",
    "1d293d": "foreground", "cad5e2": "border", "475569": "muted-foreground",
    "64748b": "muted-foreground", "94a3b8": "muted-foreground", "e2e8f0": "border",
    "cbd5e1": "border", "f1f5f9": "muted", "f8fafc": "background",
}


def fix_arbitrary_classes(text: str) -> str:
    for hexpart, token in ARB_HEX_PARTS.items():
        for prefix in ("bg", "text", "border", "ring", "divide", "ring-offset", "shadow", "placeholder"):
            for dark in ("", "dark:"):
                text = text.replace(f"{dark}{prefix}-[#{hexpart}]", f"{dark}{prefix}-{token}")
    text = re.sub(r"bg-\[#[0-9a-fA-F]{3,8}\]", "bg-muted", text)
    text = re.sub(r"text-\[#[0-9a-fA-F]{3,8}\]", "text-foreground", text)
    text = re.sub(r"border-\[#[0-9a-fA-F]{3,8}\]", "border-border", text)
    return text


def migrate_hex_strings(text: str) -> str:
    for old, new in sorted(HEX_STRING_MAP.items(), key=lambda x: -len(x[0])):
        text = text.replace(f'"{old}"', f'"{new}"')
        text = text.replace(f"'{old}'", f"'{new}'")
        text = text.replace(f'fill="{old}"', f'fill="{new}"')
        text = text.replace(f'stroke="{old}"', f'stroke="{new}"')
        text = text.replace(f"fill='{old}'", f"fill='{new}'")
        # uppercase SVG attrs (e.g. fill="#2563EB")
        ou = old.upper()
        nu = new
        text = text.replace(f'fill="{ou}"', f'fill="{nu}"')
        text = text.replace(f'stroke="{ou}"', f'stroke="{nu}"')
        text = text.replace(f'stopColor="{ou}"', f'stopColor="{nu}"')
    for old, new in GRADIENT_STRING_MAP:
        text = text.replace(old, new)
    return text


def migrate_content(text: str, filepath: str) -> str:
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    for old, new in CHART_REPLACEMENTS:
        text = text.replace(old, new)
    text = fix_arbitrary_classes(text)
    text = migrate_hex_strings(text)
    text = text.replace("bg-white ", "bg-card ")
    text = text.replace('bg-white"', 'bg-card"')
    text = text.replace("hover:bg-white", "hover:bg-card")
    text = text.replace("border-blue-500", "border-primary")
    text = text.replace("focus:border-blue-500", "focus:border-primary")
    text = text.replace("focus:ring-blue-50", "focus:ring-primary/10")
    # Fix double replacements from blue-500 -> primary then primary/100 bugs
    text = text.replace("bg-primary/100", "bg-primary")
    text = text.replace("text-primary/100", "text-primary")
    return text


def main():
    files = []
    for ext in ("*.jsx", "*.js", "*.tsx", "*.ts"):
        files.extend(ROOT.rglob(ext))
    changed = 0
    for f in sorted(files):
        rel = f.relative_to(ROOT.parent)
        if any(s in str(rel) for s in SKIP):
            continue
        if any(s in str(f) for s in SKIP_FILES):
            continue
        original = f.read_text(encoding="utf-8")
        updated = migrate_content(original, str(f))
        if updated != original:
            f.write_text(updated, encoding="utf-8")
            changed += 1
    print(f"Updated {changed} files")


if __name__ == "__main__":
    main()
