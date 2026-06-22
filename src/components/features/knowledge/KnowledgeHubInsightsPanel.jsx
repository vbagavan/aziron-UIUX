import { AlertTriangle, Sparkles, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getHubInsights } from "@/data/hubInsightsData";

function ThemeRow({ label, score, note, onClick }) {
  const pct = Math.round(score * 100);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-1.5 rounded-lg border border-transparent p-2 text-left transition-colors hover:border-border hover:bg-muted/40"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13.5px] font-medium text-foreground">{label}</span>
        <span className="text-xs font-semibold text-primary">{pct}%</span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[12.5px] leading-relaxed text-muted-foreground">{note}</p>
    </button>
  );
}

export function KnowledgeHubInsightsPanel({
  hubId,
  sourceCount = 0,
  onSuggestedQuestion,
  onFindSources,
  onAddSource,
  className,
}) {
  const data = getHubInsights(hubId);

  if (!data) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        <Sparkles className="size-9 opacity-50" aria-hidden />
        <p>No synthesized insights available for this hub yet.</p>
        {onAddSource ? (
          <Button type="button" size="sm" variant="outline" onClick={onAddSource}>
            <Plus data-icon="inline-start" aria-hidden />
            Add source
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <section className="border-b border-border bg-primary/5 px-6 py-5">
        <div className="mb-2.5 flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-primary">
          <Sparkles className="size-3.5" aria-hidden />
          AI Summary · {sourceCount} source{sourceCount === 1 ? "" : "s"}
        </div>
        <p className="text-sm leading-relaxed text-foreground">{data.summary}</p>
      </section>

      <section className="border-b border-border px-6 py-5">
        <h4 className="mb-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Recurring themes
        </h4>
        <div className="flex flex-col gap-1">
          {data.themes.map((theme) => (
            <ThemeRow
              key={theme.label}
              {...theme}
              onClick={() => onFindSources?.(theme.label)}
            />
          ))}
        </div>
      </section>

      {data.gaps?.length > 0 && (
        <section className="border-b border-border px-6 py-5">
          <h4 className="mb-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Gaps detected
          </h4>
          <div className="flex flex-col gap-2.5">
            {data.gaps.map((gap) => (
              <div
                key={gap.title}
                className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3.5 py-3"
              >
                <div className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="size-3.5 text-amber-500" aria-hidden />
                  {gap.title}
                </div>
                <p className="mb-2.5 text-[12.5px] leading-relaxed text-foreground">{gap.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {onFindSources ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => onFindSources(gap.searchQuery ?? gap.title)}
                    >
                      <Search className="size-3" aria-hidden />
                      Find related sources
                    </Button>
                  ) : null}
                  {onAddSource ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={onAddSource}
                    >
                      <Plus className="size-3" aria-hidden />
                      Add source
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.questions?.length > 0 && (
        <section className="px-6 py-5">
          <h4 className="mb-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Suggested questions
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.questions.map((question) => (
              <Button
                key={question}
                type="button"
                variant="outline"
                size="sm"
                className="h-auto gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-normal"
                onClick={() => onSuggestedQuestion?.(question)}
              >
                <Sparkles className="size-3 text-primary" aria-hidden />
                {question}
              </Button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
