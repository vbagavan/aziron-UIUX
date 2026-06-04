import { cn } from "@/lib/utils";

const NODE_COLORS = {
  document: "bg-primary text-primary-foreground",
  topic: "bg-violet-500/15 text-violet-800 dark:text-violet-200 border-violet-500/30",
  person: "bg-sky-500/15 text-sky-800 dark:text-sky-200 border-sky-500/30",
  organization: "bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30",
  place: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30",
};

/**
 * Lightweight concept graph (prototype layout).
 */
export function HubKnowledgeGraph({ graph, className, onNodeClick }) {
  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];
  if (nodes.length === 0) return null;

  const doc = nodes.find((n) => n.type === "document") ?? nodes[0];
  const orbit = nodes.filter((n) => n.id !== doc.id);
  const cx = 50;
  const cy = 50;
  const radius = 38;

  const positions = new Map();
  positions.set(doc.id, { x: cx, y: cy });

  orbit.forEach((node, i) => {
    const angle = (i / Math.max(orbit.length, 1)) * Math.PI * 2 - Math.PI / 2;
    positions.set(node.id, {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  });

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-border bg-muted/20", className)}>
      <svg viewBox="0 0 100 100" className="h-[280px] w-full" aria-hidden>
        {edges.map((edge, i) => {
          const from = positions.get(edge.from);
          const to = positions.get(edge.to);
          if (!from || !to) return null;
          return (
            <line
              key={`${edge.from}-${edge.to}-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="currentColor"
              strokeOpacity={0.2}
              strokeWidth={0.4}
            />
          );
        })}
      </svg>

      <div className="absolute inset-0">
        {nodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          const isCenter = node.id === doc.id;
          return (
            <button
              key={node.id}
              type="button"
              title={node.label}
              onClick={() => onNodeClick?.(node)}
              className={cn(
                "absolute max-w-[88px] -translate-x-1/2 -translate-y-1/2 truncate rounded-full border px-2 py-1 text-[9px] font-medium transition-transform hover:scale-105",
                NODE_COLORS[node.type] ?? NODE_COLORS.topic,
                isCenter && "max-w-[100px] text-[10px] font-semibold shadow-sm",
              )}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              {node.label}
            </button>
          );
        })}
      </div>

      <p className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
        Click a node to explore relationships. Lines show how concepts connect to this document.
      </p>
    </div>
  );
}
